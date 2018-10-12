-- View: amd.project_ltd_actuals

-- DROP VIEW amd.project_ltd_actuals;

CREATE OR REPLACE VIEW amd.project_ltd_actuals AS
 SELECT munis_gl_master_cip.projectid,
    sum(munis_gl_master_cip.actuals2011::numeric + munis_gl_master_cip.actuals2012::numeric + munis_gl_master_cip.actuals2013::numeric + munis_gl_master_cip.actuals2014::numeric + munis_gl_master_cip.actuals2015::numeric + munis_gl_master_cip.actuals2016::numeric + munis_gl_master_cip.actuals2017::numeric + munis_gl_master_cip.cyactualmemobalance::numeric) AS ltd_actuals,
    sum(munis_gl_master_cip.cyencumbrances::numeric) AS encumbrances,
    sum(munis_gl_master_cip.lifeoriginalbudget::numeric) AS lifeoriginalbudget,
    sum(munis_gl_master_cip.liferevisedbudget::numeric) AS liferevisedbudget
   FROM amd.munis_gl_master_cip
  WHERE munis_gl_master_cip.accounttype::text = 'E'::text
  GROUP BY munis_gl_master_cip.projectid;
