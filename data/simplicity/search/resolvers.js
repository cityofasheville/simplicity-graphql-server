const axios = require('axios');
function searchCivicAddressId(searchString, context) {
  const pool = context.pool;
  const myQuery = 'SELECT civicaddress_id, pinnum, address from coagis.bc_address'
  + `where cast(civicaddress_id as TEXT) LIKE '${searchString}%'  limit 5`;
  return pool.query(myQuery)
    .then((result) => {
      if (result.rows.length === 0) return { type: 'civicAddressId', results: [] };

      const finalResult = {
        type: 'civicAddressId',
        results: result.rows.map((address) => {
          return {
            score: 33,
            type: 'civicAddressId',
            id: address.civicaddress_id,
            civic_address_id: address.civicaddress_id,
            address: address.address,
            pinnum: address.pinnum,
            is_in_city: (address.jurisdiction_type === 'Asheville Corporate Limits'),
          };
        }),
      };
      return finalResult;
    })
    .catch((err) => {
      if (err) {
        console.log(`Got an error in searchCivicAddressID: ${JSON.stringify(err)}`);
      }
    });
}

function searchAddress(searchString, searchContext, context) {
  const geolocatorUrl = 'http://arcgis.ashevillenc.gov/arcgis/rest/services/Geolocators/BC_address_unit/GeocodeServer/findAddressCandidates'
  // const geolocatorUrl = 'http://192.168.0.125:6080/arcgis/rest/services/Geolocators/BC_address_unit/GeocodeServer/findAddressCandidates'
  + '?Street=&City=&ZIP='
  + `&Single+Line+Input=${encodeURIComponent(searchString)}&category=`
  + '&outFields=House%2C+PreDir%2C+StreetName%2C+SufType%2C+SubAddrUnit%2C+City%2C+ZIP'
  + '&maxLocations=&outSR=&searchExtent='
  + '&location=&distance=&magicKey=&f=pjson';
  return axios.get(geolocatorUrl, { timeout: 5000 })
  // return axios.get({
  //   method: 'get',
  //   url: geolocatorUrl,
  //   timeout: 1000,
  // })
  .then(response => {
    console.log(`Got a total of ${response.data.candidates.length} responses`);
    console.log(JSON.stringify(response.data.candidates));
    return Promise.all(response.data.candidates.map(a => {
      const pool = context.pool;
      const myQuery = 'SELECT civicaddress_id, address_full, address_city, address_zipcode, '
      + 'address_number, address_unit, address_street_prefix, address_street_name '
      + 'FROM amd.coa_bc_address_master WHERE '
      + `address_number = '${a.attributes.House}' `
      + `AND address_unit = '${a.attributes.SubAddrUnit}' `
      + `AND address_street_prefix = '${a.attributes.PreDir}' `
      + `AND address_street_name = '${a.attributes.StreetName}' `
      + `AND address_street_type = '${a.attributes.SufType}' `
      + `AND address_commcode = '${a.attributes.City}' AND `
      + `address_zipcode = '${a.attributes.ZIP}'`;
      console.log(myQuery);
      return pool.query(myQuery)
      .then(result => {
        console.log(`Back with query with ${result.rows.length} rows`);
        return {
          items: result.rows.map(row => {
            return {
              score: a.score,
              type: 'address',
              civic_address_id: row.civicaddress_id,
              address: row.address_full,
              street_name: row.address_street_name,
              street_prefix: row.address_street_prefix,
              street_number: row.address_number,
              unit: row.address_unit,
              city: row.address_city,
              zipcode: row.address_zipcode,
            };
          }),
        };
      });
    }))
    .then(candidates => {
      const result = {
        type: 'searchContext',
        results: candidates.reduce((prev, curr) => {
          return prev.concat(curr.items);
        }, []),
      };
      return Promise.resolve(result);
    });
  })
  .catch(error => {
    throw new Error(error);
  });
}

function performSearch(searchString, searchContext, context) {
  if (searchContext === 'civicAddressId') {
    return searchCivicAddressId(searchString, context);
  } else if (searchContext === 'address') {
    return searchAddress(searchString, searchContext, context);
  }
  throw new Error(`Unknown search context ${searchContext}`);
}

const resolvers = {
  Query: {
    search(obj, args, context) {
      const searchString = args.searchString;
      const searchContexts = args.searchContexts;
      return Promise.all(searchContexts.map((searchContext) => {
        return performSearch(searchString, searchContext, context);
      }));
    },
  },
};

module.exports = resolvers;
