function prepareAddresses(rows) {
  const aMap = {};
  if (rows.length === 0) return [];
  rows.forEach((itm) => {
    // if (idx < 10) console.log(JSON.stringify(itm));
    const maint = (itm.maintenance_entity) ? itm.maintenance_entity : null;
    if (!aMap.hasOwnProperty(itm.civicaddress_id)) {
      aMap[itm.civicaddress_id] = {
        civic_address_id: itm.civicaddress_id,
        address: itm.address_full,
        x: itm.longitude_wgs,
        y: itm.latitude_wgs,
        street_name: itm.address_street_name,
        street_prefix: itm.address_street_prefix,
        street_number: itm.address_number,
        unit: itm.address_unit,
        city: itm.address_city,
        zipcode: itm.address_zipcode,
        is_in_city: (itm.jurisdiction_type === 'Asheville Corporate Limits'),
        zoning: itm.zoning,
        trash_day: itm.trash_pickup_day,
        recycling_pickup_district: itm.recycling_pickup_district,
        recycling_pickup_day: itm.recycling_pickup_day,
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
      // console.log(`Here with ids ${JSON.stringify(args)}`);
      if (args.civicaddress_ids.length <= 0) return [];
      // const query = 'SELECT a.*, b.maintenance_entity, b.location FROM amd.v_simplicity_addresses AS a '
      // + 'LEFT JOIN amd.v_address_maintenance as b '
      // + 'ON a.civicaddress_id = b.civicaddress_id WHERE a.civicaddress_id = ANY ($1)';
      const query = 'SELECT a.*, b.maintenance_entity,  b.location FROM amd.v_simplicity_addresses AS a '
      + 'LEFT JOIN ('
      + 'select * from amd.v_address_maintenance as c where c.civicaddress_id = ANY ($1) '
      + ') as b '
      + 'ON a.civicaddress_id = b.civicaddress_id WHERE a.civicaddress_id = ANY ($1)';
      console.log(query);
      return doQuery(query, [args.civicaddress_ids], 'addresses', context);
    },

    addresses_by_neighborhood(obj, args, context) {
      if (args.nbrhd_ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_addresses_by_neighborhood($1)';
      return doQuery(query, [args.nbrhd_ids], 'addresses_by_neighborhood', context);
    },

    addresses_by_street(obj, args, context) {
      if (args.centerline_ids.length <= 0) return [];
      const query = 'SELECT a.*, b.maintenance_entity, b.location FROM amd.v_simplicity_addresses AS a '
      + 'LEFT JOIN ('
      + 'select * from amd.v_address_maintenance as c where c.centerline_id = ANY ($1) '
      + ') as b '
      + 'ON a.civicaddress_id = b.civicaddress_id WHERE a.centerline_id = ANY ($1)';
      return doQuery(query, [args.centerline_ids], 'addresses_by_street', context);
    },
  },
};

module.exports = resolvers;
