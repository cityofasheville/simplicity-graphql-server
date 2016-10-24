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

# the schema allows the following query:
type Query {
  search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
  address ( id: ID! ): Address
  my_simplicity: UserDashboards
}

`;

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
