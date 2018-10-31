-- View: simplicity.permits_xy_view

-- DROP VIEW simplicity.permits_xy_view;

CREATE OR REPLACE VIEW simplicity.permits_xy_view AS
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
    a.contractor_name,
    a.contractor_license_number,
    b.address_full AS address,
    b.address_x,
    b.address_y,
    b.latitude_wgs AS latitude,
    b.longitude_wgs AS longitude
   FROM ( SELECT p.permit_num,
            p.permit_group,
            p.permit_type,
            p.permit_subtype,
            p.permit_category,
            p.applicant_name,
            p.permit_description,
            p.applied_date,
            p.status_current,
            p.status_date,
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
            p.record_id,
            c.contractor_name,
            c.contractor_license_number
           FROM internal.permits p
             LEFT JOIN internal.permit_contractors c ON p.permit_num::text = c.permit_num::text) a
     LEFT JOIN internal.coa_bc_address_master b ON a.civic_address_id::text = b.civicaddress_id::character varying(50)::text;


