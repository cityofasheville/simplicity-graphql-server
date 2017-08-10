module.exports = `
type FirstReviewSLAItem {
  record_id: String,
  first_date: Int,
  record_type: String,
  group: String,
  type: String,
  sub_type: String,
  category: String,
  task: String,
  task_status: String,
  sla_desc: String,
  sla: Float,
  due: String,
  first_plan_reviewed_date: String,
  month: Int,
  year: Int,
  met_sla: String,
  sla_business: Int,
  worked_days_business: Int
}
`;
