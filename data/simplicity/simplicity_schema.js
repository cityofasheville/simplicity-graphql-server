const baseSchema = `
  type UserDashboards {
      email: String!
      groups: [String]
      subscriptions: String
  }

  extend type Query {
    search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
    addresses (civicaddress_ids: [String]! ): [Address]
    addresses_by_street (centerline_ids: [Float]): [Address]
    properties_by_street (centerline_ids: [Float], radius: Int): [Property]
    properties (pins: [String]!): [Property]
    my_simplicity: UserDashboards
    budgetHistory: [SimpleBudgetDetail]!
    budgetSummary ( breakdown: String!, maxCategories: Int ): [SimpleBudgetSummary]!
    budgetCashFlow ( accountType: String! ): [BudgetCashFlow]!  
    firstReviewSLAItems: [FirstReviewSLAItem]!
    firstReviewSLASummary (tasks: [String]) : [FirstReviewSLASummaryItem]!
    crimes(incident_ids: [Int]!): [CrimeIncident]
    crimes_by_address(civicaddress_id: Int!, radius: Int, after: String, before: String): [CrimeIncident]
    crimes_by_street (centerline_ids: [Float], radius: Int): [CrimeIncident]
    permits(permit_numbers: [String]!): [Permit]
    permits_by_address(civicaddress_id: Int!, radius: Int, after: String, before: String): [Permit]
    permits_by_street(centerline_ids: [Float], radius: Int): [Permit]
  }
`;
const searchSchema = require('./search').schema;
const addressSchema = require('./address_schema');
const propertySchema = require('./property_schema');
const crimeSchema = require('./crime_schema');
const developmentSchema = require('./development_schema');

const schema = [
  require('./budget_schema.js'),
  require('./dsd_sla_schema'),
  developmentSchema,
  crimeSchema,
  addressSchema,
  propertySchema,
  searchSchema,
  baseSchema,
];

module.exports = schema;
