const baseSchema = `

  type Point {
    x: Float
    y: Float
  }

  type SimplePolygon {
    points: [Point]
  }

  type Polygon {
    outer: SimplePolygon
    holes: [SimplePolygon]
  }
  
  extend type Query {
    search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
    addresses (civicaddress_ids: [String]! ): [Address]
    addresses_by_street (centerline_ids: [Float]): [Address]
    addresses_by_neighborhood (nbrhd_ids: [String]): [Address]
    properties_by_street (centerline_ids: [Float], radius: Int): [Property]
    properties_by_neighborhood (nbrhd_ids: [String]): [Property]
    properties (pins: [String]!): [Property]
    municipalities (jurisdictions: [String]): [Municipality]
    streets (centerline_ids: [Float]): [Street]
    neighborhoods (nbrhd_ids: [String]): [Neighborhood]
    budgetHistory: [SimpleBudgetDetail]!
    budgetSummary ( breakdown: String!, maxCategories: Int, accountType: String ): [SimpleBudgetSummary]!
    budgetCashFlow ( accountType: String! ): [BudgetCashFlow]!
    budgetParameters: BudgetParameters
    firstReviewSLAItems: [FirstReviewSLAItem]!
    firstReviewSLASummary (tasks: [String]) : [FirstReviewSLASummaryItem]!
    generic_stats (schema: String, dataset: String, fields: [GenericStatsAggregateField], groupBy: [GenericStatsGroupBy], filters: GenericStatsFilterGroup) : [GenericStats]
    crimes(incident_ids: [Int]!): [CrimeIncident]
    crimes_by_address(civicaddress_id: Int!, radius: Int, after: String, before: String): [CrimeIncident]
    crimes_by_street (centerline_ids: [Float], radius: Int, after: String, before: String): [CrimeIncident]
    crimes_by_neighborhood (nbrhd_ids: [String], after: String, before: String): [CrimeIncident]
    permits(permit_numbers: [String], date_field: String, before: String, after: String, permit_groups: [String], trc: Boolean): [Permit]
    permits_by_address(civicaddress_id: Int!, radius: Int, after: String, before: String): [Permit]
    permits_by_street(centerline_ids: [Float], radius: Int, after: String, before: String): [Permit]
    permits_by_neighborhood(nbrhd_ids: [String], after: String, before: String): [Permit]
    permit_tasks(permit_numbers: [String], date_field: String, before: String, after: String, permit_groups: [String]): [PermitTask]
    inspections(permit_numbers: [String], date_field: String, before: String, after: String, permit_groups: [String]): [Inspection]
    cip_projects(names: [String], categories: [String], zipcodes: [String]): [CIPProject]
    cip_project_categories: [CIPProjectCategory]
    projects (status: [String], priority: [String], reqtype: String, after: String, before: String): [ITProject]
    pcard_transactions (before: String, after: String): [PCardTransaction]
    pcard_statements_status (before: String, after: String): [PCardStatementStatus]
    permit_realtime(permit_number: String): PermitRT @deprecated(reason: "Use permits instead")
    permits_by_address_realtime(civicaddress_id: Int!): [PermitRT] @deprecated(reason: "Use permits_by_address instead")
    blockgroups (geoid: [String] ): [Blockgroup]
  }
`;
  
import searchSchema from './search/index.js';
import municipalitiesSchema from './municipalities/municipalities_schema.js';
import addressSchema from './address/address_schema.js';
import propertySchema from './property/property_schema.js';
import crimeSchema from './crime/crime_schema.js';
import developmentSchema from './development/development_schema.js';
import itProjectSchema from './internal/workorders/workorders_schema.js';
import streetSchema from './street/street_schema.js';
import neighborhoodSchema from './neighborhood/neighborhood_schema.js';
import cipSchema from './cip/cip_schema.js';
import financeSchema from './finance/finance_schema.js';
import statsSchema from './stats/stats_schema.js';
import blockgroupsSchema from './blockgroups/blockgroups_schema.js';
import budgetSchema from './budget/budget_schema.js';
import pcard_schema from './finance/pcard/pcard_schema.js';

const schema = [
  baseSchema,
  budgetSchema,
  itProjectSchema,
  developmentSchema,
  crimeSchema,
  municipalitiesSchema,
  addressSchema,
  streetSchema,
  propertySchema,
  neighborhoodSchema,
  searchSchema.schema,
  cipSchema,
  financeSchema,
  statsSchema,
  blockgroupsSchema,
  pcard_schema,
];

export default schema;
