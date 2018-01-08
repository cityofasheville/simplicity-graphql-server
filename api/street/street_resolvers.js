const convertLines = require('../common/convert_lines').convertLines;
/*
     select distinct maintenance_entity
     from amd.coa_street_maintenance
     where to_number(centerline_id,'9999999999.000000') = C

*/
const resolvers = {
  Query: {
    streets(obj, args, context) {
      if (args.centerline_ids.length <= 0) return [];
      const query = 'SELECT DISTINCT a.centerline_id, a.full_street_name, a.left_zipcode, '
      + 'a.right_zipcode, b.maintenance_entity, a.line '
      + 'FROM amd.v_simplicity_streets as a LEFT JOIN '
      + 'amd.coa_street_maintenance as b '
      + "ON a.centerline_id = to_number(b.centerline_id,'9999999999.000000') "
      + 'WHERE a.centerline_id = ANY ($1)';
      return context.pool.query(query, [args.centerline_ids])
      .then(result => {
        const streetMap = {}
        if (result.rows.length === 0) return [];
        result.rows.forEach(itm => {
          if (!streetMap.hasOwnProperty(itm.centerline_id)) {
            streetMap[itm.centerline_id] = {
              centerline_id: itm.centerline_id,
              address: itm.full_street_name,
              left_zipcode: itm.left_zipcode,
              right_zipcode: itm.right_zipcode,
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
        console.log(`Error in streets endpoint: ${JSON.stringify(error)}`);
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
