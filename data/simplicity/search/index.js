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
    civic_address_id: String
    address: String
    street_name: String
    street_prefix: String
    street_number: String
    unit: String
    city: String
    zipcode: String
  }

  type PropertyResult implements SearchResult {
    score: Int!
    type: String!
    pinnum: String
    pinnumext: String
    address: String
    city: String
    zipcode: String
  }

  type StreetResult implements SearchResult {
    score: Int!
    type: String!
    centerline_id: Float!
    full_street_name: String!
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
