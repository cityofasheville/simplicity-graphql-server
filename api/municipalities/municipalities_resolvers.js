const convertToPolygons = require('../common/convert_to_polygons').convertToPolgyons;

function prepareJurisdictions(rows) {
  const jMap = {};
  if (rows.length === 0) return [];
  rows.forEach(itm => {
    if (!jMap.hasOwnProperty(itm.jurisdiction_type)) {
      jMap[itm.jurisdiction_type] = {
        jurisdiction: itm.jurisdiction_type,
        cityname: itm.cityname,
        polygons: [itm.polygon],
      };
    } else {
      jMap[itm.jurisdiction_type].polygons.push(itm.polygon);
    }
  });
  const result = [];
  for (const k in jMap) {
    if (jMap.hasOwnProperty(k)) {
      result.push(jMap[k]);
    }
  }
  return result;
}

const resolvers = {
  Query: {
    municipalities(obj, args, context) {
      let sendArgs = null;
      const logger = context.logger;
      let query = 'SELECT DISTINCT cityname, jurisdiction_type, '
      + 'st_astext(st_transform(shape, 4326)) AS polygon FROM amd.coa_active_jurisdictions '
      + "WHERE jurisdiction_type != 'Defunct ETJ' ";
      if (args.jurisdictions && args.jurisdictions.length > 0) {
        query += 'AND jurisdiction_type = ANY ($1)';
        sendArgs = [args.jurisdictions];
      }
      return context.pool.query(query, sendArgs)
      .then(result => {
        return prepareJurisdictions(result.rows);
      })
      .catch(error => {
        logger.error(`Error in jurisdictions endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
  Municipality: {
    polygons(obj) {
      const finalPolygons = [];
      obj.polygons.forEach(p => {
        const ptmp = convertToPolygons(p);
        ptmp.forEach(p2 => {
          finalPolygons.push(p2);
        });
      });
      return finalPolygons;
    },
  },
};

module.exports = resolvers;
