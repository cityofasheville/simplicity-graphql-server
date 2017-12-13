const convertToPolygons = require('../common/convert_to_polygons').convertToPolgyons;

const resolvers = {
  Query: {
    neighborhoods(obj, args, context) {
      const pool = context.pool;
      const ids = args.nbrhd_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(p => {
        return `'${p}'`;
      }).join(',');
      const query = 'SELECT name, nbhd_id, abbreviation, narrative, '
      + 'st_astext(st_transform(shape, 4326)) AS polygon '
      + 'FROM amd.coa_asheville_neighborhoods '
      + `WHERE nbhd_id in (${idList})`;
      return pool.query(query)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          const p = convertToPolygons(itm.polygon);
          return {
            name: itm.name,
            nbhd_id: itm.nbhd_id,
            abbreviation: itm.abbreviation,
            narrative: itm.narrative,
            polygon: (p && p.length > 0) ? p[0] : null,
          };
        });
      })
      .catch(error => {
        console.log(`Error in neighborhoods endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
  Neighborhood: {
    polygon(obj) { return obj.polygon; },
  }
};

module.exports = resolvers;
