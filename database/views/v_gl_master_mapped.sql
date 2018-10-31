-- View: simplicity.v_gl_master_mapped

-- DROP VIEW simplicity.v_gl_master_mapped;

CREATE OR REPLACE VIEW simplicity.v_gl_master_mapped AS
 WITH bsm AS (
         SELECT DISTINCT bsmtmp.budget_section,
            bsmtmp.org_code,
            bsmtmp.object_code
           FROM internal.budget_section_mapping bsmtmp
        ), glm1 AS (
         SELECT glm.account_type,
            glm.account_status,
            glm.fund_name,
            glm.function_name,
            glm.department_name,
            glm.division_name,
            glm.costcenter_name,
            glm.grant_name,
            glm.organization_name,
            glm.object_name,
            glm.project_name,
            glm.year,
            glm.original_budget,
            glm.revised_budget,
            glm.actual,
            glm.memo,
            glm.lifetime_original_budget,
            glm.lifetime_revised_budget,
            glm.fund_id,
            glm.function_id,
            glm.department_id,
            glm.division_id,
            glm.costcenter_id,
            glm.grant_id,
            glm.organization_id,
            glm.object_id,
            glm.project_id,
            glm.full_account_id,
            glm.charcode_name,
            glm.is_budgetary,
            bsm.budget_section,
            bsm.org_code,
            bsm.object_code
           FROM internal.gl_master glm
             JOIN bsm ON glm.organization_id::text = bsm.org_code AND glm.object_id::text = bsm.object_code
        )
 SELECT a.account_type,
    a.account_status,
    a.fund_name,
    a.function_name,
        CASE
            WHEN dm.dept_id1 <> ''::text THEN dm.department_name::character varying
            ELSE a.department_name
        END AS department_name,
        CASE
            WHEN dm.div_id1 <> ''::text THEN dm.division_name::character varying
            ELSE a.division_name
        END AS division_name,
    a.costcenter_name,
    a.grant_name,
    a.organization_name,
    a.object_name,
    a.project_name,
    a.year,
    a.original_budget,
    a.revised_budget,
    a.actual,
    a.memo,
    a.lifetime_original_budget,
    a.lifetime_revised_budget,
    a.fund_id,
    a.function_id,
        CASE
            WHEN dm.dept_id1 <> ''::text THEN dm.dept_id2::character varying
            ELSE a.department_id
        END AS department_id,
        CASE
            WHEN dm.div_id1 <> ''::text THEN dm.div_id2::character varying
            ELSE a.division_id
        END AS division_id,
    a.costcenter_id,
    a.grant_id,
    a.organization_id,
    a.object_id,
    a.project_id,
    a.full_account_id,
    a.charcode_name,
    a.is_budgetary,
    b.category_name,
    c.budget_section_name
   FROM ( SELECT glm1.account_type,
            glm1.account_status,
            glm1.fund_name,
            glm1.function_name,
            glm1.department_name,
            glm1.division_name,
            glm1.costcenter_name,
            glm1.grant_name,
            glm1.organization_name,
            glm1.object_name,
            glm1.project_name,
            glm1.year,
            glm1.original_budget,
            glm1.revised_budget,
            glm1.actual,
            glm1.memo,
            glm1.lifetime_original_budget,
            glm1.lifetime_revised_budget,
            glm1.fund_id,
            glm1.function_id,
            glm1.department_id,
            glm1.division_id,
            glm1.costcenter_id,
            glm1.grant_id,
            glm1.organization_id,
            glm1.object_id,
            glm1.project_id,
            glm1.full_account_id,
            glm1.charcode_name,
            glm1.is_budgetary,
            glm1.budget_section,
            glm1.org_code,
            glm1.object_code
           FROM glm1
        UNION ALL
         SELECT glm2.account_type,
            glm2.account_status,
            glm2.fund_name,
            glm2.function_name,
            glm2.department_name,
            glm2.division_name,
            glm2.costcenter_name,
            glm2.grant_name,
            glm2.organization_name,
            glm2.object_name,
            glm2.project_name,
            glm2.year,
            glm2.original_budget,
            glm2.revised_budget,
            glm2.actual,
            glm2.memo,
            glm2.lifetime_original_budget,
            glm2.lifetime_revised_budget,
            glm2.fund_id,
            glm2.function_id,
            glm2.department_id,
            glm2.division_id,
            glm2.costcenter_id,
            glm2.grant_id,
            glm2.organization_id,
            glm2.object_id,
            glm2.project_id,
            glm2.full_account_id,
            glm2.charcode_name,
            glm2.is_budgetary,
            bb.budget_section,
            bb.org_code,
            bb.object_code
           FROM internal.gl_master glm2
             LEFT JOIN ( SELECT bsm.budget_section,
                    bsm.org_code,
                    bsm.object_code
                   FROM bsm
                  WHERE bsm.object_code IS NULL) bb ON glm2.organization_id::text = bb.org_code
          WHERE NOT ((glm2.organization_id::text, glm2.object_id::text) IN ( SELECT glm1.organization_id,
                    glm1.object_id
                   FROM glm1))) a
     LEFT JOIN ( SELECT bcm.object_code,
            bcm.category,
            bc.category AS category_name
           FROM internal.budget_category_mapping bcm
             JOIN internal.budget_categories bc ON bcm.category = bc.id) b ON a.object_id::text = b.object_code
     LEFT JOIN ( SELECT budget_sections.id,
            budget_sections.budget_section AS budget_section_name
           FROM internal.budget_sections) c ON a.budget_section = c.id
     LEFT JOIN internal.budget_deptdiv_mappings dm ON a.department_id::text = dm.dept_id1 AND a.division_id::text = dm.div_id1
  WHERE NOT (a.organization_id::text IN ( SELECT budget_exclusions.org_code
           FROM internal.budget_exclusions
          WHERE budget_exclusions.object_code IS NULL)) AND NOT ((a.organization_id::text, a.object_id::text) IN ( SELECT budget_exclusions.org_code,
            budget_exclusions.object_code
           FROM internal.budget_exclusions
          WHERE budget_exclusions.object_code IS NOT NULL));



