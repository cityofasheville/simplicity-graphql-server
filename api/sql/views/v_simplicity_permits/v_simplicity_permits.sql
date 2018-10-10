CREATE OR REPLACE VIEW amd.v_simplicity_permits AS
SELECT a.permit_num, a.permit_group, a.permit_type,
      a.permit_subtype, a.permit_category, a.permit_description,
      a.applicant_name, a.applied_date, a.status_current, a.status_date,
      a.civic_address_id, a.address, a.contractor_name,
      a.contractor_license_number, a.longitude as x, a.lattitude as y,
      b.comment_seq_number, b.comment_date, b.comments
FROM amd.v_mda_permits_xy AS a
LEFT JOIN amd.mda_permit_comments AS b on a.permit_num = b.permit_num
