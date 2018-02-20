const convertToPolygons = require('../common/convert_to_polygons').convertToPolgyons;

function prepareProperties(rows) {
  const pinMap = {};
  if (rows.length === 0) return [];
  rows.forEach(itm => {
    const taxExempt = (itm.exempt !== '');
    if (!pinMap.hasOwnProperty(itm.pinnum)) {
      pinMap[itm.pinnum] = {
        pinnum: itm.pinnum,
        pin: itm.pin,
        pinext: itm.pinext,
        property_civic_address_id: itm.civicaddress_id,
        property_address: itm.address,
        property_city: itm.cityname,
        property_zipcode: itm.zipcode,
        civic_address_ids: [],
        address: [],
        city: [],
        zipcode: [],
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
    if (itm.location_type === 1) {
      pinMap[itm.pinnum].civic_address_ids.push(itm.civicaddress_id);
      pinMap[itm.pinnum].address.push(itm.address);
      pinMap[itm.pinnum].city.push(itm.cityname);
      pinMap[itm.pinnum].zipcode.push(itm.zipcode);
    } else { // Overwrite if location_type = 0
      pinMap[itm.pinnum].property_civic_address_id = itm.civicaddress_id;
      pinMap[itm.pinnum].property_address = itm.address;
      pinMap[itm.pinnum].property_city = itm.cityname;
      pinMap[itm.pinnum].property_zipcode = itm.zipcode;
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
      const logger = context.logger;
      if (args.pins.length <= 0) return [];
      const query = 'SELECT DISTINCT * FROM amd.v_simplicity_properties '
      + 'WHERE pinnum = ANY ($1)';
      return context.pool.query(query, [args.pins])
      .then(result => {
        return prepareProperties(result.rows);
      })
      .catch(error => {
        logger.error(`Error in properties endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
    properties_by_street(obj, args, context) {
      const logger = context.logger;
      const radius = (args.radius) ? Number(args.radius) : 100; // State plane units are feet
      if (args.centerline_ids.length <= 0) return [];
      const query = 'SELECT DISTINCT * FROM amd.get_properties_along_streets($1, $2) '
      + 'ORDER BY pinnum';
      return context.pool.query(query, [args.centerline_ids, radius])
      .then(result => {
        return prepareProperties(result.rows);
      })
      .catch((err) => {
        if (err) {
          logger.error(`Got an error in properties_by_street: ${JSON.stringify(err)}`);
          throw new Error(err);
        }
      });
    },
    properties_by_neighborhood(obj, args, context) {
      const logger = context.logger;
      if (args.nbrhd_ids.length <= 0) return [];
      const query = 'SELECT DISTINCT * FROM amd.get_properties_by_neighborhood($1)';
      return context.pool.query(query, [args.nbrhd_ids])
      .then(result => {
        return prepareProperties(result.rows);
      })
      .catch((err) => {
        if (err) {
          logger.error(`Got an error in properties_by_neighborhood: ${JSON.stringify(err)}`);
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
