const schema = `
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
`;


const resolvers = require('./resolvers');
module.exports = {
  schema,
  resolvers,
};
