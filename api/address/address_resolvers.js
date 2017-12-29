function prepareAddresses(rows) {
  if (rows.length === 0) return [];
  return rows.map((itm) => {
    return {
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
  });
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
      console.log(`Here with ids ${JSON.stringify(args)}`);
      if (args.civicaddress_ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.v_simplicity_addresses WHERE civicaddress_id = ANY ($1)';
      return doQuery(query, [args.civicaddress_ids], 'addresses', context);
    },

    addresses_by_neighborhood(obj, args, context) {
      if (args.nbrhd_ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_addresses_by_neighborhood($1)';
      return doQuery(query, [args.nbrhd_ids], 'addresses_by_neighborhood', context);
    },

    addresses_by_street(obj, args, context) {
      if (args.centerline_ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.v_simplicity_addresses WHERE centerline_id = ANY ($1)';
      return doQuery(query, [args.centerline_ids], 'addresses_by_street', context);
    },
  },
};

module.exports = resolvers;
