

function generateWhereClausesFromFilterGroup(filterGroup) {
  let query = ' ( ';

  if (filterGroup.groups && filterGroup.groups.length) {
    filterGroup.groups.forEach((subFilterGroup, index) => {
      if (index > 0) {
        query += ` ${filterGroup.op} `;
      }

      query += ` ( ${generateWhereClausesFromFilterGroup(subFilterGroup)} ) `;
    });
  } else {
    filterGroup.filters.forEach((field, index) => {
      if (index > 0) {
        query += ` ${filterGroup.op} `;
      }

      if (field.dateField) {
        query += ` EXTRACT(${field.key} from ${field.dateField}) ${field.op} '${field.value}' `;
      } else {
        query += ` ${field.key} ${field.op} '${field.value}' `;
      }
    });
  }

  query += ' ) ';
  return query;
}

function prepareStats(rows, fields, groupBy) {
  if (rows.length === 0) return [];

  const firstGroupBy = groupBy.shift();

  let new_array = [];
  new_array = sumSubitemCounts(rows, fields, firstGroupBy);

  if (groupBy.length) {
    let active_set = new_array;
    let newGroupBy = groupBy.shift();
    while (newGroupBy) {
      let new_active_set = [];
      active_set.forEach((row) => {
        row.subitems = sumSubitemCounts(row.subitems, fields, newGroupBy);
        new_active_set = new_active_set.concat(row.subitems);
      });

      active_set = new_active_set.slice();
      newGroupBy = groupBy.shift();

      if (!newGroupBy) {
        // For the last set, we just want to clear out the subitems,
        // since it results in duplicate content to the parent
        active_set.forEach((row) => {
          row.subitems = [];
        });
      }
    }
  } else {
    new_array.forEach((row) => {
      row.subitems = [];
    });
  }
  return new_array;
}

function sumSubitemCounts(input_array, fields, sum_key) {
  const output_array = [];
  const top_level_keys = [];
  const key_index_lookup = {};

  input_array.forEach((row) => {
    if (top_level_keys.indexOf(row[sum_key.column]) === -1) {
      top_level_keys.push(row[sum_key.column]);
    }
  });

  top_level_keys.forEach((index) => {
    const newItem = {};
    newItem.groupTitle = index;
    newItem.groupCategory = sum_key.column;
    newItem.subitems = [];
    // newItem.count = 0;
    newItem.fields = [];

    fields.forEach((field) => {
      const newField = Object.assign({}, field);
      newField.value = 0;
      newItem.fields.push(newField);
    });

    key_index_lookup[index] = output_array.length;

    output_array.push(newItem);
  });


  input_array.forEach((row) => {
    const target_index = key_index_lookup[row[sum_key.column]];
    const target_item = output_array[target_index];

    fields.forEach((field, index) => {
      let aggregator = 'count';
      if (field.aggregateFunction) {
        aggregator = field.aggregateFunction.toLowerCase();
      }
      const row_value = row[`${field.column}_${aggregator}`];

      if (aggregator === 'sum' || aggregator === 'count'){
        target_item.fields[index].value += parseFloat(row_value);
      } else if (aggregator === 'avg') {
        // The AVG function requi[res some additional discussion
        // This currently returns the "avg of subitems",
        // when users may expect it to be the sum / count result
        // for the parent item.
        // For example - if you request an average group by year and month
        // It will give you the result of (sum of month values) / (count of month values)
        // rather than (sum of year values) / (count of year values)
        throw new Error(`Aggregate function (${aggregator}) is not available yet. Please use SUM or COUNT`);

        // For average, we count the number of items and multiply
        // by the current value, giving us the current sum
        const current_items = target_item.subitems.length;
        const current_sum = current_items * target_item.fields[index].value;

        // We then add the new value as well as the new item count
        // and calculate the new average
        const new_sum = current_sum + parseFloat(row_value);
        const new_items = current_items + 1; // For the item we're adding now

        target_item.fields[index].value = parseFloat(new_sum / new_items);
      } else {
        throw new Error(`Aggregate function (${aggregator}) is not available yet. Please use SUM or COUNT`);
      }
    });

    target_item.subitems.push(row);
  });

  return output_array;
}


const resolvers = {
  Query: {
    generic_stats(obj, args, context) {
      return([{"groupTitle":"Generic Stats are Disabled"}]);

      if (typeof args.fields === typeof undefined) return [];
      if (typeof args.dataset === typeof undefined) return [];

      const schema = args.schema;
      const dataset = args.dataset;
      const fields = args.fields;
      const groupBy = args.groupBy;
      const filterGroup = args.filters;

      let query = 'SELECT ';

      fields.forEach((field, index) => {
        if (index > 0) {
          query += ', ';
        }

        let aggregator = 'COUNT';
        if (field.aggregateFunction) {
          aggregator = field.aggregateFunction;
        }

        query += `
          ${aggregator}(${schema}.${dataset}.${field.column}::numeric) as 
          ${field.column}_${aggregator}
        `;
      });


      groupBy.forEach((field) => {
        if (field.dateField) {
          query += `, EXTRACT(${field.column} from ${field.dateField}) as ${field.column} `;
        } else {
          query += `, ${field.column} `;
        }
      });

      if (dataset === 'coa_apd_traffic_stop_name_data_table') {
        query += `FROM ${schema}.coa_apd_traffic_stops_post2017 
                  LEFT JOIN ${schema}.coa_apd_traffic_stop_name_data_table ON 
                  ( 
                    coa_apd_traffic_stops_post2017.traffic_stop_id = 
                    coa_apd_traffic_stop_name_data_table.traffic_stop_id
                  ) 
                `;
      } else {
        query += `FROM ${schema}.${dataset} `;
      }

      if (filterGroup) {
        query += ' WHERE ';

        query += generateWhereClausesFromFilterGroup(filterGroup);
      }

      if (groupBy && groupBy.length) {
        query += 'GROUP BY ';

        groupBy.forEach((field, index) => {
          if (index > 0) {
            query += ', ';
          }
          query += field.column;
        });

        query += ' ORDER BY ';

        groupBy.forEach((field, index) => {
          if (index > 0) {
            query += ', ';
          }

          let sortDirection = 'DESC';
          if (
              field.sortDirection &&
              (
                field.sortDirection === 'ASC' ||
                field.sortDirection === 'DESC'
              )
            ) {
            sortDirection = field.sortDirection;
          }
          query += `${field.column} ${sortDirection}`;
        });
      }

      // console.log('QUERY', query);
      return context.pool.query(query)
      .then((result) => {
        return prepareStats(result.rows, fields, groupBy);
      })
      .catch((err) => {
        console.error(`ERROR: ${err}`);
        throw new Error(`Got an error in stats: ${err}`);
      });
    },
  },
};

export default resolvers;
