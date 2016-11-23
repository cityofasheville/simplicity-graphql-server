import { makeExecutableSchema } from 'graphql-tools';

import resolvers from './resolvers';

const schema = `
type Address {
  civic_address_id: ID!
  full_address: String!
  pin: ID!
  owner: String
  is_in_city: Boolean
}

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
  full_address: String
  pin: String
  owner: String
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

# the schema allows the following query:
type Query {
  search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
  address ( id: ID! ): Address
  my_simplicity: UserDashboards
  permits (type: String, violated: Boolean, limit: Int): [Permit]!
}

`;

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
