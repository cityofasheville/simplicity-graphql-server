-- View: amd.v_gl_budget_mapped

-- DROP VIEW amd.v_gl_budget_mapped;

CREATE OR REPLACE VIEW amd.v_gl_budget_mapped AS
 WITH bsm AS (
         SELECT DISTINCT bsmtmp.budget_section,
            bsmtmp.org_code,
            bsmtmp.object_code
           FROM amd.budget_section_mapping bsmtmp
        ), glb1 AS (
         SELECT glb.account_type,
            glb.account_status,
            glb.fund_name,
            glb.function_name,
            glb.department_name,
            glb.division_name,
            glb.costcenter_name,
            glb.grant_name,
            glb.organization_name,
            glb.object_name,
            glb.project_name,
            glb.year,
            glb.proposed_budget,
            glb.adopted_budget,
            glb.fund_id,
            glb.function_id,
            glb.department_id,
            glb.division_id,
            glb.costcenter_id,
            glb.grant_id,
            glb.organization_id,
            glb.object_id,
            glb.project_id,
            glb.full_account_id,
            glb.charcode_name,
            bsm.budget_section,
            bsm.org_code,
            bsm.object_code
           FROM amd.gl_budget glb
             JOIN bsm ON glb.organization_id::text = bsm.org_code AND glb.object_id::text = bsm.object_code
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
    a.proposed_budget,
    a.adopted_budget,
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
    b.category_name,
    c.budget_section_name
   FROM ( SELECT glb1.account_type,
            glb1.account_status,
            glb1.fund_name,
            glb1.function_name,
            glb1.department_name,
            glb1.division_name,
            glb1.costcenter_name,
            glb1.grant_name,
            glb1.organization_name,
            glb1.object_name,
            glb1.project_name,
            glb1.year,
            glb1.proposed_budget,
            glb1.adopted_budget,
            glb1.fund_id,
            glb1.function_id,
            glb1.department_id,
            glb1.division_id,
            glb1.costcenter_id,
            glb1.grant_id,
            glb1.organization_id,
            glb1.object_id,
            glb1.project_id,
            glb1.full_account_id,
            glb1.charcode_name,
            glb1.budget_section,
            glb1.org_code,
            glb1.object_code
           FROM glb1
        UNION ALL
         SELECT glb2.account_type,
            glb2.account_status,
            glb2.fund_name,
            glb2.function_name,
            glb2.department_name,
            glb2.division_name,
            glb2.costcenter_name,
            glb2.grant_name,
            glb2.organization_name,
            glb2.object_name,
            glb2.project_name,
            glb2.year,
            glb2.proposed_budget,
            glb2.adopted_budget,
            glb2.fund_id,
            glb2.function_id,
            glb2.department_id,
            glb2.division_id,
            glb2.costcenter_id,
            glb2.grant_id,
            glb2.organization_id,
            glb2.object_id,
            glb2.project_id,
            glb2.full_account_id,
            glb2.charcode_name,
            bb.budget_section,
            bb.org_code,
            bb.object_code
           FROM amd.gl_budget glb2
             LEFT JOIN ( SELECT bsm.budget_section,
                    bsm.org_code,
                    bsm.object_code
                   FROM bsm
                  WHERE bsm.object_code IS NULL) bb ON glb2.organization_id::text = bb.org_code
          WHERE NOT ((glb2.organization_id::text, glb2.object_id::text) IN ( SELECT glb1.organization_id,
                    glb1.object_id
                   FROM glb1))) a
     LEFT JOIN ( SELECT bcm.object_code,
            bcm.category,
            bc.category AS category_name
           FROM amd.budget_category_mapping bcm
             JOIN amd.budget_categories bc ON bcm.category = bc.id) b ON a.object_id::text = b.object_code
     LEFT JOIN ( SELECT budget_sections.id,
            budget_sections.budget_section AS budget_section_name
           FROM amd.budget_sections) c ON a.budget_section = c.id
     LEFT JOIN amd.budget_deptdiv_mappings dm ON a.department_id::text = dm.dept_id1 AND a.division_id::text = dm.div_id1
  WHERE NOT (a.organization_id::text IN ( SELECT budget_exclusions.org_code
           FROM amd.budget_exclusions
          WHERE budget_exclusions.object_code IS NULL)) AND NOT ((a.organization_id::text, a.object_id::text) IN ( SELECT budget_exclusions.org_code,
            budget_exclusions.object_code
           FROM amd.budget_exclusions
          WHERE budget_exclusions.object_code IS NOT NULL));

