module.exports = `
type Property {
  civic_address_id: String
  pinnum: String
  pinnumext: String
  address: String
  city: String
  zipcode: String,
  tax_exempt: Boolean
  neighborhood: String
  appraisal_area: String
  acreage: Float
  zoning: String
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
}
`;
