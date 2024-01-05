export default `
type Property {
  pinnum: String
  pin: String
  pinext: String
  property_civic_address_id: String
  property_address: String
  property_city: String
  property_zipcode: String
  civic_address_ids: [String]
  address: [String]
  city: [String]
  zipcode: [String]
  is_in_city: Boolean
  tax_exempt: Boolean
  neighborhood: String
  appraisal_area: String
  acreage: Float
  zoning: String
  zoning_links: String
  deed_link: String
  property_card_link: String
  plat_link: String
  latitude: Float
  longitude: Float
  building_value: Float
  land_value: Float
  appraised_value: Float
  tax_value: Float
  market_value: Float
  owner: String
  owner_address: String
  historic_district: String
  local_landmark: String
  polygons: [Polygon]
}
`;
