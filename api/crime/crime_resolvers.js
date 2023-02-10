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

const resolvers = {
  Query: {
    crimes_by_address(obj, args, context) {
      const logger = context.logger;
      const civicaddressId = String(args.civicaddress_id);
      const radius = Number(args.radius); // State plane units are feet
      const query = `
      SELECT A.incident_id, TO_CHAR(A.date_occurred, 'YYYY-MM-DD') date_occurred, A.case_number,
      A.address, A.geo_beat, A.x, A.y, A.x_wgs, A.y_wgs, A.offense_short_description,
      A.offense_long_description, A.offense_code, A.offense_group_code,
      A.offense_group_level, A.offense_group_short_description
      from simplicity.v_simplicity_crimes as A
      left outer join internal.coa_bc_address_master as B
      on ST_PointInsideCircle(ST_Point(A.x, A.y), B.address_x, B.address_y, $2)
      where b.civicaddress_id = $1 
      `;

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
      const query = `SELECT incident_id, agency, TO_CHAR(date_occurred, 'YYYY-MM-DD') date_occurred, case_number,
      address, geo_beat, geo_report_area, x, y, x_wgs, y_wgs, offense_short_description,
      offense_long_description, offense_code, offense_group_code,
      offense_group_level, offense_group_short_description,
      offense_group_long_description FROM simplicity.get_crimes_along_streets($1, $2)`;
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
      const query = `
      SELECT incident_id, agency, TO_CHAR(date_occurred, 'YYYY-MM-DD') date_occurred, case_number,
      address, geo_beat, geo_report_area, x, y, x_wgs, y_wgs, offense_short_description,
      offense_long_description, offense_code, offense_group_code,
      offense_group_level, offense_group_short_description,
      offense_group_long_description FROM simplicity.get_crimes_by_neighborhood($1)
      `;

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
      const query = `
      SELECT incident_id, agency, TO_CHAR(A.date_occurred, 'YYYY-MM-DD') date_occurred, case_number,
      address, geo_beat, geo_report_area, x, y, x_wgs, y_wgs, offense_short_description,
      offense_long_description, offense_code, offense_group_code,
      offense_group_level, offense_group_short_description,
      offense_group_long_description
      FROM simplicity.v_simplicity_crimes WHERE incident_id = ANY ($1)
      `;
      return context.pool.query(query, [args.incident_ids])
      .then((result) => {
        return prepareCrimes(result.rows);
      })
      .catch((err) => {
        logger.error(`ERROR: ${err}`);
        throw new Error(`Got an error in crimes: ${err}`);
      });
    },
  },
};

module.exports = resolvers;
