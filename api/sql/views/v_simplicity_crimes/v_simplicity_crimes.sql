-- View: amd.v_simplicity_crimes

--DROP VIEW amd.v_simplicity_crimes;

CREATE OR REPLACE VIEW amd.v_simplicity_crimes AS
 SELECT a.x,
    a.y,
    st_x(st_transform(a.shape, 4326)) AS x_wgs,
    st_y(st_transform(a.shape, 4326)) AS y_wgs,
    a.objectid,
    a.incident_id,
    a.agency,
    a.date_occurred,
    a.case_number,
    a.address,
    a.geo_beat,
    a.geo_report_area,
    a.offense_short_description,
    a.offense_long_description,
    a.offense_code,
    a.offense_group_code,
    a.offense_group_level,
    a.offense_group_short_description,
    a.offense_group_long_description
   FROM amd.coa_apd_public_incidents_view a;


