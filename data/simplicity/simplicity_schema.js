const baseSchema = `
  type UserDashboards {
      email: String!
      groups: [String]
      subscriptions: String
  }

  extend type Query {
    search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
    my_simplicity: UserDashboards
    budgetHistory: [SimpleBudgetDetail]!
    budgetSummary ( breakdown: String!, maxCategories: Int ): [SimpleBudgetSummary]!
    budgetCashFlow ( accountType: String! ): [BudgetCashFlow]!  
  }
`;
const searchSchema = require('./search').schema;

const schema = [
  require('./budget_schema.js'),
  searchSchema,
  baseSchema];

module.exports = schema;
