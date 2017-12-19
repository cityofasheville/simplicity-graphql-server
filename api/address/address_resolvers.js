
const resolvers = {
  Query: {
    addresses(obj, args, context) {
      const pool = context.pool;
      const ids = args.civicaddress_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');

      const query = 'SELECT civicaddress_id, address_full, address_city, address_zipcode, '
      + 'address_number, address_unit, address_street_prefix, address_street_name, '
      + 'lattitude, longitude, '
      + 'trash_pickup_day, recycling_pickup_district, recycling_pickup_day, '
      + 'zoning, owner_name, owner_address, owner_cityname, owner_state, '
      + 'owner_zipcode, property_pin, property_pinext, centerline_id, jurisdiction_type '
      + `FROM amd.coa_bc_address_master WHERE civicaddress_id in (${idList}) `;
      return pool.query(query)
      .then((result) => {
        if (result.rows.length === 0) return [];
        const p = result.rows;
        return p.map(itm => {
          return {
            civic_address_id: itm.civicaddress_id,
            address: itm.address_full,
            x: itm.longitude,
            y: itm.lattitude,
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
      })
      .catch((err) => {
        throw new Error(`Got an error in addresses: ${JSON.stringify(err)}`);
      });
    },
    addresses_by_street(obj, args, context) {
      const pool = context.pool;
      const ids = args.centerline_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');
      const query = 'SELECT civicaddress_id, address_full, address_city, address_zipcode, '
      + 'address_number, address_unit, address_street_prefix, address_street_name, '
      + 'lattitude, longitude, '
      + 'trash_pickup_day, recycling_pickup_district, recycling_pickup_day, '
      + 'zoning, owner_name, owner_address, owner_cityname, owner_state, '
      + 'owner_zipcode, property_pinnum, property_pin, property_pinext, centerline_id, jurisdiction_type '
      + `FROM amd.coa_bc_address_master WHERE centerline_id in (${idList}) `;
      return pool.query(query)
      .then((result) => {
        if (result.rows.length === 0) return [];
        const p = result.rows;
        return p.map(itm => {
          return {
            civic_address_id: itm.civicaddress_id,
            address: itm.address_full,
            x: itm.longitude,
            y: itm.lattitude,
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
            pinnum: itm.property_pinnum,
            pin: itm.property_pin,
            pinext: itm.property_pinext,
            owner_name: itm.owner_name,
            owner_address: itm.owner_address,
            owner_cityname: itm.owner_cityname,
            owner_state: itm.owner_state,
            owner_zipcode: itm.owner_zipcode,
          };
        });
      })
      .catch((err) => {
        throw new Error(`Got an error in addresses_by_street: ${JSON.stringify(err)}`);
      });
    },
  },
};

module.exports = resolvers;
