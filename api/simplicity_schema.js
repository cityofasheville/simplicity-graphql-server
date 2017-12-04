const baseSchema = `

  extend type Query {
    search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
    addresses (civicaddress_ids: [String]! ): [Address]
    addresses_by_street (centerline_ids: [Float]): [Address]
    properties_by_street (centerline_ids: [Float], radius: Int): [Property]
    properties (pins: [String]!): [Property]
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
    projects (status: [String], priority: [String], reqtype: String, after: String, before: String): [ITProject]
  }
`;
const searchSchema = require('./search').schema;
const addressSchema = require('./address/address_schema');
const propertySchema = require('./property/property_schema');
const crimeSchema = require('./crime/crime_schema');
const developmentSchema = require('./development/development_schema');
const itProjectSchema = require('./internal');

const schema = [
  require('./budget/budget_schema.js'),
  itProjectSchema,
  developmentSchema,
  crimeSchema,
  addressSchema,
  propertySchema,
  searchSchema,
  baseSchema,
];

module.exports = schema;
