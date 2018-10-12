-- View: amd.cip_ltd_view

-- DROP VIEW amd.cip_ltd_view;

CREATE OR REPLACE VIEW amd.cip_ltd_view AS
 SELECT gl_master_cip_view.project_id,
    sum(gl_master_cip_view.actual) AS ltd_actuals,
    sum(gl_master_cip_view.cy_encumbrances) AS encumbrances,
    sum(gl_master_cip_view.lifetime_original_budget) AS lifeoriginalbudget,
    sum(gl_master_cip_view.lifetime_revised_budget) AS liferevisedbudget
   FROM amd.gl_master_cip_view
  WHERE gl_master_cip_view.account_type::text = 'E'::text
  GROUP BY gl_master_cip_view.project_id;

