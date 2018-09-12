# Sample Queries for the Stats Endpoint

## Permits

After `yarn start`

Visit: http://localhost:8080/graphiql

~~~~{
{
  generic_stats(
    dataset: "permits_xy_view", 
    fields: [
      {column: "fees", aggregateFunction: "COUNT"},
      {column: "fees", aggregateFunction: "SUM"},
    ], 
    groupBy: [
      {column: "year", dateField: "applied_date", sortDirection: "DESC"},
      {column: "month", dateField: "applied_date", sortDirection: "DESC"}
      {column: "week", dateField: "applied_date", sortDirection: "DESC"}

    ],
    filters: {
      filters:[
        {
          key: "year",
          dateField: "applied_date",
          op: "=",
          value: "2018"
        }
      ]
    }
    ) {
    
    groupTitle
    groupCategory
    fields {
      column
      aggregateFunction
      value
    }
    subitems {
      groupTitle
      groupCategory
      fields {
        column
        aggregateFunction
        value
      }
      subitems{
        groupTitle
        groupCategory
        fields {
          column
          aggregateFunction
          value
        }
      }
    }
  }
}
~~~~


