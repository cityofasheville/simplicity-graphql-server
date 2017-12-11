
const resolvers = {
  Query: {
    neighborhoods(obj, args, context) {
      const pool = context.pool;
      const ids = args.nbrhd_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(p => {
        return `'${p}'`;
      }).join(',');
      const query = 'SELECT name, nbhd_id, abbreviation, narrative '
      + 'FROM amd.coa_asheville_neighborhoods '
      + `WHERE nbhd_id in (${idList})`;
      console.log(`neighborhoods query: ${query}`);
      return pool.query(query)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          console.log(JSON.stringify(itm));
          return {
            name: itm.name,
            nbhd_id: itm.nbhd_id,
            abbreviation: itm.abbreviation,
            narrative: itm.narrative,
          };
        });
      })
      .catch(error => {
        console.log(`Error in neighborhoods endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
};

module.exports = resolvers;
