
const resolvers = {
  Query: {
    crimes_by_address(obj, args, context) {
      const civicaddressId = String(args.civicaddress_id);
      const before = args.before;
      const after = args.after;
      const radius = Number(args.radius); // State plane units are feet
      const pool = context.pool;
      let query = 'SELECT A.incident_id, A.date_occurred, A.case_number, '
      + 'A.address, A.geo_beat, A.x, A.y, A.x_wgs, A.y_wgs, A.offense_short_description, '
      + 'A.offense_long_description, A.offense_code, A.offense_group_code, '
      + 'A.offense_group_level, A.offense_group_short_description '
      + 'from amd.v_simplicity_crimes as A '
      + 'left outer join amd.coa_bc_address_master as B '
      + 'on ST_Point_Inside_Circle(ST_Point(A.x, A.y), B.address_x, B.address_y, $2) '
      + 'where b.civicaddress_id = $1 '; // Future function name change - ST_PointInsideCircle
      const qargs = [civicaddressId, radius];
      let nextParam = '$3';
      if (before !== undefined) {
        qargs.push(`'${before}'`);
        query += `and date_occurred < ${nextParam} `;
        nextParam = '$4';
      }
      if (after !== undefined) {
        qargs.push(`'${after}'`);
        query += `and date_occurred > ${nextParam} `;
      }

      return pool.query(query, qargs)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
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
        });
      })
      .catch((err) => {
        console.log(`Got an error in crimes_by_address: ${JSON.stringify(err)}`);
        throw new Error(`Got an error in crimes_by_address: ${JSON.stringify(err)}`);
      });
    },
    crimes_by_street(obj, args, context) {
      const pool = context.pool;
      const radius = (args.radius) ? Number(args.radius) : 100; // State plane units are feet
      const ids = args.centerline_ids;
      if (ids.length <= 0) return [];
      const before = args.before;
      const after = args.after;
      const query = 'SELECT * FROM amd.get_crimes_along_streets($1, $2)';
      const fargs = [
        ids,
        radius,
      ];
      return pool.query(query, fargs)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
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
        });
      })
      .then(results => {
        return results
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
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in crimes_by_street: ${JSON.stringify(err)}`);
          throw new Error(err);
        }
      });
    },
    crimes_by_neighborhood(obj, args, context) {
      const pool = context.pool;
      const ids = args.nbrhd_ids;
      if (ids.length <= 0) return [];
      const before = args.before;
      const after = args.after;
      const query = 'SELECT * FROM amd.get_crimes_by_neighborhood($1)';
      const fargs = [
        ids,
      ];
      return pool.query(query, fargs)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
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
        });
      })
      .then(results => {
        return results
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
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in crimes_by_street: ${JSON.stringify(err)}`);
          throw new Error(err);
        }
      });
    },
    crimes(obj, args, context) {
      const pool = context.pool;
      const ids = args.incident_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');
      const query = 'SELECT incident_id, agency, date_occurred, case_number, '
      + 'address, geo_beat, geo_report_area, x, y, x_wgs, y_wgs, offense_short_description, '
      + 'offense_long_description, offense_code, offense_group_code, '
      + 'offense_group_level, offense_group_short_description, '
      + 'offense_group_long_description '
      + `FROM amd.v_simplicity_crimes WHERE incident_id in (${idList}) `;
      return pool.query(query)
      .then((result) => {
        if (result.rows.length === 0) return [];
        const p = result.rows;
        return p.map(itm => {
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
            offense_group_long_description: itm.offense_group_long_description,
          };
        });
      })
      .catch((err) => {
        console.log(`ERROR: ${err}`);
        throw new Error(`Got an error in crimes: ${JSON.stringify(err)}`);
      });
    },
  },
};

module.exports = resolvers;
