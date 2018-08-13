const dsdSlaSchema = require('./dsd_sla_schema');
module.exports = `
type PermitComment {
  comment_seq_number: Int
  comment_date: String
  comments: String
}

type Permit {
  permit_number: String
  permit_group: String
  permit_type: String
  permit_subtype: String
  permit_category: String
  permit_description: String
  applicant_name: String
  applied_date: String
  status_current: String
  status_date: String
  created_by: String
  building_value: String
  job_value: String
  total_project_valuation: String
  total_sq_feet: String
  fees: Float
  paid: Float
  balance: Float
  invoiced_fee_total: Float
  civic_address_id: String
  address: String
  x: Float
  y: Float
  contractor_names: [String]
  contractor_license_numbers: [String]
  comments: [PermitComment]
}

${dsdSlaSchema}
`;
