-- View: amd.employee_main

-- DROP VIEW amd.employee_main;

CREATE OR REPLACE VIEW amd.employee_main AS
 SELECT a.emp_id,
    a.ad_username,
    a.email_city,
    a.ad_memberships,
    b.active,
    b.employee,
    b.emp_email,
    b."position",
    b.dept_id,
    b.department,
    b.div_id,
    b.division,
    b.sup_id,
    b.supervisor,
    b.sup_email,
    b.hire_date
   FROM amd.ad_info a
     LEFT JOIN amd.pr_employee_info b ON a.emp_id = b.emp_id;
