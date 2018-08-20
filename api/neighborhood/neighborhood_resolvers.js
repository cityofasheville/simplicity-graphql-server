const convertToPolygons = require('../common/convert_to_polygons').convertToPolgyons;

const resolvers = {
  Query: {
    neighborhoods(obj, args, context) {
      const logger = context.logger;

      var query_args = [];
      var query = 'SELECT name, nbhd_id, abbreviation, narrative, '
      + 'st_astext(st_transform(shape, 4326)) AS polygon '
      + 'FROM amd.coa_asheville_neighborhoods ';

      if (typeof args.nbrhd_ids !== typeof undefined && args.nbrhd_ids.length > 0) {
        query += ' WHERE nbhd_id = ANY ($1)';
        query_args.push(args.nbrhd_ids);
      }
     
      return context.pool.query(query, query_args)
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
        logger.error(`Error in neighborhoods endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
  Neighborhood: {
    polygon(obj) { return obj.polygon; },
  },
};

module.exports = resolvers;
