-- =============================================================================
-- Search Redesign — Reference Implementation Sketch
-- Companion to: 2026-10-02-search-redesign.md
-- Date: 2026-10-02
-- =============================================================================
--
-- This is written to resemble a viable production migration (idempotent,
-- transactional, multi-kind, with a lookup-table normalizer, a callable
-- suggest() RPC, a refresh routine, and grants). It is still a DRAFT:
--
--   • Run it in a dev/scratch database first.
--   • Column + table names for the non-address kinds are taken from the current
--     resolver code (src/api/search/contexts/*.js) and docs/database/. Items
--     marked CONFIRM must be checked against the live schema.
--   • Replace `simplicity_app` with the role the GraphQL server connects as.
--
-- Design (see brief): suggestions come from an index built FROM Simplicity data
-- (so they are 100% backed by construction), normalized identically at build and
-- query time (killing false negatives), with the geocoder removed from the
-- suggest/resolve path entirely.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Extension
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- typo-tolerant prefix/substring match


-- -----------------------------------------------------------------------------
-- 1. Abbreviation lookup (USPS Pub 28 — street suffixes + directionals + units)
-- -----------------------------------------------------------------------------
-- A table (not a regexp chain) so the mapping is maintainable, auditable, and
-- extensible without a code change. `variant` is the normalized token as typed;
-- `canonical` is the single form we store/match against.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS simplicity.search_token_abbrev (
    variant    text PRIMARY KEY,   -- lowercased, punctuation-stripped token
    canonical  text NOT NULL,
    category   text                 -- 'suffix' | 'directional' | 'unit' (informational)
);

INSERT INTO simplicity.search_token_abbrev (variant, canonical, category) VALUES
    -- directionals
    ('north','n','directional'), ('south','s','directional'),
    ('east','e','directional'),  ('west','w','directional'),
    ('northeast','ne','directional'), ('northwest','nw','directional'),
    ('southeast','se','directional'), ('southwest','sw','directional'),
    ('no','n','directional'), ('so','s','directional'),
    -- street suffixes (common Asheville set; extend from USPS Pub 28 Appendix C1)
    ('street','st','suffix'),   ('str','st','suffix'),
    ('avenue','ave','suffix'),  ('av','ave','suffix'),  ('aven','ave','suffix'),
    ('boulevard','blvd','suffix'), ('boul','blvd','suffix'),
    ('drive','dr','suffix'),    ('driv','dr','suffix'),
    ('road','rd','suffix'),
    ('lane','ln','suffix'),
    ('court','ct','suffix'),    ('crt','ct','suffix'),
    ('place','pl','suffix'),
    ('circle','cir','suffix'),  ('circ','cir','suffix'),
    ('terrace','ter','suffix'), ('terr','ter','suffix'),
    ('parkway','pkwy','suffix'),('pky','pkwy','suffix'),
    ('highway','hwy','suffix'),
    ('trail','trl','suffix'),
    ('cove','cv','suffix'),
    ('crossing','xing','suffix'),
    ('extension','ext','suffix'),
    ('heights','hts','suffix'),
    ('ridge','rdg','suffix'),
    ('square','sq','suffix'),
    ('trace','trce','suffix'),
    ('way','way','suffix'),
    -- unit designators
    ('apartment','apt','unit'), ('apt','apt','unit'),
    ('suite','ste','unit'),     ('ste','ste','unit'),
    ('unit','unit','unit'),     ('building','bldg','unit'),
    ('floor','fl','unit'),      ('number','','unit')  -- drop bare "number"/"#"
ON CONFLICT (variant) DO UPDATE
    SET canonical = EXCLUDED.canonical,
        category  = EXCLUDED.category;


-- -----------------------------------------------------------------------------
-- 2. Canonical normalizer
-- -----------------------------------------------------------------------------
-- Tokenizes, maps each token through search_token_abbrev, and reassembles in
-- order. Applied at BOTH index-build time and query time.
--
-- STABLE (not IMMUTABLE) because it reads a table. That is fine: the normalized
-- key is materialized into the MV at refresh time, and the query side normalizes
-- the incoming string once per call. Do NOT use this in a functional index.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION simplicity.normalize_search_text(input text)
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = simplicity, pg_catalog
AS $$
    WITH cleaned AS (
        SELECT btrim(regexp_replace(
                 regexp_replace(lower(coalesce(input, '')), '[^a-z0-9 ]', ' ', 'g'),
                 '\s+', ' ', 'g')) AS t
    ),
    tok AS (
        SELECT x.token, x.ord
        FROM cleaned
        CROSS JOIN LATERAL regexp_split_to_table(cleaned.t, ' ')
                   WITH ORDINALITY AS x(token, ord)
        WHERE x.token <> ''
    ),
    mapped AS (
        SELECT coalesce(a.canonical, t.token) AS token, t.ord
        FROM tok t
        LEFT JOIN simplicity.search_token_abbrev a ON a.variant = t.token
    )
    SELECT coalesce(
             btrim(regexp_replace(string_agg(token, ' ' ORDER BY ord), '\s+', ' ', 'g')),
             ''
           )
    FROM mapped
    WHERE token <> '';   -- drop tokens mapped to '' (e.g. "number")
$$;

-- Sanity (both expected to be '123 n main st'):
--   SELECT simplicity.normalize_search_text('123 North Main Street');
--   SELECT simplicity.normalize_search_text('123 N. Main St.');


-- -----------------------------------------------------------------------------
-- 3. Unified suggestion index (all kinds)
-- -----------------------------------------------------------------------------
-- One row per suggestible entity, UNION ALL across kinds. Column types are fixed
-- by the first branch (address); NULLs in later branches adopt them.
--
--   entity_id  = stable id passed back to resolve() — the UI never re-searches.
--   search_key = normalized text, trigram-indexed.
--   popularity = cheap ranking signal (parcel counts for owners/streets).
-- -----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS simplicity.search_suggestions;

CREATE MATERIALIZED VIEW simplicity.search_suggestions AS

-- ---- addresses ---- (coa_bc_address_master, confirmed columns) --------------
SELECT
    'address'::text                                      AS kind,
    a.civicaddress_id::text                              AS entity_id,
    a.address_full                                       AS display_text,
    simplicity.normalize_search_text(concat_ws(' ',
        a.address_number, a.address_street_prefix, a.address_street_name,
        a.address_street_type, a.address_unit, a.address_city, a.address_zipcode)
    )                                                    AS search_key,
    (a.jurisdiction_type = 'Asheville Corporate Limits')::boolean AS is_in_city,
    a.address_zipcode::text                              AS zipcode,
    a.address_city::text                                 AS city,
    a.latitude_wgs::double precision                     AS latitude,
    a.longitude_wgs::double precision                    AS longitude,
    0::int                                               AS popularity
FROM internal.coa_bc_address_master a
WHERE a.location_type IN (1, 4)
  AND a.address_full IS NOT NULL
  AND btrim(a.address_full) <> ''

UNION ALL

-- ---- streets ---- (one row per street name; resolve expands centerline_ids) --
-- CONFIRM: internal.bc_street has full_street_name, centerline_id.
SELECT
    'street', st.full_street_name, st.full_street_name,
    simplicity.normalize_search_text(st.full_street_name),
    NULL::boolean, NULL::text, NULL::text,
    NULL::double precision, NULL::double precision,
    count(*)::int
FROM internal.bc_street st
WHERE st.full_street_name IS NOT NULL AND btrim(st.full_street_name) <> ''
GROUP BY st.full_street_name

UNION ALL

-- ---- owners ---- (distinct names; popularity = parcel count) -----------------
-- CONFIRM: internal.bc_property_pinnum_formatted_owner_names(formatted_owner_name, pinnum)
SELECT
    'owner', o.formatted_owner_name, o.formatted_owner_name,
    simplicity.normalize_search_text(o.formatted_owner_name),
    NULL::boolean, NULL::text, NULL::text,
    NULL::double precision, NULL::double precision,
    count(*)::int
FROM internal.bc_property_pinnum_formatted_owner_names o
WHERE o.formatted_owner_name IS NOT NULL
  AND o.formatted_owner_name NOT ILIKE '%HELPMATE%'   -- carried over; revisit policy
GROUP BY o.formatted_owner_name

UNION ALL

-- ---- pins ---- (exact-ish id lookup; trigram still gives prefix match) -------
-- CONFIRM: internal.bc_property(pin, pinnum, cityname, zipcode) + address parts.
SELECT
    'pin', p.pinnum::text, p.pinnum::text,
    simplicity.normalize_search_text(concat_ws(' ', p.pinnum, p.pin)),
    NULL::boolean, p.zipcode::text, p.cityname::text,
    NULL::double precision, NULL::double precision,
    0::int
FROM internal.bc_property p
WHERE p.pinnum IS NOT NULL

UNION ALL

-- ---- permits ---- (prefix search on permit number) --------------------------
-- CONFIRM: simplicity.m_v_simplicity_permits(permit_number).
SELECT
    'permit', pm.permit_number::text, pm.permit_number::text,
    simplicity.normalize_search_text(pm.permit_number::text),
    NULL::boolean, NULL::text, NULL::text,
    NULL::double precision, NULL::double precision,
    0::int
FROM simplicity.m_v_simplicity_permits pm
WHERE pm.permit_number IS NOT NULL

UNION ALL

-- ---- neighborhoods ---- -----------------------------------------------------
-- CONFIRM: internal.coa_asheville_neighborhoods(name, nbhd_id, narrative).
SELECT
    'neighborhood', n.nbhd_id::text, n.name,
    simplicity.normalize_search_text(n.name),
    NULL::boolean, NULL::text, NULL::text,
    NULL::double precision, NULL::double precision,
    0::int
FROM internal.coa_asheville_neighborhoods n
WHERE n.name IS NOT NULL
  AND n.narrative IN ('Active', 'In transition');

-- Unique index REQUIRED for REFRESH ... CONCURRENTLY.
CREATE UNIQUE INDEX IF NOT EXISTS search_suggestions_kind_entity_uidx
    ON simplicity.search_suggestions (kind, entity_id);

-- Workhorse: trigram GIN accelerates both LIKE '%..%' and the % similarity op.
CREATE INDEX IF NOT EXISTS search_suggestions_search_key_trgm_idx
    ON simplicity.search_suggestions USING gin (search_key gin_trgm_ops);

CREATE INDEX IF NOT EXISTS search_suggestions_kind_idx
    ON simplicity.search_suggestions (kind);


-- -----------------------------------------------------------------------------
-- 4. suggest() — the RPC the resolver calls
-- -----------------------------------------------------------------------------
-- One round-trip, no geocoder, no per-context fan-out. Sets the pg_trgm
-- threshold transaction-locally so callers don't manage session GUCs.
-- Ranking: exact-prefix > substring > fuzzy similarity, + in-city + popularity.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION simplicity.suggest(
    p_q         text,
    p_kinds     text[] DEFAULT NULL,   -- NULL = all kinds
    p_limit     int    DEFAULT 10,
    p_threshold real   DEFAULT 0.3     -- pg_trgm similarity floor
)
RETURNS TABLE (
    kind        text,
    entity_id   text,
    display_text text,
    is_in_city  boolean,
    zipcode     text,
    city        text,
    score       real
)
LANGUAGE plpgsql
STABLE
SET search_path = simplicity, pg_catalog, public   -- public: pg_trgm lives there
AS $$
DECLARE
    nq text := simplicity.normalize_search_text(p_q);
BEGIN
    IF length(nq) < 2 THEN
        RETURN;                       -- enforce min query length server-side
    END IF;

    PERFORM set_config('pg_trgm.similarity_threshold', p_threshold::text, true);

    RETURN QUERY
    SELECT
        s.kind, s.entity_id, s.display_text, s.is_in_city, s.zipcode, s.city,
        ( CASE WHEN s.search_key LIKE nq || '%'        THEN 1.0 ELSE 0 END
        + CASE WHEN s.search_key LIKE '%' || nq || '%' THEN 0.5 ELSE 0 END
        + similarity(s.search_key, nq)
        + CASE WHEN s.is_in_city THEN 0.1 ELSE 0 END
        + least(coalesce(s.popularity, 0), 100) / 1000.0
        )::real AS score
    FROM simplicity.search_suggestions s
    WHERE (p_kinds IS NULL OR s.kind = ANY(p_kinds))
      AND (s.search_key LIKE '%' || nq || '%' OR s.search_key % nq)
    ORDER BY score DESC, s.display_text
    LIMIT greatest(p_limit, 1);
END;
$$;

-- Resolver usage:
--   SELECT * FROM simplicity.suggest($1, $2, $3);   -- q, kinds[], limit


-- -----------------------------------------------------------------------------
-- 5. resolve() — accept a suggestion → entity + context card, BY ID
-- -----------------------------------------------------------------------------
-- No fuzzy match, no geocoder. Address resolution is a single PK lookup because
-- coa_bc_address_master is already denormalized (owner/pin/neighborhood/zoning/
-- jurisdiction live on the row). Other kinds resolve against their own tables.
--
-- Kept as a plain query (not a function) because the shape differs per kind and
-- the GraphQL layer will likely map each kind to its own loader. CONFIRM there
-- is an index on coa_bc_address_master.civicaddress_id.
-- -----------------------------------------------------------------------------
--  Example — resolve an address context card:
--
--  SELECT a.civicaddress_id, a.address_full, a.address_city, a.address_zipcode,
--         a.latitude_wgs, a.longitude_wgs,
--         (a.jurisdiction_type = 'Asheville Corporate Limits') AS is_in_city,
--         a.owner_name, a.property_pin, a.property_pinext, a.centerline_id,
--         a.nbrhd_id, a.nbrhd_name, a.zoning, a.zoning_links,
--         a.historic_district, a.local_landmark
--  FROM internal.coa_bc_address_master a
--  WHERE a.civicaddress_id::text = $1 AND a.location_type IN (1, 4);
--
--  Lazy-loaded panels (separate queries, fired after the card renders):
--    • permits        -> m_v_simplicity_permits / *_along_street, key on
--                        centerline_id or civicaddress_id (CONFIRM path)
--    • same street    -> search_suggestions / master filtered by centerline_id
--    • owner's parcels-> property/owner tables keyed by property_pin(num)
--                        (CONFIRM pinnum vs pin+pinext)


-- -----------------------------------------------------------------------------
-- 6. Refresh routine
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION simplicity.refresh_search_suggestions()
RETURNS void
LANGUAGE plpgsql
SET search_path = simplicity, pg_catalog
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY simplicity.search_suggestions;
END;
$$;

-- Schedule (pg_cron). Addresses/owners change slowly; permits are volatile — if
-- that matters, split permits into their own MV with a tighter cadence and
-- UNION at query time.
--   SELECT cron.schedule('refresh-search-suggestions',
--                        '*/30 * * * *',
--                        $$SELECT simplicity.refresh_search_suggestions()$$);


-- -----------------------------------------------------------------------------
-- 7. Grants  (replace simplicity_app with the GraphQL server's DB role)
-- -----------------------------------------------------------------------------
GRANT USAGE  ON SCHEMA simplicity TO simplicity_app;
GRANT SELECT ON simplicity.search_suggestions   TO simplicity_app;
GRANT SELECT ON simplicity.search_token_abbrev  TO simplicity_app;
GRANT EXECUTE ON FUNCTION simplicity.suggest(text, text[], int, real)  TO simplicity_app;
GRANT EXECUTE ON FUNCTION simplicity.normalize_search_text(text)       TO simplicity_app;

COMMIT;


-- =============================================================================
-- Rollout notes
-- =============================================================================
--  • First refresh is NOT concurrent — run once non-concurrently to populate:
--      REFRESH MATERIALIZED VIEW simplicity.search_suggestions;
--  • Tune p_threshold against real queries; measure p95 latency of suggest()
--    vs. the current geocoder path before cutting over.
--  • Keep the existing geocoder-backed search() for raw-text submit that matched
--    no suggestion — that is the only place the geocoder should remain.
--
-- Pre-extend checklist (confirm against live schema):
--   1. Index on coa_bc_address_master.civicaddress_id (resolve path).
--   2. bc_street.full_street_name / centerline_id column names.
--   3. bc_property: pinnum vs pin+pinext as the owner/property join key.
--   4. m_v_simplicity_permits.permit_number type/name.
--   5. coa_asheville_neighborhoods.nbhd_id spelling (code uses nbhd_id; the
--      address master uses nbrhd_id — reconcile).
-- =============================================================================
