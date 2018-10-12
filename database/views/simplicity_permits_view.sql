-- View: amd.simplicity_permits_view

-- DROP VIEW amd.simplicity_permits_view;

CREATE OR REPLACE VIEW amd.simplicity_permits_view AS
 SELECT a.permit_num,
    a.permit_group,
    a.permit_type,
    a.permit_subtype,
    a.permit_category,
    a.permit_description,
    a.applicant_name,
    a.applied_date,
    a.status_current,
    a.status_date,
    a.created_by,
    a.building_value,
    a.job_value,
    a.total_project_valuation,
    a.total_sq_feet,
    a.fees,
    a.paid,
    a.balance,
    a.invoiced_fee_total,
    a.civic_address_id,
    a.address,
    a.contractor_name,
    a.contractor_license_number,
    a.longitude AS x,
    a.latitude AS y,
    b.comment_seq_number,
    b.comment_date,
    b.comments
   FROM amd.permits_xy_view a
     LEFT JOIN amd.permit_comments b ON a.permit_num::text = b.permit_num::text;
