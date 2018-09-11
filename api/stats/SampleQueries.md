# Sample Queries for the Stats Endpoint

## Permits

`{
  generic_stats(
    dataset: "permits_xy_view", 
    fields: [{column: "permit_num"}], 
    groupBy: [
      {column: "year", dateField: "applied_date", sortDirection: "DESC"},
      {column: "month", dateField: "applied_date", sortDirection: "ASC"},
      {column: "permit_category", sortDirection: "ASC"},
      {column: "dow", dateField: "applied_date", sortDirection: "ASC"},
    ]
  ) {
    count
    grouptitle
    groupcategory
    subitems {
      count
      grouptitle
      groupcategory
      subitems{
        count
        grouptitle
        groupcategory
        subitems{
          count
          grouptitle
          groupcategory
        }
      }
    }
  }
}
`


