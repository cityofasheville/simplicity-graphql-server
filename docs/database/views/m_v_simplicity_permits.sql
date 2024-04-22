-- 
drop materialized view simplicity.m_v_simplicity_permits;


-- simplicity.m_v_simplicity_permits source

CREATE MATERIALIZED VIEW simplicity.m_v_simplicity_permits
TABLESPACE pg_default
AS SELECT inr.permit_number,
    inr.permit_group,
    inr.permit_type,
    inr.permit_subtype,
    inr.permit_category,
    inr.permit_description,
    inr.applicant_name,
    inr.application_name,
    inr.applied_date,
    inr.status_current,
    inr.status_date,
    inr.technical_contact_name,
    inr.technical_contact_email,
    inr.created_by,
    inr.building_value,
    inr.job_value,
    inr.total_project_valuation,
    inr.total_sq_feet,
    inr.fees,
    inr.paid,
    inr.balance,
    inr.invoiced_fee_total,
    inr.civic_address_id,
    inr.address,
    inr.city,
    inr.zip,
    inr.pinnum,
    inr.x,
    inr.y,
    inr.internal_record_id,
    inr.contractor_names,
    inr.contractor_license_numbers,
    COALESCE(jsonb_agg(jsonb_build_object('comment_seq_number', com.comment_seq_number, 'comment_date', com.comment_date, 'comments', com.comments)) FILTER (WHERE com.comments IS NOT NULL), '[]'::jsonb) AS comments
   FROM ( SELECT p.permit_num AS permit_number,
            p.permit_group,
            p.permit_type,
            p.permit_subtype,
            p.permit_category,
            p.permit_description,
            p.applicant_name,
            p.applicant_name AS application_name,
            p.applied_date::text AS applied_date,
            p.status_current,
            p.status_date::text AS status_date,
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
            COALESCE(b.address_full, p.site_address) AS address,
            p.city,
            p.zip,
            p.pinnum,
            b.longitude_wgs AS x,
            b.latitude_wgs AS y,
            p.internal_record_id,
            COALESCE(jsonb_agg(c.contractor_name) FILTER (WHERE c.contractor_name IS NOT NULL), '[]'::jsonb) AS contractor_names,
            COALESCE(jsonb_agg(c.contractor_license_number) FILTER (WHERE c.contractor_license_number IS NOT NULL), '[]'::jsonb) AS contractor_license_numbers
           FROM internal.permits p
             LEFT JOIN internal.coa_bc_address_master b ON p.civic_address_id::text = b.civicaddress_id::character varying(50)::text
             LEFT JOIN internal.permit_contractors c ON p.permit_num::text = c.permit_num::text
          GROUP BY p.permit_num, p.permit_group, p.permit_type, p.permit_subtype, p.permit_category, p.permit_description, p.applicant_name, p.applied_date, 
          p.status_current, p.status_date, p.technical_contact_name, p.technical_contact_email, p.created_by, p.building_value, p.job_value, p.total_project_valuation, 
          p.total_sq_feet, p.fees, p.paid, p.balance, p.invoiced_fee_total, p.civic_address_id, (COALESCE(b.address_full, p.site_address)), p.city, p.zip, p.pinnum, 
          b.longitude_wgs, b.latitude_wgs, p.internal_record_id) inr
     LEFT JOIN internal.permit_comments com ON inr.permit_number::text = com.permit_num::text
  GROUP BY inr.permit_number, inr.permit_group, inr.permit_type, inr.permit_subtype, inr.permit_category, inr.permit_description, inr.applicant_name, 
  inr.application_name, inr.applied_date, inr.status_current, inr.status_date, inr.technical_contact_name, inr.technical_contact_email, inr.created_by, 
  inr.building_value, inr.job_value, inr.total_project_valuation, inr.total_sq_feet, inr.fees, inr.paid, inr.balance, inr.invoiced_fee_total, inr.civic_address_id, 
  inr.address, inr.city, inr.zip, inr.pinnum, inr.x, inr.y, inr.internal_record_id, inr.contractor_names, inr.contractor_license_numbers
WITH DATA;

-- View indexes:
CREATE INDEX m_v_simplicity_permits_civic_address_id_idx ON simplicity.m_v_simplicity_permits USING btree (civic_address_id);
CREATE UNIQUE INDEX m_v_simplicity_permits_permit_num_idx ON simplicity.m_v_simplicity_permits USING btree (permit_number);


-- To refresh the materialized view
-- refresh materialized view concurrently simplicity.m_v_simplicity_permits;
