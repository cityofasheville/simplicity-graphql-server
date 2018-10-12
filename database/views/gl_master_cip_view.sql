-- View: amd.gl_master_cip_view

-- DROP VIEW amd.gl_master_cip_view;

CREATE OR REPLACE VIEW amd.gl_master_cip_view AS
 SELECT gl_master.account_type,
    gl_master.fund_id,
    gl_master.object_id,
    gl_master.object_name,
    gl_master.project_id,
    gl_master.organization_id,
    gl_master.organization_name,
    gl_master.account_status,
    gl_master.department_id,
    gl_master.division_id,
    gl_master.costcenter_id,
    sum(gl_master.lifetime_original_budget) AS lifetime_original_budget,
    sum(gl_master.lifetime_revised_budget) AS lifetime_revised_budget,
    sum(gl_master.cy_encumbrances) AS cy_encumbrances,
    sum(
        CASE
            WHEN gl_master.memo = 0::numeric THEN gl_master.actual
            WHEN gl_master.memo IS NULL THEN gl_master.actual
            ELSE gl_master.memo
        END) AS actual,
    sum(gl_master.life_transfers_in) AS life_transfers_in,
    sum(gl_master.life_transfers_out) AS life_transfers_out,
    sum(gl_master.memo) AS memo
   FROM amd.gl_master
  WHERE btrim(gl_master.project_id::text) <> ''::text AND gl_master.project_id::text !~~ 'A%'::text AND gl_master.project_id::text !~~ 'D%'::text
  GROUP BY gl_master.account_type, gl_master.fund_id, gl_master.object_id, gl_master.object_name, gl_master.project_id, gl_master.organization_id, gl_master.organization_name, gl_master.account_status, gl_master.department_id, gl_master.division_id, gl_master.costcenter_id
  ORDER BY gl_master.project_id, gl_master.organization_id, gl_master.object_id;

