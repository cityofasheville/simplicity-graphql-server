-- View: amd.coa_apd_public_incidents_view

-- DROP VIEW amd.coa_apd_public_incidents_view;

CREATE OR REPLACE VIEW amd.coa_apd_public_incidents_view AS
 SELECT st_setsrid(st_makepoint(bc_public_incident_data.geo_x::double precision, bc_public_incident_data.geo_y::double precision), 2264)::geometry(Point,2264) AS shape,
    bc_public_incident_data.objectid,
    bc_public_incident_data.incident_id,
    bc_public_incident_data.agency,
    bc_public_incident_data.date_occurred,
    bc_public_incident_data.case_number,
    bc_public_incident_data.address,
    bc_public_incident_data.geo_beat,
    bc_public_incident_data.geo_report_area,
    bc_public_incident_data.geo_x AS x,
    bc_public_incident_data.geo_y AS y,
    bc_public_incident_data.offense_short_description,
    bc_public_incident_data.offense_long_description,
    bc_public_incident_data.offense_code,
    bc_public_incident_data.offense_group_code,
    bc_public_incident_data.offense_group_level,
    bc_public_incident_data.offense_group_short_description,
    bc_public_incident_data.offense_group_long_description
   FROM amd.bc_public_incident_data
  WHERE bc_public_incident_data.agency::text = 'APD'::text;
