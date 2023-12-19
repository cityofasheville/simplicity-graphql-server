export default `
type Street {
  centerline_id: String
  address: String
  left_zipcode: String
  right_zipcode: String
  left_from_address: Int
  left_to_address: Int
  right_from_address: Int
  right_to_address: Int
  from_address: Int
  to_address: Int
  maintenance_entities: [String]
  line: [Point]
}
`;
