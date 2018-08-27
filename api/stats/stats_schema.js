module.exports = `
type CrimeIncidentStats {
  incidents: [CrimeIncident]
  date: String
  count: Int
  agency: String
  date_occurred: String
  month: Int
  year: Int
}
type GenericMonthStats {
  count: Int
  month: Int
  year: Int
  day: Int
  grouptitle: String,
  groupcategory: String,
  subitems: [GenericMonthStats]
}

input GenericStatsFilterGroup{
  op: String!
  filters: [GenericStatsFilter]
}

input GenericStatsFilter{
  key: String!
  op: String!
  value: String!
}
`;
