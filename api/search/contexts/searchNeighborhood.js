import { convertToPolygons } from '../../common/convert_to_polygons.js';

function searchNeighborhood(searchString, context) {
  const logger = context.logger;
  const myQuery = 'SELECT name, nbhd_id, abbreviation, narrative, '
  + 'st_astext(st_transform(shape, 4326)) AS polygon '
  + 'FROM internal.coa_asheville_neighborhoods '
  + `where name ILIKE '%${searchString}%' AND narrative IN ('Active', 'In transition')`;
  return context.pool.query(myQuery)
  .then(result => {
    if (result.rows.length === 0) return { type: 'neighborhood', results: [] };

    const finalResult = {
      type: 'neighborhood',
      results: result.rows.map(row => {
        const p = convertToPolygons(row.polygon);
        return {
          score: 0,
          type: 'neighborhood',
          name: row.name,
          nbhd_id: row.nbhd_id,
          abbreviation: row.abbreviation,
          polygon: (p && p.length > 0) ? p[0] : null,
        };
      }),
    };
    return finalResult;
  })
  .catch((err) => {
    if (err) {
      logger.error(`Got an error in searchNeighborhood: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

export default searchNeighborhood;
