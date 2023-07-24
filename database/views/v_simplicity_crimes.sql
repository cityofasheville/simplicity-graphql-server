-- NEW Version 4/27/2023
-- simplicity.v_simplicity_crimes source

CREATE OR REPLACE VIEW simplicity.v_simplicity_crimes AS 
SELECT a.x,
    a.y,
    st_x(st_transform(a.shape, 4326)) AS x_wgs,
    st_y(st_transform(a.shape, 4326)) AS y_wgs,
    a.incident_id,
    a.agency::char(4) as agency,
    a.date_occurred,
    a.case_number,
    a.address,
    null::char(4) as geo_beat,
    null::char(4) as geo_report_area,
    null::varchar(25) as offense_short_description,
    null::varchar(60) as offense_long_description,
    null::char(4) as offense_code,
    null::varchar(50) as offense_group_code,
    null::varchar(50) as offense_group_level,
    null::varchar(100) as offense_group_short_description,
    null::varchar(1000) as offense_group_long_description
   FROM ( SELECT st_setsrid(st_makepoint(coa_apd_public_incidents.x::double precision, coa_apd_public_incidents.y::double precision), 2264)::geometry(Point,2264) AS shape,
            coa_apd_public_incidents.incident_id,
            coa_apd_public_incidents.agency,
            coa_apd_public_incidents.date_occurred::timestamp without time zone AS date_occurred,
            coa_apd_public_incidents.case_number,
            coa_apd_public_incidents.address,
            coa_apd_public_incidents.x,
            coa_apd_public_incidents.y
           FROM internal.coa_apd_public_incidents
          WHERE coa_apd_public_incidents.agency::text = 'APD'::text) a;
