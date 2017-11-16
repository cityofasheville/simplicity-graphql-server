module.exports = `
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
  civic_address_id: String
  address: String
  contractor_name: String
  contractor_license_number: String
}

`;

let xx = `
type PermitComment {
  permit_number: String
  comment_seq_number: Int
  comment_date: String
  comments: String
}
`;
