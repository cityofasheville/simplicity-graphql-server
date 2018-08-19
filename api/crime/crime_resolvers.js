function prepareCrimes(rows, before = null, after = null) {
  if (rows.length === 0) return [];
  return rows.map((itm) => {
    return {
      incident_id: itm.incident_id,
      agency: itm.agency,
      date_occurred: itm.date_occurred,
      case_number: itm.case_number,
      address: itm.address,
      geo_beat: itm.geo_beat,
      geo_report_area: itm.geo_report_area,
      x: itm.x_wgs,
      y: itm.y_wgs,
      offense_short_description: itm.offense_short_description,
      offense_long_description: itm.offense_long_description,
      offense_code: itm.offense_code,
      offense_group_code: itm.offense_group_code,
      offense_group_level: itm.offense_group_level,
      offense_group_short_description: itm.offense_group_short_description,
    };
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

function prc_sum_subitems(input_array, sum_key){
  var output_array = [];
  var top_level_keys = {};
  var key_index_lookup = {};

  input_array.forEach((row) => {
    console.log(row, sum_key, row[sum_key]);
    top_level_keys[row[sum_key] ] = true;
  });
console.log(top_level_keys);

  for(var index in top_level_keys){
    var temp = {};
    temp.grouptitle = index;
    temp.groupcategory = sum_key;
    temp.subitems = [];
    temp.count = 0;
    key_index_lookup[index] = output_array.length;

    output_array.push(temp);
  }

  input_array.forEach((row, index) => {
    var target_index = key_index_lookup[row[sum_key]];
    output_array[target_index].count += parseInt(row.count);

    output_array[target_index].subitems.push(row);
  });

  return output_array;
}

function prepareCrimesStats(rows, aggregateFields, dateAggregateFields, before = null, after = null) {
  if (rows.length === 0) return [];
  

  // PRC TESTINg
  var new_array = [];

  if(false){
    var test = {};
    test.grouptitle = "All";
    // test.subitems = rows;

    test.subitems = prc_sum_subitems(rows, dateAggregateFields[0]);

    var active_set = test.subitems;
    aggregateFields.forEach((field) => {
      console.log('doing', field);

      active_set.forEach((row) => {
        row.subitems = prc_sum_subitems(row.subitems, field);
      });
      console.log('finished', field);

      console.log(active_set);

      if(active_set.subitems){
        active_set = active_set.subitems;
      }
      else{
        // return;
      }
      // console.log(active_set);

      // active_set = active_set.subitems;
    });
  }

  // return active_set;

  var new_array = [];

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

  var top_level_key = false;
  var top_level_keys = {};
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
    return itm
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
    crimes_by_address(obj, args, context) {
      const logger = context.logger;
      const civicaddressId = String(args.civicaddress_id);
      const radius = Number(args.radius); // State plane units are feet
      const query = 'SELECT A.incident_id, A.date_occurred, A.case_number, '
      + 'A.address, A.geo_beat, A.x, A.y, A.x_wgs, A.y_wgs, A.offense_short_description, '
      + 'A.offense_long_description, A.offense_code, A.offense_group_code, '
      + 'A.offense_group_level, A.offense_group_short_description '
      + 'from amd.v_simplicity_crimes as A '
      + 'left outer join amd.coa_bc_address_master as B '
      + 'on ST_Point_Inside_Circle(ST_Point(A.x, A.y), B.address_x, B.address_y, $2) '
      + 'where b.civicaddress_id = $1 '; // Future function name change - ST_PointInsideCircle

      return context.pool.query(query, [civicaddressId, radius])
      .then(result => {
        return prepareCrimes(result.rows, args.before, args.after);
      })
      .catch((err) => {
        logger.error(`Got an error in crimes_by_address: ${err}`);
        throw new Error(`Got an error in crimes_by_address: ${err}`);
      });
    },
    crimes_by_street(obj, args, context) {
      const logger = context.logger;
      const radius = (args.radius) ? Number(args.radius) : 100; // State plane units are feet
      const ids = args.centerline_ids;
      if (ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_crimes_along_streets($1, $2)';
      return context.pool.query(query, [ids, radius])
      .then(result => {
        return prepareCrimes(result.rows, args.before, args.after);
      })
      .catch((err) => {
        if (err) {
          logger.error(`Got an error in crimes_by_street: ${err}`);
          throw new Error(err);
        }
      });
    },
    crimes_by_neighborhood(obj, args, context) {
      const logger = context.logger;
      if (args.nbrhd_ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_crimes_by_neighborhood($1)';

      return context.pool.query(query, [args.nbrhd_ids])
      .then(result => {
        return prepareCrimes(result.rows, args.before, args.after);
      })
      .catch((err) => {
        if (err) {
          logger.error(`Got an error in crimes_by_neighborhood: ${err}`);
          throw new Error(err);
        }
      });
    },
    crimes(obj, args, context) {
      const logger = context.logger;
      if (args.incident_ids.length <= 0) return [];
      const query = 'SELECT incident_id, agency, date_occurred, case_number, '
      + 'address, geo_beat, geo_report_area, x, y, x_wgs, y_wgs, offense_short_description, '
      + 'offense_long_description, offense_code, offense_group_code, '
      + 'offense_group_level, offense_group_short_description, '
      + 'offense_group_long_description '
      + 'FROM amd.v_simplicity_crimes WHERE incident_id = ANY ($1) ';
      return context.pool.query(query, [args.incident_ids])
      .then((result) => {
        return prepareCrimes(result.rows);
      })
      .catch((err) => {
        logger.error(`ERROR: ${err}`);
        throw new Error(`Got an error in crimes: ${err}`);
      });
    },
    all_crimes(obj, args, context) {
      const logger = context.logger;
      const query = 'SELECT incident_id, agency, date_occurred, case_number, '
      + 'address, geo_beat, geo_report_area, x, y, x_wgs, y_wgs, offense_short_description, '
      + 'offense_long_description, offense_code, offense_group_code, '
      + 'offense_group_level, offense_group_short_description, '
      + 'offense_group_long_description '
      + 'FROM amd.v_simplicity_crimes ';
      return context.pool.query(query, [])
      .then((result) => {
        return prepareCrimes(result.rows);
      })
      .catch((err) => {
        logger.error(`ERROR: ${err}`);
        throw new Error(`Got an error in crimes: ${err}`);
      });
    },
    stats_by_month(obj, args, context) {
      const logger = context.logger;
      const query = 'SELECT COUNT(incident_id) as count, agency, EXTRACT(month from date_occurred) as month, EXTRACT(year from date_occurred) as year '
      // + 'offense_long_description, offense_code, offense_group_code, '
      // + 'offense_group_level, offense_group_short_description, '
      // + 'offense_group_long_description '
      + 'FROM amd.v_simplicity_crimes '
      + 'GROUP BY year, month, agency '
      + 'ORDER BY year DESC, month DESC';
      return context.pool.query(query, [])
      .then((result) => {
        return prepareCrimesStats(result.rows);
      })
      .catch((err) => {
        logger.error(`ERROR: ${err}`);
        throw new Error(`Got an error in crimes: ${err}`);
      });
    },
    generic_month_stats(obj, args, context) {
      const logger = context.logger;

      if (typeof args.count === typeof undefined) return [];
      if (typeof args.dataset === typeof undefined) return [];
      if (typeof args.dataset === typeof undefined) return [];

      const count = args.count;
      const dataset = args.dataset;
      const date_field = args.dateField;

      var aggregateFields = args.groupBy;  // 
      var dateAggregateFields = args.byDate; //

      var query = 'SELECT COUNT($1::varchar) as count ';

      dateAggregateFields.forEach((field) => {
        query += ', EXTRACT(' + field + ' from ' + date_field + ') as ' + field + ' ';
      });

      aggregateFields.forEach((field) => {
        query += ', ' + field + ' ';
      });
      
      query += 'FROM amd.' + dataset + ' ';

      if(aggregateFields.length || dateAggregateFields.length){
        query += 'GROUP BY ';
        

        dateAggregateFields.forEach((field, index) => {
          if(index > 0){
            query += ', ';
          }
          query += field;
        });

        query += ', ';

        aggregateFields.forEach((field, index) => {
          if(index > 0){
            query += ', ';
          }
          query += field;
        });


        

        query += ' ORDER BY ';

        

        dateAggregateFields.forEach((field, index) => {
          if(index > 0){
            query += ', ';
          }
          query += field + ' DESC';
        });

          query += ', ';


        aggregateFields.forEach((field, index) => {
          if(index > 0){
            query += ', ';
          } 
          query += field + ' DESC';
        });

      }
      
      console.log('test', query, count, dataset);
      return context.pool.query(query, [count])
      .then((result) => {
        return prepareCrimesStats(result.rows, aggregateFields, dateAggregateFields);
      })
      .catch((err) => {
        logger.error(`ERROR: ${err}`);
        throw new Error(`Got an error in crimes: ${err}`);
      });
    },
  },
};

module.exports = resolvers;
