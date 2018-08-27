function prc_sum_subitems(input_array, sum_key) {
  const output_array = [];
  const top_level_keys = {};
  const key_index_lookup = {};

  input_array.forEach((row) => {
    console.log(row, sum_key, row[sum_key]);
    top_level_keys[row[sum_key]] = true;
  });

  for (var index in top_level_keys) {
    let temp = {};
    temp.grouptitle = index;
    temp.groupcategory = sum_key;
    temp.subitems = [];
    temp.count = 0;
    key_index_lookup[index] = output_array.length;

    output_array.push(temp);
  }

  input_array.forEach((row, index) => {
    const target_index = key_index_lookup[row[sum_key]];
    output_array[target_index].count += parseInt(row.count);

    output_array[target_index].subitems.push(row);
  });

  return output_array;
}

function prepareCrimesStats(rows, aggregateFields, dateAggregateFields, before = null, after = null) {
  if (rows.length === 0) return [];

  if (false) {
    let test = {};
    test.grouptitle = "All";
    // test.subitems = rows;

    test.subitems = prc_sum_subitems(rows, dateAggregateFields[0]);

    let active_set = test.subitems;
    aggregateFields.forEach((field) => {
      console.log('doing', field);

      active_set.forEach((row) => {
        row.subitems = prc_sum_subitems(row.subitems, field);
      });
      console.log('finished', field);

      console.log(active_set);

      if (active_set.subitems) {
        active_set = active_set.subitems;
      }
      else {
        // return;
      }
      // console.log(active_set);

      // active_set = active_set.subitems;
    });
  }

  // return active_set;

  let new_array = [];

  new_array = prc_sum_subitems(rows, dateAggregateFields[0]);
  new_array.forEach((row, index) => {
    console.log('row submitems', row.subitems);
    row.subitems = prc_sum_subitems(row.subitems, aggregateFields[0]);

    row.subitems.forEach((row2) => {
        row2.subitems = prc_sum_subitems(row2.subitems, aggregateFields[1]);

        if(aggregateFields.length >= 3){
          row2.subitems.forEach((row3) => {
            row3.subitems = prc_sum_subitems(row3.subitems, aggregateFields[2]);
            if(aggregateFields.length == 3){
              row3.subitems.map((itm) => {
                itm.subitems = [];
                return itm;
              });
            }
          });
        }
    });
  });
  // console.log(new_array);
  return new_array;

  let top_level_key = false;
  const top_level_keys = {};
  top_level_key = aggregateFields.pop();

  rows.forEach((row) => {
    top_level_keys[row[top_level_key] ] = true;
  });

  console.log(top_level_keys);

  for(var index in top_level_keys){
    var temp = {};
    temp.grouptitle = index;
    temp.subitems = [];
    new_array.push(temp);
  }



  // aggregateFields.forEach((field, index) => {
  //   new_array.forEach((field) => {
  //     field.subitems = [];
  //   });
  // });

  return new_array;


  rows.forEach((field) => {
    field.subitems = [];
  });
  rows = new_array;
  // END PRC TESTING

  return rows.map((itm, index) => {
    console.log(itm);
    // item.subitem_title[index] = itm.count;
    return itm;
    // return {
    //   count: itm.count,
    //   agency: itm.agency,
    //   date_occurred : itm.date_occurred,
    //   date : new Date(itm.date_occurred),

    // };
  })
  .filter((item) => {
    let keep = true;
    if (after || before) {
      const date1 = new Date(item.date_occurred);
      if (after && date1 < new Date(`${after} 00:00:00 GMT-0500`)) {
        keep = false;
      }
      if (keep && before && date1 > new Date(`${before} 00:00:00 GMT-0500`)) {
        keep = false;
      }
    }
    return keep;
  });
}

const resolvers = {
  Query: {
    generic_month_stats(obj, args, context) {
      const logger = context.logger;

      if (typeof args.count === typeof undefined) return [];
      if (typeof args.dataset === typeof undefined) return [];
      // if (typeof args.dataset === typeof undefined) return [];

      const count = args.count;
      const dataset = args.dataset;
      const date_field = args.dateField;
      const filterGroups = args.filters;
      const aggregateFields = args.groupBy;
      const dateAggregateFields = args.byDate;

      let query = 'SELECT COUNT($1::varchar) as count ';

      dateAggregateFields.forEach((field) => {
        query += `, EXTRACT(${field} from ${date_field}) as ${field} `;
      });

      aggregateFields.forEach((field) => {
        query += `, ${field} `;
      });

      query += `FROM amd.${dataset} `;

      if (dataset === 'coa_apd_traffic_stop_name_data_table') {
        // query += ' JOIN amd.coa_apd_traffic_stops_post2017 ON (coa_apd_traffic_stops_post2017.traffic_stop_id = coa_apd_traffic_stop_name_data_table.traffic_stop_id) '
        query += ' JOIN amd.coa_apd_traffic_stops_pre2017 ON ';
        query += ' (coa_apd_traffic_stops_pre2017.traffic_stop_id = coa_apd_traffic_stop_name_data_table.traffic_stop_id) ';
      }

      if (filterGroups && filterGroups.length) {
        query += ' WHERE ';

        console.log(filterGroups);
        filterGroups.forEach((filterGroup) => {
          filterGroup.filters.forEach((field, index) => {
            if (index > 0) {
              query += ` ${filterGroup.op} `;
            }
            query += ` ${field.key} ${field.op} '${field.value}' `;
          });
        });
      }

      if (aggregateFields.length || dateAggregateFields.length) {
        query += 'GROUP BY ';

        dateAggregateFields.forEach((field, index) => {
          if (index > 0) {
            query += ', ';
          }
          query += field;
        });

        query += ', ';

        aggregateFields.forEach((field, index) => {
          if (index > 0) {
            query += ', ';
          }
          query += field;
        });

        query += ' ORDER BY ';

        dateAggregateFields.forEach((field, index) => {
          if (index > 0) {
            query += ', ';
          }
          query += `${field} DESC`;
        });

        query += ', ';

        aggregateFields.forEach((field, index) => {
          if (index > 0) {
            query += ', ';
          }
          query += `${field} DESC`;
        });
      }

      console.log('test', query);
      return context.pool.query(query, [`amd.${dataset}.${count}`])
      .then((result) => {
        return prepareCrimesStats(result.rows, aggregateFields, dateAggregateFields);
      })
      .catch((err) => {
        logger.error(`ERROR: ${err}`);
        throw new Error(`Got an error in stats: ${err}`);
      });
    },
  },
};

module.exports = resolvers;
