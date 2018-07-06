module.exports = `
type CIPProject {
  gis_id: String
  munis_project_number: String
  project: String
  display_name: String
  location_details: String
  zip_code: String
  type: String
  category: String
  category_number: Int
  coa_contact: String
  phone_number: String
  email_address: String
  owner_department: String
  administering_department: String
  project_description: String
  status: String
  total_project_funding_budget_document: String
  total_spent: String
  encumbered: String
  target_construction_start: String
  target_construction_end: String
  actual_construction_end: String
  amount_behind_schedule: String
  estimated_construction_duration: String
  project_folder: String
  project_webpage_more_information: String
  communication_plan: String
  photo_url: String
  project_updates: String
  latitude: [Float]
  longitude: [Float]
}

type CIPProjectCategory {
  category_name: String
  category_number: Int
  total_count: Int
  bond_count: Int
}
`;
