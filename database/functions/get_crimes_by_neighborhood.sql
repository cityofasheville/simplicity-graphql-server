-- FUNCTION: simplicity.get_crimes_by_neighborhood(character varying[])

-- DROP FUNCTION simplicity.get_crimes_by_neighborhood(character varying[]);

CREATE OR REPLACE FUNCTION simplicity.get_crimes_by_neighborhood(
	cid character varying[])
    RETURNS SETOF simplicity.v_simplicity_crimes 
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
    ROWS 1000
AS $BODY$

DECLARE
    r simplicity.v_simplicity_crimes%rowtype;
BEGIN
	for i in 1..array_length(cid,1) loop
    	FOR r IN
    		SELECT
                A.x, A.y, A.x_wgs, A.y_wgs, A.incident_id, A.agency,
                A.date_occurred, A.case_number, A.address, A.geo_beat, A.geo_report_area,
                A.offense_short_description, A.offense_long_description, A.offense_code,
                A.offense_group_code, A.offense_group_level,
                A.offense_group_short_description, A.offense_group_long_description
            FROM simplicity.v_simplicity_crimes AS A
            LEFT JOIN internal.coa_asheville_neighborhoods AS B
            ON ST_Contains(B.shape, ST_SetSRID(ST_Point(A.x, A.y),2264))
            WHERE B.nbhd_id = cid[i]
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END

$BODY$;

