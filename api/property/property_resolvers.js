const convertToPolygons = require('../common/convert_to_polygons').convertToPolgyons;

function prepareProperties(rows) {
  const pinMap = {};
  if (rows.length === 0) return [];
  rows.forEach(itm => {
    const taxExempt = (itm.exempt !== '');
    if (pinMap.hasOwnProperty(itm.pinnum)) {
      pinMap[itm.pinnum].civic_address_ids.push(itm.civicaddress_id);
    } else {
      pinMap[itm.pinnum] = {
        civic_address_ids: [itm.civicaddress_id],
        pinnum: itm.pinnum,
        pin: itm.pin,
        pinext: itm.pinext,
        address: itm.address,
        city: itm.cityname,
        zipcode: itm.zipcode,
        tax_exempt: taxExempt,
        neighborhood: itm.neighborhoodcode,
        appraisal_area: itm.appraisalarea,
        acreage: itm.acreage,
        zoning: itm.zoning,
        deed_link: itm.deedurl,
        property_card_link: itm.propcard,
        plat_link: itm.platurl,
        latitude: itm.latitude_wgs,
        longitude: itm.longitude_wgs,
        building_value: itm.buildingvalue,
        land_value: itm.landvalue,
        appraised_value: itm.appraisedvalue,
        tax_value: itm.taxvalue,
        market_value: itm.totalmarketvalue,
        owner: itm.owner,
        owner_address: itm.owner_address,
        polygon: itm.polygon,
      };
    }
  });
  const result = [];
  for (const k in pinMap) {
    if (pinMap.hasOwnProperty(k)) {
      result.push(pinMap[k]);
    }
  }
  return result;
}

const resolvers = {
  Query: {
    properties(obj, args, context) {
      const pool = context.pool;
      const pins = args.pins;
      if (pins.length <= 0) return [];
      const pinList = pins.map(p => {
        return `'${p}'`;
      }).join(',');
      const query = 'SELECT * FROM amd.v_simplicity_properties '
      + `WHERE pinnum in (${pinList})`;
      return pool.query(query)
      .then(result => {
        return prepareProperties(result.rows);
      })
      .catch(error => {
        console.log(`Error in properties endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
    properties_by_street(obj, args, context) {
      const pool = context.pool;
      const radius = (args.radius) ? Number(args.radius) : 100; // State plane units are feet
      const ids = args.centerline_ids;
      if (ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_properties_along_streets($1, $2)';
      const fargs = [
        ids,
        radius,
      ];
      return pool.query(query, fargs)
      .then(result => {
        return prepareProperties(result.rows);
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in properties_by_street: ${JSON.stringify(err)}`);
          throw new Error(err);
        }
      });
    },
    properties_by_neighborhood(obj, args, context) {
      const pool = context.pool;
      const ids = args.nbrhd_ids;
      if (ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_properties_by_neighborhood($1)';
      const fargs = [
        ids,
      ];
      return pool.query(query, fargs)
      .then(result => {
        return prepareProperties(result.rows);
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in properties_by_neighborhood: ${JSON.stringify(err)}`);
          throw new Error(err);
        }
      });
    },
  },
  Property: {
    polygons(obj) {
      const p = convertToPolygons(obj.polygon);
      return p;
    },
  },
};

module.exports = resolvers;
