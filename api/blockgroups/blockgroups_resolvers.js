const convertToPolygons = require('../common/convert_to_polygons').convertToPolgyons;

const resolvers = {
  Query: {
    blockgroups(obj, args, context) {
      const logger = context.logger;

      var query_args = [];
      var query = `
      SELECT geoid, name_1 name, below_pov, bipoc, totalhh, school_chi, bipoc_score, poverty_sc, acres, hvi_value, heat_score, 
      rpl_themes, cdc_score, avg_energy, hh_energy_, pct_hh_ene, energy_sco, resland, resflood, critland, 
      critflood, comflood, shape__len, shape__are, nemacscore, resiliency, cj_score, sum_scores, holc, red_score, wfirescore,
      st_astext(st_transform(shape, 4326)) AS polygon
      FROM internal.coa_climate_justice_index WHERE geoid = ANY ($1);
      `
      query_args.push(args.geoid);

     
      return context.pool.query(query, query_args)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          const p = convertToPolygons(itm.polygon);
          return {
          geoid: itm.geoid,
          name: itm.name,
          below_pov: itm.below_pov,
          bipoc: itm.bipoc,
          totalhh: itm.totalhh,
          school_chi: itm.school_chi,
          bipoc_score: itm.bipoc_score,
          poverty_sc: itm.poverty_sc,
          acres: itm.acres,
          hvi_value: itm.hvi_value,
          heat_score: itm.heat_score,
          rpl_themes: itm.rpl_themes,
          cdc_score: itm.cdc_score,
          avg_energy: itm.avg_energy,
          hh_energy_: itm.hh_energy_,
          pct_hh_ene: itm.pct_hh_ene,
          energy_sco: itm.energy_sco,
          resland: itm.resland,
          resflood: itm.resflood,
          critland: itm.critland,
          critflood: itm.critflood,
          comflood: itm.comflood,
          shape__len: itm.shape__len,
          shape__are: itm.shape__are,
          nemacscore: itm.nemacscore,
          resiliency: itm.resiliency,
          cj_score: itm.cj_score,
          sum_scores: itm.sum_scores,
          holc: itm.holc,
          red_score: itm.red_score,
          wfirescore: itm.wfirescore,
          polygon: (p && p.length > 0) ? p[0] : null,
          };
        });
      })
      .catch(error => {
        logger.error(`Error in blockgroup endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
  Blockgroup: {
    polygon(obj) { return obj.polygon; },
  },
};

module.exports = resolvers;

