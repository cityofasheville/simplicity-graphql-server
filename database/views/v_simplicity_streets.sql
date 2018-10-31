-- View: simplicity.v_simplicity_streets

-- DROP VIEW simplicity.v_simplicity_streets;

CREATE OR REPLACE VIEW simplicity.v_simplicity_streets AS
 SELECT a.centerline_id,
    a.full_street_name,
    a.lzip AS left_zipcode,
    a.rzip AS right_zipcode,
    a.left_from_address,
    a.right_from_address,
    a.left_to_address,
    a.right_to_address,
    st_astext(st_transform(a.shape, 4326)) AS line
   FROM internal.bc_street a;


