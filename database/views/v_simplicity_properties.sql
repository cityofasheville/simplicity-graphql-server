-- View: simplicity.v_simplicity_properties

-- DROP VIEW simplicity.v_simplicity_properties;

CREATE OR REPLACE VIEW simplicity.v_simplicity_properties
AS SELECT a.pin,
    a.pinext,
    a.pinnum,
    b.address_full AS address,
    a.exempt,
    a.acreage,
    a.owner,
    b.address_city AS cityname,
    b.address_zipcode AS zipcode,
    a.totalmarketvalue,
    a.appraisedvalue,
    a.taxvalue,
    a.landvalue,
    a.buildingvalue,
    a.propcard,
    a.deedurl,
    a.platurl,
    a.appraisalarea,
    b.nbrhd_name AS neighborhoodcode,
    a.shape,
    b.civicaddress_id,
    b.latitude_wgs,
    b.longitude_wgs,
    b.zoning,
    b.zoning_links,
    b.jurisdiction_type,
    b.owner_address,
    b.location_type,
    st_astext(st_transform(a.shape, 4326)) AS polygon,
    b.historic_district,
    b.local_landmark
   FROM internal.bc_property a
     LEFT JOIN internal.coa_bc_address_master b ON a.pin::text = b.property_pin::text AND a.pinext::text = b.property_pinext::text


