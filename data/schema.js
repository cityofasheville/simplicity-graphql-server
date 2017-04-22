const { makeExecutableSchema } = require('graphql-tools');

const resolvers = require('./resolvers');
const mdaTypes = require('./mda/mda_types');
const mdaEndpoints = require('./mda/mda_endpoints');

const schema = `

${mdaTypes}

type SillyResult implements SearchResult {
  score: Int!
  type: String!
  id: ID!
  text: String!
}

type AddressResult implements SearchResult {
  score: Int!
  type: String!
  id: ID!
  civic_address_id: String
  address: String
  pinnum: String
  is_in_city: Boolean
}

interface SearchResult {
  type: String!
  score: Int!
}

type TypedSearchResult {
  type: String!
  results: [SearchResult]
}

type UserDashboards {
  email: String!
  groups: [String]
  subscriptions: String
}

type PermitTrip {
  trip: Int!
  start_date: String
  end_date: String
  due_date: String
  trip_violation_days: Int!
  trip_sla: Int!
  division: String!
}

type Permit {
  permit_id: ID!
  type: String
  subtype: String
  category: String
  app_date: String
  app_status: String
  app_status_date: String
  ntrips: Int!
  violation: Boolean!
  violation_count: Int!
  violation_days: Int!
  sla: Int!
  building: Int!
  fire: Int!
  zoning: Int!
  addressing: Int!
  trips: [PermitTrip]!
}

type SimpleBudgetDetail {
  account_type: String,
  account_name: String,
  fund_name: String,
  department_name: String,
  division_name: String,
  costcenter_name: String,
  function_name: String,
  organization_name: String,
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

# the schema allows the following query:
type Query {
  search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
  ${mdaEndpoints}
  my_simplicity: UserDashboards
  permits (type: String, violated: Boolean, limit: Int): [Permit]!
  gl_budget_history_plus_proposed: [SimpleBudgetDetail]!
  gl_budget_summary ( breakdown: String!, maxCategories: Int ): [SimpleBudgetSummary]!
}

`;

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
