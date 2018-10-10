-- FUNCTION: amd.get_crimes_along_streets(numeric[], numeric)

-- DROP FUNCTION amd.get_crimes_along_streets(numeric[], numeric);

CREATE OR REPLACE FUNCTION amd.get_crimes_along_streets(
	cid numeric[],
	ldist numeric)
RETURNS SETOF amd.v_simplicity_crimes 
    LANGUAGE 'plpgsql'
    COST 100.0
    VOLATILE 
    ROWS 1000.0
AS $function$
DECLARE
    r amd.v_simplicity_crimes%rowtype;
BEGIN
	for i in 1..array_length(cid,1) loop
    	FOR r IN
    		SELECT
                A.x, A.y, A.x_wgs, A.y_wgs, A.objectid, A.incident_id, A.agency,
                A.date_occurred, A.case_number, A.address, A.geo_beat, A.geo_report_area,
                A.offense_short_description, A.offense_long_description, A.offense_code,
                A.offense_group_code, A.offense_group_level,
                A.offense_group_short_description, A.offense_group_long_description
            FROM amd.v_simplicity_crimes AS A
            LEFT JOIN amd.bc_street AS B
            ON ST_DWithin(B.shape, ST_SetSRID(ST_Point(A.x, A.y),2264), ldist)
            WHERE B.centerline_id = cid[i]
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END
$function$;

