export default `
type PCardStatementStatus {
  dept_id: String
  department: String 
  div_id: String
  division: String 
  cardholder: String 
  statement_code: String
  statement_id: Int
  statement_status: String
  fiscal_year: Int
  fiscal_period: Int
  invoiced_date: String
  reconciled_date: String
  days_invoiced_to_reconciled: Int
  approved_date: String
  days_reconciled_to_approved: Int
  days_since_invoiced: Int
  days_since_reconciled: Int
}

type PCardTransaction {
  dept_id: String
  department: String 
  div_id: String
  division: String 
  cardholder: String 
  statement_id: Int
  charge_date: String
  amount: Float
  vendor_id: String
  vendor_name: String
  description: String
  receipt: String
}
`;
