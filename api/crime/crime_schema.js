module.exports = `
type CrimeIncident {
  incident_id: Int
  agency: String
  date_occurred: String
  case_number: String
  address: String
  geo_beat: String
  geo_report_area: String
  x: Float
  y: Float
  offense_short_description: String
  offense_long_description: String
  offense_code: String
  offense_group_code: String
  offense_group_level: String
  offense_group_short_description: String
  offense_group_long_description: String
}
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
`;
