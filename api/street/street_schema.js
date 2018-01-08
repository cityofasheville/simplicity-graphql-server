module.exports = `
type Street {
  centerline_id: String
  address: String
  left_zipcode: String
  right_zipcode: String
  maintenance_entities: [String]
  line: [Point]
}
`;
