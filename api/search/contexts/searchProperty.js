
function searchProperty(searchString, geoCodeResponse, context) {
  const logger = context.logger;
  if (geoCodeResponse.locName.length === 0) {
    return Promise.resolve(
      {
        type: 'searchContext',
        results: [],
      }
    );
  }

  const fquery = 'SELECT DISTINCT property_pinnum '
  + 'from simplicity.get_search_addresses($1, $2, $3, $4, $5, $6, $7)';

  const args = [
    geoCodeResponse.locNumber,
    geoCodeResponse.locName,
    geoCodeResponse.locType,
    geoCodeResponse.locPrefix,
    geoCodeResponse.locUnit,
    geoCodeResponse.locZipcode,
    geoCodeResponse.locCity,
  ];

  return context.pool.query(fquery, args)
  .then(result => {
    if (result.rows.length === 0) {
      return Promise.resolve([]);
    }
    const pinList = result.rows.map(row => {
      return `'${row.property_pinnum}'`;
    }).join(',');

    const pQuery = 'SELECT pin, pinext, pinnum, address, cityname, '
    + 'zipcode, civicaddress_id '
    + 'FROM simplicity.v_simplicity_properties '
        + `WHERE pinnum IN (${pinList})`;
    return context.pool.query(pQuery)
    .then(props => {
      return props.rows.map(row => {
        return {
          score: 0,
          type: 'property',
          pinnum: row.pinnum,
          pin: row.pin,
          pinext: row.pinext,
          address: row.address,
          city: row.cityname,
          zipcode: row.zipcode,
          civic_address_id: row.civicaddress_id,
        };
      });
    });
  })
  .then(clist => {
    const result = {
      type: 'searchContext',
      results: clist,
    };
    return Promise.resolve(result);
  })
  .catch((err) => {
    if (err) {
      logger.error(`Got an error in property search: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

module.exports = searchProperty;
