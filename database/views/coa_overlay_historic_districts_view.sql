-- View: amd.coa_overlay_historic_districts_view

-- DROP VIEW amd.coa_overlay_historic_districts_view;

CREATE OR REPLACE VIEW amd.coa_overlay_historic_districts_view AS
 SELECT coa_zoning_overlays.shape,
    coa_zoning_overlays.objectid,
    coa_zoning_overlays.name,
    coa_zoning_overlays.narrative,
    st_area(coa_zoning_overlays.shape)::numeric(38,8) AS st_squarefeet,
    (st_area(coa_zoning_overlays.shape)::numeric(38,8) / 27878400::numeric)::numeric(38,8) AS st_squaremiles,
    (st_area(coa_zoning_overlays.shape)::numeric(38,8) / 43560::numeric)::numeric(38,8) AS st_acreage
   FROM amd.coa_zoning_overlays
  WHERE coa_zoning_overlays.overlay_type::text = 'HISTORIC DISTRICTS'::text AND coa_zoning_overlays.status::text = 'CURRENT'::text;

