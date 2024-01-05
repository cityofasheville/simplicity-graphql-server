-- View: simplicity.dsd_first_review_sla_summary

-- DROP VIEW simplicity.dsd_first_review_sla_summary;

CREATE OR REPLACE VIEW simplicity.dsd_first_review_sla_summary AS
 SELECT sla.task,
    sla.month,
    sla.year,
    sum(sla.met_sla::integer) AS met_sla,
    sum(1 - sla.met_sla::integer) AS past_sla
   FROM internal.dsd_first_review_sla sla
  GROUP BY sla.task, sla.month, sla.year
  ORDER BY sla.task, sla.year DESC, sla.month;
