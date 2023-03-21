-- View: simplicity.v_simplicity_crimes

-- DROP VIEW simplicity.v_simplicity_crimes;

 CREATE OR REPLACE VIEW simplicity.v_simplicity_crimes AS
 SELECT a.x,
    a.y,
    st_x(st_transform(a.shape, 4326)) AS x_wgs,
    st_y(st_transform(a.shape, 4326)) AS y_wgs,
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
   FROM (SELECT st_setsrid(st_makepoint(coa_apd_incident_data.geo_x::double precision, coa_apd_incident_data.geo_y::double precision), 2264)::geometry(Point,2264) AS shape,
    coa_apd_incident_data.incident_id,
    coa_apd_incident_data.agency,
    coa_apd_incident_data.date_occurred::timestamp without time zone AS date_occurred,
    coa_apd_incident_data.case_number,
    coa_apd_incident_data.address,
    coa_apd_incident_data.geo_beat,
    coa_apd_incident_data.geo_report_area,
    coa_apd_incident_data.geo_x AS x,
    coa_apd_incident_data.geo_y AS y,
    coa_apd_incident_data.offense_short_description,
    coa_apd_incident_data.offense_long_description,
    coa_apd_incident_data.offense_code,
    coa_apd_incident_data.offense_group_code,
    coa_apd_incident_data.offense_group_level,
    coa_apd_incident_data.offense_group_short_description,
    coa_apd_incident_data.offense_group_long_description
   FROM internal.coa_apd_incident_data
  WHERE coa_apd_incident_data.agency::text = 'APD'::text
  ) a;


