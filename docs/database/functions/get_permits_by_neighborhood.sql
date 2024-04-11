-- DROP FUNCTION simplicity.get_permits_by_neighborhood(character varying[]);

CREATE OR REPLACE FUNCTION simplicity.get_permits_by_neighborhood(
	cid character varying[], afterdate text, beforedate text)
    RETURNS SETOF simplicity.m_v_simplicity_permits 
    LANGUAGE 'plpgsql'
--
    COST 100
    VOLATILE 
    ROWS 1000
AS $BODY$
--
DECLARE
    r simplicity.m_v_simplicity_permits%rowtype;
BEGIN
	for i in 1..array_length(cid,1) loop
    	FOR r IN
			SELECT permit_number, permit_group, permit_type, permit_subtype, permit_category, permit_description, 
			applicant_name, application_name, applied_date, status_current, status_date, technical_contact_name, 
			technical_contact_email, created_by, building_value, job_value, total_project_valuation, total_sq_feet, 
			fees, paid, balance, invoiced_fee_total, civic_address_id, address, city, zip, pinnum, x, y, 
			internal_record_id, contractor_names, contractor_license_numbers, "comments"
            FROM simplicity.m_v_simplicity_permits AS A
            LEFT JOIN internal.coa_asheville_neighborhoods AS B
            ON ST_Contains(B.shape, ST_Transform(ST_SetSRID(ST_Point(A.x, A.y),4326),2264))
            WHERE B.nbhd_id = cid[i]
            and applied_date between afterdate and beforedate
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END
--
$BODY$;

