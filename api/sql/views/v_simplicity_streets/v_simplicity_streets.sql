-- View: amd.v_simplicity_streets

-- DROP VIEW amd.v_simplicity_streets;

CREATE OR REPLACE VIEW amd.v_simplicity_streets AS
 SELECT a.centerline_id,
    a.full_street_name,
    a.lzip AS left_zipcode,
    a.rzip AS right_zipcode,
    st_astext(st_transform(a.shape, 4326)) AS line
   FROM amd.bc_street a;

