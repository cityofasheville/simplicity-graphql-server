# Search Redesign Brief: Suggest / Resolve / Search

**Date:** 2026-10-02
**Author:** Rick Barley (with Claude Code)
**Audience:** Dev team (Rick, Al, Cameron, Tom)
**Status:** Draft for discussion — not yet scheduled

> ⚠️ AI-assisted draft. Read and verify before acting on it. Treat SQL, column
> names, and table references as *claims to confirm* against the live schema —
> some are reconstructed from `docs/database/` and may lag the database.

---

## 1. Problem statement

Search in `src/api/search` has two structural weaknesses that compound each other.

**Reliability.** For the `address`, `property`, and `street` contexts, the
ArcGIS geocoder is both the parser *and* the fuzzy matcher. The database only
confirms the geocoder's parsed output via **exact-equality joins** against
`internal.coa_bc_address_master` (see
[`get_search_addresses.sql`](../database/functions/get_search_addresses.sql)).
This produces failures in both directions:

- **Ghost suggestions** — the ArcGIS locator is a *separate dataset* from
  `coa_bc_address_master`, built on a different cadence. It can suggest
  addresses that aren't in Simplicity → exact join returns zero rows → the user
  accepts a suggestion that resolves to nothing.
- **False negatives** — an address that *is* in Simplicity gets dropped because
  the geocoder's normalization disagrees by one token (`St` vs `Street`, `N` vs
  `North`, a `1/2` suffix, a hyphenated unit, casing). Exact `=` with no fuzzy
  fallback hides a valid record silently.

**UX model mismatch.** The app moved from type-ahead-full-search (multi-second
requests per keystroke) to debounced *suggest* + *search-on-submit*. But an
accepted suggestion is almost always a **specific record**, not a search term —
yet accepting it still re-runs a fuzzy search to (usually) return that one
record. That round-trip is where the geocoder re-enters and where dead-ends are
born. Address suggestions currently come **only** from the geocoder; other
contexts' suggestions come from the Simplicity DB.

## 2. Target model: three distinct modes

Settle the vocabulary first — it drives every downstream decision.

| Mode | User intent | Backing | Geocoder? |
|------|-------------|---------|-----------|
| **Suggest** | "Which known Simplicity entity do you mean?" | Dedicated suggestion index built *from* Simplicity data | No |
| **Resolve** | "Take me to that entity (by ID) and its context" | Deterministic joins on stable IDs | No |
| **Search** | "I typed free text — go find things" | Fuzzy match + optional geocoder | Yes (only here) |

Core principles:

1. **Suggestions are 100% Simplicity-backed by construction** — they come from an
   index derived from Simplicity tables, so ghosts become structurally
   impossible.
2. **Accepting a suggestion resolves by ID** — no second fuzzy search. This
   removes the geocoder from the accept path and eliminates the dead-end.
3. **The geocoder is reserved for genuine geocoding** — free-form external input
   and rooftop coordinates — not for suggesting entities we already hold.
4. **Results are enriched** — a resolved entity carries its relationships (owner,
   parcel, neighborhood, street, jurisdiction, permits), turning a result into a
   navigable hub.

---

## 3. (a) Underlying data changes

### 3.1 Unified suggestion index

Build a denormalized, display-ready suggestion store — a materialized view (or
table maintained by refresh/trigger) with **one row per suggestible entity**.

Proposed shape (confirm column sources against live schema):

```
simplicity.search_suggestions
  kind            text         -- 'address' | 'street' | 'owner' | 'pin' | 'permit' | 'neighborhood'
  entity_id       text         -- civic_address_id | centerline_id | pinnum | permit_number | nbhd_id
  display_text    text         -- canonical, user-facing label
  search_key      text         -- normalized text used for matching (see 3.2)
  is_in_city      boolean      -- jurisdiction badge/filter
  zipcode         text
  city            text
  popularity      int          -- optional: from query/click logs, for ranking
  -- plus any minimal fields needed to render a suggestion row without a join
```

- **One `pg_trgm` GIN index** on `search_key` (typo-tolerant prefix/substring),
  stays in Postgres, no new infra.
- Source rows from the real tables: `coa_bc_address_master` (addresses),
  `v_simplicity_streets` / `bc_street` (streets),
  `bc_property_pinnum_formatted_owner_names` (owners), `bc_property` (pins),
  `m_v_simplicity_permits` (permits), `coa_asheville_neighborhoods`
  (neighborhoods).
- Decide refresh strategy: scheduled `REFRESH MATERIALIZED VIEW CONCURRENTLY`
  vs. triggers on source changes. Addresses/owners change slowly; permits change
  often (already a materialized view).

### 3.2 Canonical normalizer (the fix for false negatives)

Write **one** normalization function and apply it at *both* index-build and
query time:

- USPS-style street-type abbreviations (Street↔St, Avenue↔Ave, …)
- Directional abbreviations (North↔N, …)
- Casing, punctuation, whitespace collapse
- Unit handling (`#`, `Apt`, `Unit`, `1/2`)

Implement as a Postgres function (`simplicity.normalize_search_text(text)`) so
both the stored `search_key` and the incoming query pass through identical logic.
This is what removes the dependency on whatever the geocoder happens to emit.

### 3.3 Enrichment / relationship joins

Resolution needs deterministic lookups keyed by stable IDs. Confirm/define the
join paths for the **address context card**:

- address → owner(s) (via parcel/PIN)
- address → parcel / PIN
- address → neighborhood (spatial or precomputed)
- address → street / centerline
- address → permits (existing `*_along_street` / permit views)
- address → jurisdiction (`is_in_city`), zoning, historic overlay

Prefer **precomputed relationship columns/tables** over per-request spatial
joins where the relationship is stable (e.g. address→neighborhood).

### 3.4 Pick the canonical entity

Today `address`, `property`, `pin`, and `civicAddressId` are four result types
that often point at the same real-world thing. Choose the canonical entity
(likely the parcel or civic address) and express the others as facets/relations
rather than exposing the data-model seams in the UI.

---

## 4. (b) API / resolver changes

### 4.1 Split the single `search` query into three operations

Current: one `search(searchString, searchContexts)` resolver fans out across
contexts, serializing a geocoder HTTP call before any DB work
([`resolvers.js`](../../src/api/search/resolvers.js)).

Proposed GraphQL surface:

```graphql
# Fast typeahead — indexed, no geocoder
suggest(q: String!, kinds: [SuggestionKind!], limit: Int = 10): [Suggestion!]!

# Accept a suggestion → resolve by ID + enriched context card
resolve(kind: SuggestionKind!, id: ID!): ResolvedEntity

# Free-text fallback — the only place the geocoder lives
search(q: String!, contexts: [SearchContext!]!): [TypedSearchResult!]!
```

- `suggest` → single query against `search_suggestions` with the trigram index,
  ranked, returning top-k (optionally per kind). No per-context fan-out, no
  external call.
- `resolve` → deterministic joins; returns the entity plus lazy-loadable related
  panels (see UI §5). Consider returning the core entity synchronously and
  exposing relationships as separately-resolved fields so the client can
  progressively load them.
- `search` → keep for raw-text submit that didn't match a suggestion; this is
  where the geocoder path (today's `address`/`property`/`street` logic) stays.

### 4.2 Add real ranking

Every result today is hardcoded `score: 0`. Populate `score` in `suggest`:
exact-prefix > substring/trigram similarity, with boosts for `is_in_city`,
`popularity`, and recency. Return the matched span so the UI can highlight it.

### 4.3 Caching & guards

- Short-TTL cache keyed by `(normalized q, kinds)` for `suggest` — popular
  prefixes dominate typeahead traffic. (Only `cip_resolvers.js` caches anything
  today.)
- Enforce a server-side min query length.
- Per-request logging: operation, kinds/contexts, result count, **zero-result
  rate**, latency. Zero-result rate on address/street is a direct proxy for the
  two failure modes.

### 4.4 Correctness fixes to fold in (confirm each)

- **Street zip likely always null** — `searchStreet.js` reads `row.lzip`/`row.rzip`
  but the query selects `left_zipcode`/`right_zipcode`.
- **City filter disabled** — `searchAddress.js` passes `locCity.map(c => '')`
  (array of empty strings). Looks intentional; decide if it should stay.
- **Casts defeat indexes** — `cast(... as TEXT) = $1` in `searchPin`,
  `searchCivicAddressId`, and `cast(permit_number as TEXT) LIKE` in
  `searchPermit`. Use expression indexes or match parameter types.
- **Owner search** — leading-wildcard `ILIKE '%token%'` → full scan; replace with
  `pg_trgm`. Also revisit the hardcoded `HELPMATE` filter ("review by Aug 1,
  2019").
- **`searchPlace` is dead** — empty Google API key. Decide: wire a key, or
  remove the context.

---

## 5. (c) UI changes

### 5.1 Separate "jump to record" from "search for text"

- Accepting a highlighted suggestion → **resolve by ID** (navigate to the entity),
  not a re-search.
- Submitting typed text that matches no suggestion → **search**.
- Consider showing an explicit "Search for '123 Main' across all records" row at
  the bottom of the suggestion list so both intents are always reachable.

### 5.2 Suggestion list presentation

- **Group by kind** with headers; a few per kind rather than a flat list.
- **Highlight the matched substring** in each row.
- Show enough context to disambiguate (address + zip + city; owner + property
  count; street + zip).
- **Jurisdiction badge** (in / out of corporate limits) using `is_in_city`.

### 5.3 Enriched result = entity context card

On resolve, render the canonical entity, then **progressively load** related
panels (don't block the primary record on expensive joins):

- Owner(s), parcel/PIN, neighborhood, street, zoning, jurisdiction, permits.
- **Every related item is itself navigable** (owner → their properties; street →
  its addresses; neighborhood → everything within). This quietly adds a
  browse/explore mode on top of search.

### 5.4 Dead-ends as guidance

Never show a bare blank. On empty suggest/resolve/search: "Did you mean…",
nearest matches, or "This address isn't in City records — it may be outside
corporate limits."

### 5.5 Perceived-performance & accessibility

- Keep debounce; add min query length; keep previous results visible while
  fetching; show skeletons.
- **Cancel/ignore stale in-flight requests** so a slow earlier keystroke can't
  overwrite a newer one (classic typeahead race).
- **Recent / pinned** entities for repeat (staff) users.
- **Accessibility is a requirement, not polish**: ARIA combobox semantics, full
  keyboard nav, adequate touch targets — this is a public City of Asheville app
  with ADA / Section 508 obligations.

---

## 6. Suggested phasing

1. **Measure first.** Add logging (zero-result rate, latency, accepted-suggestion
   vs. submitted-text) to the current resolvers. Confirm where front-end address
   suggestions originate today and quantify ArcGIS-vs-`coa_bc_address_master`
   drift.
2. **Prototype the index.** Build `search_suggestions` + normalizer + `pg_trgm`
   for **addresses only**; A/B its suggestion quality and latency against the
   geocoder path.
3. **Add `suggest` + `resolve-by-ID`** for addresses; wire the UI to resolve
   instead of re-search.
4. **Extend** the index to streets, owners, pins, permits, neighborhoods; fold in
   the correctness fixes.
5. **Enrichment** — build the address context card and relationship joins.
6. **Retire or repair** `searchPlace`; prune unused contexts per the usage data.

## 7. Open questions

- Where do front-end suggestions actually originate today (direct ArcGIS call vs.
  this GraphQL API)? Determines whether ghosts or false-negatives dominate.
- What is the ArcGIS locator's source and refresh cadence vs.
  `coa_bc_address_master`?
- Canonical entity: parcel or civic address?
- Index freshness: materialized-view refresh vs. triggers — acceptable staleness
  per kind?
- Do we keep `place` (Google) at all?
- Is a dedicated search engine (Typesense / Meilisearch / OpenSearch) ever
  justified, or is `pg_trgm` sufficient? (Default assumption: `pg_trgm` is
  enough; revisit only if typeahead becomes a core product surface.)

---

*Governance note: outputs of this work touch public address/parcel data. Verify
address-matching changes against known edge cases before shipping — silent
exact-match drops are invisible until a constituent can't find their own
property. This document may be a public record under N.C.G.S. §132.*
