-- View: amd.v_munis_sanitation

-- DROP VIEW amd.v_munis_sanitation;

CREATE OR REPLACE VIEW amd.v_munis_sanitation AS
 SELECT DISTINCT bc_location.location_id,
    bc_location.civicaddress_id,
    coa_districts_public_works.truckday,
    coa_districts_public_works.truck_num AS truck_number,
    coa_districts_public_works.recday AS recycle_day,
    coa_districts_public_works.recdistrict AS recycle_week,
    coa_districts_public_works.brushweek AS brush_week,
    coa_districts_public_works.brushtruck_num AS brushtruck_number
   FROM amd.bc_location
     JOIN amd.coa_districts_public_works ON st_contains(coa_districts_public_works.shape, bc_location.shape);

