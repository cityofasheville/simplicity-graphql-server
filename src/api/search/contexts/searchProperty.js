import geocoder from '../geocoder.js';
const { convertGeocoderResults } = geocoder;

function searchProperty(searchString, geoCodeResponseIn, context) {
  
  const geoCodeResponse = convertGeocoderResults(geoCodeResponseIn[0], null);
  if (geoCodeResponse.locName.length === 0) {
    return Promise.resolve(
      {
        type: 'searchContext',
        results: [],
      }
    );
  }

  // console.log(`searchProperty: ${JSON.stringify(geoCodeResponse)}`);

  const fquery = `
    SELECT DISTINCT property_pinnum
    from simplicity.get_search_addresses($1, $2, $3, $4, $5, $6, $7)
    `;

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
    const pinList = result.rows.map(row => row.property_pinnum);

    // console.log("pinlist", pinList);
    const pQuery = `
    SELECT pin, pinext, pinnum, address, cityname,
    zipcode, civicaddress_id
    FROM simplicity.v_simplicity_properties
    WHERE pinnum = ANY($1)
    `;
    return context.pool.query(pQuery, [pinList])
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
      console.error(`Got an error in property search: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

export default searchProperty;
