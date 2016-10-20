import { makeExecutableSchema } from 'graphql-tools';

import resolvers from './resolvers';

const schema = `
type Author {
  id: Int! # the ! means that every author object _must_ have an id
  firstName: String
  lastName: String
  posts: [Post] # the list of Posts by this author
}

type Post {
  id: Int!
  title: String
  author: Author
  votes: Int
}

type Address {
  civic_address_id: ID!
  full_address: String!
  pin: ID!
  owner: String
  is_in_city: Boolean
}

type SearchResult {
  id: ID!
  text: String!
  score: Int
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
  posts: [Post]
  search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
  address ( id: ID! ): Address
  my_simplicity: UserDashboards
}

# this schema allows the following mutation:
type Mutation {
  upvotePost (
    postId: Int!
  ): Post
}

type Subscription {
  postUpvoted: Post
}

`;

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
