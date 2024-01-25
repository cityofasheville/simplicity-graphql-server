function searchCivicAddressId(searchString, context) {
  const pool = context.pool;
  
  const myQuery = 'SELECT civicaddress_id, property_pinnum, address_full '
  + 'FROM internal.coa_bc_address_master '
  + `WHERE cast(civicaddress_id as TEXT) = '${searchString}'  limit 5`;
  return pool.query(myQuery)
  .then((result) => {
    if (result.rows.length === 0) return { type: 'civicAddressId', results: [] };

    const finalResult = {
      type: 'civicAddressId',
      results: result.rows.map((address) => {
        return {
          score: 0,
          type: 'civicAddressId',
          id: address.civicaddress_id,
          civic_address_id: address.civicaddress_id,
          address: address.address_full,
          pinnum: address.property_pinnum,
          is_in_city: (address.jurisdiction_type === 'Asheville Corporate Limits'),
        };
      }),
    };
    return finalResult;
  })
  .catch((err) => {
    if (err) {
      console.error(`Got an error in searchCivicAddressID: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

export default searchCivicAddressId;
