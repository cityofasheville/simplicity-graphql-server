-- View: amd.budget_summary_by_dept_view

-- DROP VIEW amd.budget_summary_by_dept_view;

CREATE OR REPLACE VIEW amd.budget_summary_by_dept_view AS
 SELECT s.department_name,
    s.year,
    s.total_proposed_budget,
    s.total_adopted_budget,
    s.total_actual,
    s.account_type
   FROM ( SELECT bh.account_type,
            bh.department_name,
            bh.year,
            sum(bh.proposed_budget) AS total_proposed_budget,
            sum(bh.adopted_budget) AS total_adopted_budget,
            sum(bh.actual) AS total_actual
           FROM amd.v_gl_5yr_plus_budget_mapped bh
          WHERE NOT ((bh.organization_id::text, bh.object_id::text) IN ( SELECT interfund_transfers.org_code,
                    interfund_transfers.object_code
                   FROM amd.budget_interfund_transfers interfund_transfers))
          GROUP BY bh.department_name, bh.year, bh.account_type) s;

