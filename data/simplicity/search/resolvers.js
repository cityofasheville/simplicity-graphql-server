const axios = require('axios');
const searchCivicAddressId = function (searchString, context) {
  const pool = context.pool;
  const myQuery = `SELECT civicaddress_id, pinnum, address from coagis.bc_address where cast(civicaddress_id as TEXT) LIKE '${searchString}%'  limit 5`;
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
};

const performSearch = function (searchString, searchContext, context) {
  if (searchContext === 'civicAddressId') {
    return searchCivicAddressId(searchString, context);
  } else if (searchContext === 'address') {
    const geolocatorUrl = 'http://192.168.0.125:6080/arcgis/rest/services/Geolocators/BC_address_unit/GeocodeServer/findAddressCandidates'
      + '?Street=&City=&ZIP='
      + `&Single+Line+Input=${encodeURIComponent(searchString)}&category=`
      + '&outFields=shape%2C+match_addr&maxLocations=&outSR=&searchExtent='
      + '&location=&distance=&magicKey=&f=pjson';
    console.log(`Geoloc: ${geolocatorUrl}`);
    return axios.get(geolocatorUrl)
    .then(response => {
      console.log(JSON.stringify(response.data));
      const candidates = response.data.candidates.map(a => {
        return {
          score: a.score,
          type: 'address',
          civic_address_id: 'i824i',
          address: a.address,
          is_in_city: true,
        };
      });
      return Promise.resolve({
        type: searchContext,
        results: candidates,
      });
    })
    .catch(error => {
      console.log(error);
    });
  }
  return Promise.resolve({
    type: searchContext,
    results: [
      {
        score: 22,
        type: 'silly',
        id: 1,
        text: `search by ${searchContext}`,
      },
    ] }
  );
};
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
