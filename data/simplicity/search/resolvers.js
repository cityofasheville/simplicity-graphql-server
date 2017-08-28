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
      + '&outFields=House%2C+PreDir%2C+StreetName%2C+SufType%2C+SubAddrUnit%2C+City%2C+ZIP'
      + '&maxLocations=&outSR=&searchExtent='
      + '&location=&distance=&magicKey=&f=pjson';
    // console.log(`Geoloc: ${geolocatorUrl}`);
    return axios.get(geolocatorUrl)
    .then(response => {
      // console.log(JSON.stringify(response.data.candidates));
      return Promise.all(response.data.candidates.map(a => {
        const pool = context.pool;
        const myQuery = 'SELECT civicaddress_id, address_full, address_city, address_zipcode, '
        + 'trash_pickup_day, zoning, owner_name, owner_address, owner_cityname, owner_state, '
        + 'owner_zipcode, property_pin, property_pinext, centerline_id, jurisdiction_type '
        + 'FROM amd.coa_bc_address_master WHERE '
        + `address_number = '${a.attributes.House}' `
        + `AND address_unit = '${a.attributes.SubAddrUnit}' `
        + `AND address_street_prefix = '${a.attributes.PreDir}' `
        + `AND address_street_name = '${a.attributes.StreetName}' `
        + `AND address_street_type = '${a.attributes.SufType}' `
        + `AND address_commcode = '${a.attributes.City}' AND `
        + `address_zipcode = '${a.attributes.ZIP}'`;
        // console.log(`My query: ${myQuery}`);
        return pool.query(myQuery)
        .then(result => {
          // console.log(`RESULT ROWS (${result.rows.length}): ${JSON.stringify(result.rows)}`);
          return {
            items: result.rows.map(row => {
              return {
                score: a.score,
                type: 'address',
                civic_address_id: row.civicaddress_id,
                address: row.address_full,
//                address: row.jurisdiction_type,
                is_in_city: row.jurisdiction_type === 'Asheville Corporate Limits',
              };
            }),
          };
        });
      }))
      .then(candidates => {
        // console.log(`Got the candidates:  ${JSON.stringify(candidates)}`);
        return Promise.resolve({
          type: searchContext,
          results: candidates.reduce((prev, curr) => {
            // console.log(`Prev: ${JSON.stringify(prev)}, Curr: ${JSON.stringify(curr)}`);
            return prev.concat(curr.items);
          }, []),
        });
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
