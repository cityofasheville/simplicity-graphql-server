-- View: amd.budget_parameters_view

-- DROP VIEW amd.budget_parameters_view;

CREATE OR REPLACE VIEW amd.budget_parameters_view AS
 SELECT a.defaultyear,
    a.currentyear,
    a.in_budget_season
   FROM ( SELECT glp1.defaultyear,
            glp1.currentyear,
            ( SELECT coa_app_parameters.value
                   FROM amd.coa_app_parameters
                  WHERE coa_app_parameters.name::text = 'in_budget_season'::text) AS in_budget_season
           FROM amd.general_ledger_parameters glp1) a;


