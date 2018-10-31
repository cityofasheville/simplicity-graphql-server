-- View: simplicity.v_coa_simple_street_maintenance

-- DROP VIEW simplicity.v_coa_simple_street_maintenance;

CREATE OR REPLACE VIEW simplicity.v_coa_simple_street_maintenance AS
 SELECT b.centerline_id,
    b.maintenance_entity,
    b.shape
   FROM ( SELECT a.centerline_id,
            a.maintenance_entity,
            a.dump,
            (a.dump).geom AS shape,
            (a.dump).path AS path
           FROM ( SELECT to_number(coa_street_maintenance.centerline_id::text, '9999999999.000000'::text) AS centerline_id,
                    coa_street_maintenance.maintenance_entity,
                    st_dump(coa_street_maintenance.shape) AS dump
                   FROM internal.coa_street_maintenance) a) b;


