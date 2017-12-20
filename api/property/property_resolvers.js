const convertToPolygons = require('../common/convert_to_polygons').convertToPolgyons;

const resolvers = {
  Query: {
    properties(obj, args, context) {
      const pool = context.pool;
      const pins = args.pins;
      if (pins.length <= 0) return [];
      const pinList = pins.map(p => {
        return `'${p}'`;
      }).join(',');
      const query = 'SELECT pin, pinext, pinnum, address, exempt, acreage, owner, cityname, '
      + 'zipcode, totalmarketvalue, appraisedvalue, taxvalue, landvalue, buildingvalue, '
      + 'propcard, deedurl, platurl, appraisalarea, neighborhoodcode, civicaddress_id, '
      + 'lattitude, longitude, zoning, owner_address, polygon '
      + 'FROM amd.v_simplicity_properties '
      + `WHERE pinnum in (${pinList})`;
      // console.log(`properties query: ${query}`);
      return pool.query(query)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          const taxExempt = (itm.exempt !== '');
          return {
            civic_address_ids: [itm.civicaddress_id],
            pinnum: itm.pin,
            pinnumext: itm.pinext,
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
            latitude: itm.lattitude,
            longitude: itm.longitude,
            building_value: itm.buildingvalue,
            land_value: itm.landvalue,
            appraised_value: itm.appraisedvalue,
            tax_value: itm.taxvalue,
            market_value: itm.totalmarketvalue,
            owner: itm.owner,
            owner_address: itm.owner_address,
            polygon: itm.polygon,
          };
        });
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
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          const taxExempt = (itm.exempt !== '');
          // console.log(`Got the ${itm.pinnum} geom: ${itm.polygon}`);
          return {
            civic_address_id: itm.civicaddress_id,
            pinnum: itm.pin,
            pinnumext: itm.pinext,
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
            latitude: itm.lattitude,
            longitude: itm.longitude,
            building_value: itm.buildingvalue,
            land_value: itm.landvalue,
            appraised_value: itm.appraisedvalue,
            tax_value: itm.taxvalue,
            market_value: itm.totalmarketvalue,
            owner: itm.owner,
            owner_address: itm.owner_address,
            polygon: itm.polygon,
          };
        });
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in properties_by_street: ${JSON.stringify(err)}`);
          throw new Error(err);
        }
      });
    },
  },
  Property: {
    polygons(obj) {
      return convertToPolygons(obj.polygon);
    },
  },
};

module.exports = resolvers;
