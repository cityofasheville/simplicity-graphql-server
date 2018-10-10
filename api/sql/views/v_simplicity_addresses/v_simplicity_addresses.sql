-- View: amd.v_simplicity_addresses

-- DROP VIEW amd.v_simplicity_addresses;

CREATE OR REPLACE VIEW amd.v_simplicity_addresses AS
 SELECT coa_bc_address_master.civicaddress_id,
    coa_bc_address_master.address_full,
    coa_bc_address_master.address_city,
    coa_bc_address_master.address_zipcode,
    coa_bc_address_master.address_number,
    coa_bc_address_master.address_unit,
    coa_bc_address_master.address_street_prefix,
    coa_bc_address_master.address_street_name,
    coa_bc_address_master.address_street_type,
    coa_bc_address_master.latitude_wgs,
    coa_bc_address_master.longitude_wgs,
    coa_bc_address_master.trash_pickup_day,
    coa_bc_address_master.recycling_pickup_district,
    coa_bc_address_master.recycling_pickup_day,
    coa_bc_address_master.zoning,
    coa_bc_address_master.owner_name,
    coa_bc_address_master.owner_address,
    coa_bc_address_master.owner_cityname,
    coa_bc_address_master.owner_state,
    coa_bc_address_master.owner_zipcode,
    coa_bc_address_master.property_pin,
    coa_bc_address_master.property_pinext,
    coa_bc_address_master.centerline_id,
    coa_bc_address_master.jurisdiction_type,
    coa_bc_address_master.shape,
    coa_bc_address_master.brushweek,
    coa_bc_address_master.nbrhd_id,
    coa_bc_address_master.nbrhd_name
   FROM amd.coa_bc_address_master
  WHERE coa_bc_address_master.location_type = 1 OR coa_bc_address_master.location_type = 4;

ALTER TABLE amd.v_simplicity_addresses
    OWNER TO coapgdbo;


