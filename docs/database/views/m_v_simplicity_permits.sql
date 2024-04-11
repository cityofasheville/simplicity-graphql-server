-- 
drop materialized view simplicity.m_v_simplicity_permits cascade;


create materialized view simplicity.m_v_simplicity_permits as
SELECT inr.*,
coalesce( 
jsonb_agg(jsonb_build_object('comment_seq_number', comment_seq_number, 'comment_date', comment_date, 'comments', "comments"))
filter (where "comments" is not null), '[]'
) as "comments"
from (
	SELECT
	p.permit_num permit_number, 
	p.permit_group,  
	p.permit_type,  
	p.permit_subtype,  
	p.permit_category,  
	p.permit_description, 
	p.applicant_name,  
	p.applicant_name application_name,  
	p.applied_date::text,  
	p.status_current,  
	p.status_date::text,  
	p.technical_contact_name,  
	p.technical_contact_email,
	p.created_by,  
	p.building_value,  
	p.job_value,  
	p.total_project_valuation,  
	p.total_sq_feet,  
	p.fees,  
	p.paid,  
	p.balance, 
	p.invoiced_fee_total,  
	p.civic_address_id,  
	COALESCE(b.address_full, p.site_address) address,
	p.city,  
	p.zip,  
	p.pinnum, 
	b.longitude_wgs AS x,
	b.latitude_wgs AS y,
	p.internal_record_id,
	COALESCE(jsonb_agg(contractor_name) filter (where contractor_name is not null), '[]') contractor_names, 
	COALESCE(jsonb_agg(contractor_license_number) filter (where contractor_license_number is not null), '[]') contractor_license_numbers
	FROM internal.permits p
	LEFT JOIN internal.coa_bc_address_master b 
	ON p.civic_address_id::text = b.civicaddress_id::character varying(50)::text
	LEFT JOIN internal.permit_contractors c 
	ON p.permit_num::text = c.permit_num::text
	group by 
	p.permit_num, 
	p.permit_group,  
	p.permit_type,  
	p.permit_subtype,  
	p.permit_category,  
	p.permit_description, 
	p.applicant_name,  
	p.applicant_name,  
	p.applied_date,  
	p.status_current,  
	p.status_date,  
	p.technical_contact_name,  
	p.technical_contact_email,
	p.created_by,  
	p.building_value,  
	p.job_value,  
	p.total_project_valuation,  
	p.total_sq_feet,  
	p.fees,  
	p.paid,  
	p.balance, 
	p.invoiced_fee_total,  
	p.civic_address_id,  
	COALESCE(b.address_full, p.site_address),
	p.city,  
	p.zip,  
	p.pinnum, 
	b.longitude_wgs,
	b.latitude_wgs,
	p.internal_record_id
) as inr
LEFT JOIN internal.permit_comments com
ON inr.permit_number::text = com.permit_num::text
group by 
inr.permit_number, permit_group, permit_type, permit_subtype, permit_category, permit_description, 
applicant_name, application_name, applied_date, status_current, status_date, technical_contact_name, technical_contact_email, 
created_by, building_value, job_value, total_project_valuation, total_sq_feet, fees, paid, balance, 
invoiced_fee_total, civic_address_id, address, city, zip, pinnum, address,
x, y, internal_record_id,
contractor_names, contractor_license_numbers;


CREATE UNIQUE INDEX m_v_simplicity_permits_permit_num_idx ON simplicity.m_v_simplicity_permits (permit_number);


-- To refresh the materialized view
-- refresh materialized view concurrently simplicity.m_v_simplicity_permits;
