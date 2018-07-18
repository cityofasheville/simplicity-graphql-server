module.exports = `
type Address {
  civic_address_id: String
  address: String
  x: Float
  y: Float
  street_name: String
  street_prefix: String
  street_number: String
  street_type: String
  unit: String
  city: String
  zipcode: String
  neighborhood: String
  neighborhood_id: String
  is_in_city: Boolean
  zoning: String
  trash_day: String
  recycling_pickup_district: String,
  recycling_pickup_day: String,
  brushweek: String,
  street_maintenance: String,
  centerline_id: String
  pinnum: String
  pin: String
  pinext: String
  owner_name: String
  owner_address: String
  owner_cityname: String
  owner_state: String
  owner_zipcode: String
}
`;
