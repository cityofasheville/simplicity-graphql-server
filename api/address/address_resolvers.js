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
      pinnum: itm.property_pin,
      pinnumext: itm.property_pinext,
      owner_name: itm.owner_name,
      owner_address: itm.owner_address,
      owner_cityname: itm.owner_cityname,
      owner_state: itm.owner_state,
      owner_zipcode: itm.owner_zipcode,
    };
  });
}

const resolvers = {
  Query: {
    addresses(obj, args, context) {
      const pool = context.pool;
      const ids = args.civicaddress_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');

      const query = 'SELECT * '
      + `FROM amd.v_simplicity_addresses WHERE civicaddress_id in (${idList}) `;
      return pool.query(query)
      .then((result) => {
        return prepareAddresses(result.rows);
      })
      .catch((err) => {
        throw new Error(`Got an error in addresses: ${JSON.stringify(err)}`);
      });
    },
    addresses_by_neighborhood(obj, args, context) {
      const pool = context.pool;
      const ids = args.nbrhd_ids;
      if (ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_addresses_by_neighborhood($1)';
      const fargs = [
        ids,
      ];
      return pool.query(query, fargs)
      .then(result => {
        return prepareAddresses(result.rows);
      });
    },

    addresses_by_street(obj, args, context) {
      const pool = context.pool;
      const ids = args.centerline_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');
      const query = 'SELECT * '
      + `FROM amd.v_simplicity_addresses WHERE centerline_id in (${idList}) `;
      return pool.query(query)
      .then((result) => {
        return prepareAddresses(result.rows);
      })
      .catch((err) => {
        throw new Error(`Got an error in addresses_by_street: ${JSON.stringify(err)}`);
      });
    },
  },
};

module.exports = resolvers;
