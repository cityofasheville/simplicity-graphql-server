

function generateWhereClausesFromFilterGroup(filterGroup) {
  let query = ' ( ';
  console.log('filters', filterGroup, typeof filterGroup.groups);

  if (filterGroup.groups && filterGroup.groups.length) {
    console.log('groups');
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
      query += ` ${field.key} ${field.op} '${field.value}' `;
    });
  }

  query += ' ) ';
  return query;
}

function prepareCrimesStatsNew(rows, groupBy) {
  if (rows.length === 0) return [];

  let new_array = [];

  const firstGroupBy = groupBy.shift();

  new_array = sumSubitemCounts(rows, firstGroupBy);

  // TODO: Make Multi-Dimensional Work
  if (groupBy.length) {
    const newGroupBy = groupBy.shift();
    new_array.forEach((row) => {
      row.subitems = sumSubitemCounts(row.subitems, newGroupBy);
    });
  } else {

    // new_array.forEach((row, index) => {
    //       row.subitems.map((itm) => {
    //             itm.subitems = [];
    //             return itm;
    //           });
    // });

  }
  return new_array;
}

function sumSubitemCounts(input_array, sum_key) {
  const output_array = [];
  const top_level_keys = {};
  const key_index_lookup = {};

  input_array.forEach((row) => {
    top_level_keys[row[sum_key.column]] = true;
  });

  Object.keys(top_level_keys).forEach((index) => {
    const temp = {};
    temp.grouptitle = index;
    temp.groupcategory = sum_key.column;
    temp.subitems = [];
    temp.count = 0;
    key_index_lookup[index] = output_array.length;

    output_array.push(temp);
  });

  input_array.forEach((row) => {
    const target_index = key_index_lookup[row[sum_key.column]];
    output_array[target_index].count += parseInt(row.count, 10);

    output_array[target_index].subitems.push(row);
  });

  return output_array;
}


const resolvers = {
  Query: {
    generic_stats(obj, args, context) {
      const logger = context.logger;

      if (typeof args.fields === typeof undefined) return [];
      if (typeof args.dataset === typeof undefined) return [];

      const dataset = args.dataset;
      const fields = args.fields;
      const filterGroup = args.filters;
      const groupBy = args.groupBy;

      let query = 'SELECT ';

      fields.forEach((field) => {
        let aggregator = 'COUNT';
        if (field.aggregateFunction) {
          aggregator = field.aggregateFunction;
        }

        query += `${aggregator}(amd.${dataset}.${field.column}) as count `;
        // query += `${aggregator}(amd.${dataset}.${field.column}) as ${field.column}`;
      });


      groupBy.forEach((field) => {
        if (field.dateField) {
          query += `, EXTRACT(${field.column} from ${field.dateField}) as ${field.column} `;
        } else {
          query += `, ${field.column} `;
        }
      });

      if (dataset === 'coa_apd_traffic_stop_name_data_table') {
        query += `FROM amd.coa_apd_traffic_stops_post2017 
                  LEFT JOIN amd.coa_apd_traffic_stop_name_data_table ON 
                  ( 
                    coa_apd_traffic_stops_post2017.traffic_stop_id = 
                    coa_apd_traffic_stop_name_data_table.traffic_stop_id
                  ) 
                `;
      } else {
        query += `FROM amd.${dataset} `;
      }

      console.log('filter group', filterGroup, typeof filterGroup, args);
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
          query += `${field.column} DESC`;
        });
      }

      console.log('test', query);
      return context.pool.query(query)
      .then((result) => {
        return prepareCrimesStatsNew(result.rows, groupBy);
      })
      .catch((err) => {
        logger.error(`ERROR: ${err}`);
        throw new Error(`Got an error in stats: ${err}`);
      });
    },
  },
};

module.exports = resolvers;
