import { convertToPolygons } from '../common/convert_to_polygons.js';

const resolvers = {
  Query: {
    climate(obj, args, context) {
      var query_args = [];
      var query = `
      SELECT geoid, name_1, totalhh, heat_score, cdc_score, avg_energy, sum_scores, holc, red_score, wfirescore,
      all_assets_all_threats_sum_score, all_assets_ncem_vr_percent, all_assets_ncem_vr_count, all_assets_wildfire_vr_percent,
      all_assets_wildfire_vr_count, all_assets_landslide_vr_percent, all_assets_landslide_vr_count, hvi_level, tree_level,
      tcc, svi,
      st_astext(st_transform(shape, 4326)) AS polygon
      FROM internal.coa_climate_justice_index WHERE geoid = ANY ($1);
      `;
      query_args.push(args.geoid);

      return context.pool
        .query(query, query_args)
        .then((result) => {
          if (result.rows.length === 0) return [];
          return result.rows.map((itm) => {
            const p = convertToPolygons(itm.polygon);
            return {
              geoid: itm.geoid,
              name: itm.name_1,
              totalhh: itm.totalhh,
              heat_score: itm.heat_score,
              cdc_score: itm.cdc_score,
              avg_energy: itm.avg_energy,
              sum_scores: itm.sum_scores,
              holc: itm.holc,
              red_score: itm.red_score,
              wfirescore: itm.wfirescore,
              all_assets_all_threats_sum_score: itm.all_assets_all_threats_sum_score,
              all_assets_ncem_vr_percent: itm.all_assets_ncem_vr_percent,
              all_assets_ncem_vr_count: itm.all_assets_ncem_vr_count,
              all_assets_wildfire_vr_percent: itm.all_assets_wildfire_vr_percent,
              all_assets_wildfire_vr_count: itm.all_assets_wildfire_vr_count,
              all_assets_landslide_vr_percent: itm.all_assets_landslide_vr_percent,
              all_assets_landslide_vr_count: itm.all_assets_landslide_vr_count,
              hvi_level: itm.hvi_level,
              tree_level: itm.tree_level,
              tcc: itm.tcc,
              svi: itm.svi,
              polygon: p && p.length > 0 ? p[0] : null,
            };
          });
        })
        .catch((error) => {
          console.error(`Error in climate endpoint: ${JSON.stringify(error)}`);
          throw new Error(error);
        });
    },
  },
  Climate: {
    polygon(obj) {
      return obj.polygon;
    },
  },
};

export default resolvers;
