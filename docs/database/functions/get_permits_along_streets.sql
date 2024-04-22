-- DROP FUNCTION simplicity.get_permits_along_streets(_numeric, numeric, text, text);

CREATE OR REPLACE FUNCTION simplicity.get_permits_along_streets(cid numeric[], ldist numeric, afterdate text, beforedate text)
 RETURNS SETOF simplicity.m_v_simplicity_permits
 LANGUAGE plpgsql
AS $function$
--
DECLARE
    r simplicity.m_v_simplicity_permits%rowtype;
BEGIN
	for i in 1..array_length(cid,1) loop
    	FOR r IN
			SELECT A.permit_number, permit_group, permit_type, permit_subtype, permit_category, permit_description, 
			applicant_name, application_name, applied_date::text, status_current, status_date::text, technical_contact_name, 
			technical_contact_email, created_by, building_value, job_value, total_project_valuation, total_sq_feet, 
			fees, paid, balance, invoiced_fee_total, civic_address_id, address, city, zip, pinnum, x, y, 
			internal_record_id, contractor_names, contractor_license_numbers, "comments"
			FROM simplicity.m_v_simplicity_permits AS A
			inner join simplicity.m_v_link_permits_along_street B
			on A.permit_number = B.permit_number
            WHERE B.centerline_id = cid[i]
            and applied_date between afterdate and beforedate
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END
--
$function$
;
