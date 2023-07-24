function prepareAddresses(rows) {
  const aMap = {};
  if (rows.length === 0) return [];
  rows.forEach((itm) => {
    // if (idx < 10) console.log(JSON.stringify(itm));
    const maint = (itm.maintenance_entity) ? itm.maintenance_entity : null;
    if (!aMap.hasOwnProperty(itm.civicaddress_id)) {
      const prefix = itm.address_street_prefix ? itm.address_street_prefix : '';
      const street = itm.address_street_name ? itm.address_street_name : '';
      const streetType = itm.address_street_type ? itm.address_street_type : '';
      aMap[itm.civicaddress_id] = {
        civic_address_id: itm.civicaddress_id,
        address: itm.address_number !== 99999 ? itm.address_full : `${prefix} ${street} ${streetType} - No addressable building`,
        x: itm.longitude_wgs,
        y: itm.latitude_wgs,
        street_name: itm.address_street_name,
        street_prefix: itm.address_street_prefix,
        street_number: itm.address_number,
        street_type: streetType,
        unit: itm.address_unit,
        city: itm.address_city,
        zipcode: itm.address_zipcode,
        neighborhood: itm.nbrhd_name,
        neighborhood_id: itm.nbrhd_id,
        is_in_city: (itm.jurisdiction_type === 'Asheville Corporate Limits'),
        zoning: itm.zoning,
        zoning_links: itm.zoning_links,
        trash_day: itm.trash_pickup_day,
        recycling_pickup_district: itm.recycling_pickup_district,
        recycling_pickup_day: itm.recycling_pickup_day,
        brushweek: itm.brushweek,
        street_maintenance: maint,
        street_maintenance_location: itm.location,
        centerline_id: itm.centerline_id,
        pinnum: itm.property_pin + itm.property_pinext,
        pin: itm.property_pin,
        pinext: itm.property_pinext,
        owner_name: itm.owner_name,
        owner_address: itm.owner_address,
        owner_cityname: itm.owner_cityname,
        owner_state: itm.owner_state,
        owner_zipcode: itm.owner_zipcode,
        local_landmark: itm.local_landmark,
        historic_district: itm.historic_district,
        block_group: itm.block_group,
        climate_justice_score: itm.climate_justice_score,
      };
    } else { // Multiple - pick best for street maintenance
      const cur = aMap[itm.civicaddress_id];
      const newLocation = itm.location;
      if (cur.street_maintenance) {
        if (newLocation > 0 && newLocation < 1) {
          aMap[itm.civicaddress_id].street_maintenance = maint;
          aMap[itm.civicaddress_id].street_maintenance_location = newLocation;
        }
      } else {
        cur.street_maintenance = maint;
        cur.street_maintenance_location = itm.location;
      }
    }
  });
  const result = [];
  for (const k in aMap) {
    if (aMap.hasOwnProperty(k)) {
      result.push(aMap[k]);
    }
  }
  return result;
}

function doQuery(query, args, queryName, context) {
  return context.pool.query(query, args)
  .then((result) => {
    return prepareAddresses(result.rows);
  })
  .catch((err) => {
    throw new Error(`Got an error in ${queryName}: ${JSON.stringify(err)}`);
  });
}

const resolvers = {
  Query: {
    addresses(obj, args, context) {
      const logger = context.logger;
      if (args.civicaddress_ids.length <= 0) return [];
      const query = `
      SELECT
      a.civicaddress_id, a.address_full, a.address_city, a.address_zipcode, a.address_number,
      a.address_unit, a.address_street_prefix, a.address_street_name, a.address_street_type,
      a.latitude_wgs, a.longitude_wgs, a.trash_pickup_day, a.recycling_pickup_district,
      a.recycling_pickup_day, a.zoning, a.zoning_links, a.owner_name, a.owner_address, a.owner_cityname,
      a.owner_state, a.owner_zipcode, a.property_pin, a.property_pinext, a.centerline_id,
      a.jurisdiction_type, a.shape, a.brushweek, a.nbrhd_id, a.nbrhd_name, a.historic_district, a.local_landmark,
      b.maintenance_entity, b.location, a.block_group, a.climate_justice_score 
      FROM simplicity.v_simplicity_addresses_all AS a
      LEFT JOIN (
      select * from simplicity.v_address_maintenance as c where c.civicaddress_id = ANY ($1)
      ) as b
      ON a.civicaddress_id = b.civicaddress_id WHERE a.civicaddress_id = ANY ($1)
      `;
      return doQuery(query, [args.civicaddress_ids], 'addresses', context);
    },

    addresses_by_neighborhood(obj, args, context) {
      const logger = context.logger;
      if (args.nbrhd_ids.length <= 0) return [];
      const query = 'SELECT * FROM simplicity.get_addresses_by_neighborhood($1)';
      return doQuery(query, [args.nbrhd_ids], 'addresses_by_neighborhood', context);
    },

    addresses_by_street(obj, args, context) {
      const logger = context.logger;
      if (args.centerline_ids.length <= 0) return [];
      const query = `
      SELECT a.*, b.maintenance_entity, b.location FROM simplicity.v_simplicity_addresses AS a
      LEFT JOIN (
      select * from simplicity.v_address_maintenance as c where c.centerline_id = ANY ($1)
      ) as b
      ON a.civicaddress_id = b.civicaddress_id WHERE a.centerline_id = ANY ($1)
      `;
      return doQuery(query, [args.centerline_ids], 'addresses_by_street', context);
    },
  },
};

module.exports = resolvers;
