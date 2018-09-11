module.exports = `

# A generic stats types
type GenericMonthStats {
  # The result of the aggregation
  count: Int
  # The value of this category from the aggregation
  grouptitle: String,
  # The category of this aggregation 
  groupcategory: String,
  # An array of subitems
  subitems: [GenericMonthStats]
}

# Filter "groups" are used to group together WHERE clauses in the query 
input GenericStatsFilterGroup{
  # Operation to join together groups or filters (AND / OR)
  op: String
  # Filters of type GenericStatsFilter
  filters: [GenericStatsFilter]
  # Sub-groups of filters
  groups: [GenericStatsFilterGroup] 
}

# An individual "WHERE" clause. Provide key / value and operation for comparison
input GenericStatsFilter{
  # The column 'key' for comparison
  key: String!
  # The comparison operator (=, !=, >=, <=) - others might work but aren't tested. 
  op: String!
  # The value for comparison
  value: String!
}

# Aggregate field
input GenericStatsAggregateField{
  # SQL Column name
  column: String!
  # Optional: The aggregate function to use - defaults to COUNT
  aggregateFunction: String
}

# Group By Clause
input GenericStatsGroupBy{
  # SQL Column name
  column: String!
  # Optional: datefield to extract from 
  dateField: String
}

`;
