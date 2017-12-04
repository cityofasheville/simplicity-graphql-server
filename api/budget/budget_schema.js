module.exports = `
type SimpleBudgetDetail {
  account_type: String,
  account_name: String,
  fund_name: String,
  department_name: String,
  division_name: String,
  costcenter_name: String,
  function_name: String,
  charcode_name: String,
  organization_name: String,
  category_name: String,
  budget_section_name: String,
  object_name: String,
  year: Int,
  budget: Float,
  actual: Float,
  full_account_id: String,
  org_id: String,
  obj_id: String,
  fund_id: String,
  dept_id: String,
  div_id: String,
  cost_id: String,
  func_id: String,
  charcode: String,
  category_id: String,
  budget_section_id: String,
  proj_id: String,
  is_proposed: String
}

type SimpleBudgetSummary {
  account_type: String,
  category_name: String,
  year: Int,
  total_budget: Float,
  total_actual: Float
}

type BudgetCashFlow {
  account_type: String,
  category_name: String,
  category_id: String,
  dept_id: String,
  department_name: String,
  fund_id: String,
  fund_name: String,
  budget: Float,
  year: Int
}
`;
