const ToAdd = `
CIPProjectBudget {
  account_status: String
  account_type: String
  actuals2011: Float
  actuals2012: Float
  actuals2013: Float
  actuals2014: Float
  actuals2015: Float
  actuals2016: Float
  actuals2017: Float
  actuals2018: Float
}`;
module.exports = `
type CIPProject {
  gis_id: String
  munis_project_number: String
  project: String
  display_name: String
  location_details: String
  zip_code: String
  category: String
  coa_contact: String
  phone_number: String
  email_address: String
  owner_department: String
  administering_department: String
  project_description: String
  status: String
  go_bond_funding: String
  cip_funding_total: String
  grant_funding_total: String
  other_funding: String
  total_project_funding_budget_document: String
  preliminary_project_budget_planning_phase_estimate: String
  estimated_total_project_cost: String
  total_spent: String
  target_construction_start: String
  target_construction_end: String
  actual_construction_end: String
  amount_behind_schedule: String
  estimated_construction_duration: String
  project_folder: String
  project_webpage_more_information: String
  communication_plan: String
  photo_url: String
  map_tab: String
  project_updates: String
  where: String
  contact: String
}
`;

