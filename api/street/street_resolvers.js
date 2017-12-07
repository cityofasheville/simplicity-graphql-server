const convertLines = require('../common/convert_lines').convertLines;

const resolvers = {
  Query: {
    streets(obj, args, context) {
      const pool = context.pool;
      const ids = args.centerline_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(p => {
        return `'${p}'`;
      }).join(',');
      const query = 'SELECT centerline_id, full_street_name, left_zipcode, right_zipcode, line '
      + 'FROM amd.v_simplicity_streets '
      + `WHERE centerline_id in (${idList})`;
      console.log(`properties query: ${query}`);
      return pool.query(query)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          console.log(JSON.stringify(itm));
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
    lines(obj) {
      const result = convertLines(obj.lines);
      return { points: result };
    },
  },
};

module.exports = resolvers;
