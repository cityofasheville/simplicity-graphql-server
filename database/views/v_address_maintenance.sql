-- View: amd.v_address_maintenance

-- DROP VIEW amd.v_address_maintenance;

CREATE OR REPLACE VIEW amd.v_address_maintenance AS
 SELECT address_maintenance.civicaddress_id,
    address_maintenance.centerline_id,
    address_maintenance.maintenance_entity,
    address_maintenance.location,
    address_maintenance.shape
   FROM ( SELECT st_linelocatepoint(m.shape, a.shape) AS location,
            a.civicaddress_id,
            m.centerline_id,
            m.maintenance_entity,
            m.shape
           FROM amd.v_coa_simple_street_maintenance m
             LEFT JOIN amd.coa_bc_address_master a ON m.centerline_id = a.centerline_id) address_maintenance;
