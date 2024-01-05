-- View: amd.v_gl_history_plus_budget

-- DROP VIEW amd.v_gl_history_plus_budget;

CREATE OR REPLACE VIEW amd.v_gl_history_plus_budget AS
 SELECT a.account_type,
    a.fund_name,
    a.function_name,
    a.department_name,
    a.division_name,
    a.costcenter_name,
    a.grant_name,
    a.organization_name,
    a.object_name,
    a.project_name,
    a.year,
    a.proposed_budget,
    a.adopted_budget,
    a.actual,
    a.fund_id,
    a.function_id,
    a.department_id,
    a.division_id,
    a.costcenter_id,
    a.grant_id,
    a.organization_id,
    a.object_id,
    a.project_id,
    a.defaultyear,
    a.currentyear,
    a.in_budget_season
   FROM ( SELECT m.account_type,
            m.fund_name,
            m.function_name,
            m.department_name,
            m.division_name,
            m.costcenter_name,
            m.grant_name,
            m.organization_name,
            m.object_name,
            m.project_name,
            m.year,
            NULL::numeric AS proposed_budget,
            m.original_budget AS adopted_budget,
            m.actual,
            m.fund_id,
            m.function_id,
            m.department_id,
            m.division_id,
            m.costcenter_id,
            m.grant_id,
            m.organization_id,
            m.object_id,
            m.project_id,
            glp1.defaultyear,
            glp1.currentyear,
                CASE p1.value
                    WHEN 'true'::text THEN true
                    ELSE false
                END AS in_budget_season
           FROM amd.gl_master m
             LEFT JOIN amd.coa_app_parameters p1 ON 1 = 1
             LEFT JOIN amd.general_ledger_parameters glp1 ON 1 = 1
          WHERE m.account_type = 'R'::bpchar OR m.account_type = 'E'::bpchar AND m.year > (glp1.currentyear - 5)
        UNION
         SELECT b.account_type,
            b.fund_name,
            b.function_name,
            b.department_name,
            b.division_name,
            b.costcenter_name,
            b.grant_name,
            b.organization_name,
            b.object_name,
            b.project_name,
            b.year,
            b.proposed_budget,
            b.adopted_budget,
            NULL::numeric AS actual,
            b.fund_id,
            b.function_id,
            b.department_id,
            b.division_id,
            b.costcenter_id,
            b.grant_id,
            b.organization_id,
            b.object_id,
            b.project_id,
            glp2.defaultyear,
            glp2.currentyear,
                CASE p2.value
                    WHEN 'true'::text THEN true
                    ELSE false
                END AS in_budget_season
           FROM amd.gl_budget b
             LEFT JOIN amd.coa_app_parameters p2 ON 1 = 1
             LEFT JOIN amd.general_ledger_parameters glp2 ON 1 = 1
          WHERE b.account_type = 'R'::bpchar OR b.account_type = 'E'::bpchar AND b.year > (glp2.currentyear - 5)) a;


