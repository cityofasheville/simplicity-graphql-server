-- View: simplicity.v_simplicity_addresses_all

-- DROP VIEW simplicity.v_simplicity_addresses_all;

CREATE OR REPLACE VIEW simplicity.v_simplicity_addresses_all AS
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
    coa_bc_address_master.zoning_links,
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
    coa_bc_address_master.nbrhd_name,
    coa_bc_address_master.historic_district,
    coa_bc_address_master.local_landmark,
    coa_bc_address_master.block_group,
    coa_climate_justice_index.name_1 block_group_name
   FROM internal.coa_bc_address_master
left join internal.coa_climate_justice_index
on coa_bc_address_master.block_group = coa_climate_justice_index.geoid
  -- WHERE coa_bc_address_master.location_type = 1 OR coa_bc_address_master.location_type = 4;



