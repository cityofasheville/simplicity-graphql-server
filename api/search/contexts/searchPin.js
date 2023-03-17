function searchPin(searchString, context) {
  const logger = context.logger;
  const myQuery = `
  SELECT pin, pinnum, pinext, 
  regexp_replace(concat_ws(' ', housenumber, numbersuffix, direction, streetname, streettype), '\s+', ' ', 'g') as address, 
  cityname, zipcode 
  FROM internal.bc_property
  where cast(pin as TEXT) = '${searchString}' OR 
  cast(pinnum as TEXT) = '${searchString}' limit 5;
  `;

  return context.pool.query(myQuery)
    .then(result => {
      if (result.rows.length === 0) return { type: 'pin', results: [] };

      const finalResult = {
        type: 'pin',
        results: result.rows.map(row => {
          return {
            score: 0,
            type: 'pin',
            pinnum: row.pinnum,
            pin: row.pin,
            pinnumext: row.pinext,
            address: row.address,
            city: row.city,
            zipcode: row.zipcode,
          };
        }),
      };
      return finalResult;
    })
    .catch((err) => {
      if (err) {
        logger.error(`Got an error in searchPin: ${JSON.stringify(err)}`);
        throw new Error(err);
      }
    });
}

module.exports = searchPin;
