-- FUNCTION: amd.get_permits_by_neighborhood(character varying[])

-- DROP FUNCTION amd.get_permits_by_neighborhood(character varying[]);

CREATE OR REPLACE FUNCTION amd.get_permits_by_neighborhood(
	cid character varying[])
RETURNS SETOF amd.v_simplicity_permits 
    LANGUAGE 'plpgsql'
    COST 100.0
    VOLATILE 
    ROWS 1000.0
AS $function$

DECLARE
    r amd.v_simplicity_permits%rowtype;
BEGIN
	for i in 1..array_length(cid,1) loop
    	FOR r IN
    		SELECT  A.permit_num, A.permit_group, A.permit_type,
                    A.permit_subtype, A.permit_category, A.permit_description,
                    A.applicant_name, A.applied_date, A.status_current, A.status_date,
                    A.civic_address_id, A.address, A.contractor_name,
                    A.contractor_license_number, A.x, A.y,
                    A.comment_seq_number, A.comment_date, A.comments
            FROM amd.v_simplicity_permits AS A
            LEFT JOIN amd.coa_asheville_neighborhoods AS B
            ON ST_Contains(B.shape, ST_Transform(ST_SetSRID(ST_Point(A.x, A.y),4326),2264))
            WHERE B.nbhd_id = cid[i]
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END

$function$;


