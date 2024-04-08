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
    x: Float
    y: Float
    unit: String
    city: String
    is_in_city: Boolean
    zipcode: String
  }

  type PropertyResult implements SearchResult {
    score: Int!
    type: String!
    pinnum: String
    pin: String
    pinext: String
    address: String
    city: String
    zipcode: String
    civic_address_id: String
  }

  type StreetResult implements SearchResult {
    score: Int!
    type: String!
    full_street_name: String!
    zip_code: String
    centerline_ids: [Float]!    
  }

  type OwnerResult implements SearchResult {
    score: Int!
    type: String!
    name: String
    pinnums: [String]
  }
  
  type NeighborhoodResult implements SearchResult {
    score: Int!
    type: String!
    name: String!
    nbhd_id: String   
    abbreviation: String
    polygon: Polygon
  }

  type PlaceResult implements SearchResult {
    score: Int!
    type: String!
    name: String
    address: String
    id: String
    place_id: String
    types: [String]
  }

  type PermitResult implements SearchResult {
    score: Int!
    type: String!
    permit_number: String!
    permit_group: String
    permit_type: String
    permit_subtype: String
    permit_category: String
    permit_description: String
    applicant_name: String
    application_name: String
    applied_date: String
    status_current: String
    status_date: String
    civic_address_id: String
    address: String
    x: Float
    y: Float
    internal_record_id: String 
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


import resolvers from './resolvers.js';
export default {
  schema,
  resolvers,
};
