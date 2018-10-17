const convertLines = require('../common/convert_lines').convertLines;

const resolvers = {
  Query: {
    streets(obj, args, context) {
      const logger = context.logger;
      if (args.centerline_ids.length <= 0) return [];
      const query = 'SELECT DISTINCT a.centerline_id, a.full_street_name, a.left_zipcode, '
      + 'a.left_from_address, a.left_to_address, a.right_from_address, a.right_to_address, '
      + 'a.right_zipcode, b.maintenance_entity, a.line '
      + 'FROM amd.v_simplicity_streets as a LEFT JOIN '
      + 'amd.coa_street_maintenance as b '
      + "ON a.centerline_id = to_number(b.centerline_id,'9999999999.000000') "
      + 'WHERE a.centerline_id = ANY ($1)';
      return context.pool.query(query, [args.centerline_ids])
      .then(result => {
        const streetMap = {};
        if (result.rows.length === 0) return [];
        result.rows.forEach(itm => {
          if (!streetMap.hasOwnProperty(itm.centerline_id)) {
            const from_address = Math.min(itm.left_from_address, itm.right_from_address);
            const to_address = Math.max(itm.left_to_address, itm.right_to_address);            
            streetMap[itm.centerline_id] = {
              centerline_id: itm.centerline_id,
              address: itm.full_street_name,
              left_zipcode: itm.left_zipcode,
              right_zipcode: itm.right_zipcode,
              from_address,
              to_address,
              left_from_address: itm.left_from_address,
              left_to_address: itm.left_to_address,
              right_from_address: itm.right_from_address,
              right_to_address: itm.right_to_address,
              maintenance_entities: [],
              lines: itm.line,
            };
          }
          streetMap[itm.centerline_id].maintenance_entities.push(itm.maintenance_entity);
        });
        const items = [];
        for (const k in streetMap) {
          if (streetMap.hasOwnProperty(k)) {
            items.push(streetMap[k]);
          }
        }
        return items;
      })
      .catch(error => {
        logger.error(`Error in streets endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
  Street: {
    line(obj) {
      const result = convertLines(obj.lines);
      return result;
    },
  },
};

module.exports = resolvers;
