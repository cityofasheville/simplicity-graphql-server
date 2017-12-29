const convertLines = require('../common/convert_lines').convertLines;

const resolvers = {
  Query: {
    streets(obj, args, context) {
      if (args.centerline_ids.length <= 0) return [];
      const query = 'SELECT centerline_id, full_street_name, left_zipcode, right_zipcode, line '
      + 'FROM amd.v_simplicity_streets WHERE centerline_id = ANY ($1)';
      return context.pool.query(query, [args.centerline_ids])
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          return {
            centerline_id: itm.centerline_id,
            address: itm.full_street_name,
            left_zipcode: itm.left_zipcode,
            right_zipcode: itm.right_zipcode,
            lines: itm.line,
          };
        });
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
