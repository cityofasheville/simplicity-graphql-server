const baseSchema = `
  type UserDashboards {
      email: String!
      groups: [String]
      subscriptions: String
  }

  extend type Query {
    search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
    addresses (civicaddress_ids: [String]! ): [Address]
    properties (pins: [String]!): [Property]
    my_simplicity: UserDashboards
    budgetHistory: [SimpleBudgetDetail]!
    budgetSummary ( breakdown: String!, maxCategories: Int ): [SimpleBudgetSummary]!
    budgetCashFlow ( accountType: String! ): [BudgetCashFlow]!  
    firstReviewSLAItems: [FirstReviewSLAItem]!
    firstReviewSLASummary (tasks: [String]) : [FirstReviewSLASummaryItem]!
  }
`;
const searchSchema = require('./search').schema;
const addressSchema = require('./address_schema');
const propertySchema = require('./property_schema');

const schema = [
  require('./budget_schema.js'),
  require('./dsd_sla_schema'),
  addressSchema,
  propertySchema,
  searchSchema,
  baseSchema,
];

module.exports = schema;
