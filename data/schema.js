const { makeExecutableSchema } = require('graphql-tools');

const resolvers = require('./resolvers');
const mdaTypes = require('./mda/mda_types');
const mdaEndpoints = require('./mda/mda_endpoints');
const simplicitySchema = require('./simplicity/index').schema;

const schema = [`

${mdaTypes}
`,
`type SillyResult implements SearchResult {
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
}`,
`
# the schema allows the following query:
type Query {
  search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
  ${mdaEndpoints}
  my_simplicity: UserDashboards
  budgetHistory: [SimpleBudgetDetail]!
  budgetSummary ( breakdown: String!, maxCategories: Int ): [SimpleBudgetSummary]!
  budgetCashFlow ( accountType: String! ): [BudgetCashFlow]!
}
`,
simplicitySchema,
];

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
