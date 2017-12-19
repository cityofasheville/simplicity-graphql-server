module.exports = `
type Address {
  civic_address_id: String
  address: String
  x: Float
  y: Float
  street_name: String
  street_prefix: String
  street_number: String
  unit: String
  city: String
  zipcode: String
  is_in_city: Boolean
  zoning: String
  trash_day: String
  recycling_pickup_district: String,
  recycling_pickup_day: String,
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
