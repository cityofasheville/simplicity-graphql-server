const axios = require('axios');
function searchCivicAddressId(searchString, context) {
  const pool = context.pool;
  const myQuery = 'SELECT civicaddress_id, pinnum, address from coagis.bc_address '
  + `where cast(civicaddress_id as TEXT) LIKE '${searchString}%'  limit 5`;
  console.log(`Query: ${myQuery}`);
  return pool.query(myQuery)
    .then((result) => {
      console.log(`Got the rows: ${JSON.stringify(result)}`);
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
  const maxCandidates = 500;
  const minCandidateScore = 50;
  const geolocatorUrl = 'http://arcgis.ashevillenc.gov/arcgis/rest/services/Geolocators/BC_address_unit/GeocodeServer/findAddressCandidates'
  + '?Street=&City=&ZIP='
  + `&Single+Line+Input=${encodeURIComponent(searchString)}&category=`
  + '&outFields=House%2C+PreDir%2C+StreetName%2C+SufType%2C+SubAddrUnit%2C+City%2C+ZIP'
  + '&maxLocations=&outSR=&searchExtent='
  + '&location=&distance=&magicKey=&f=pjson';

  return axios.get(geolocatorUrl, { timeout: 5000 })
  .then(response => {
    const candidates = response.data.candidates.filter(c => {
      return (c.score >= minCandidateScore);
    });
    if (candidates.length === 0) {
      return Promise.resolve(
        {
          type: 'searchContext',
          results: [],
        }
      );
    }

    const locNumber = [];
    const locName = [];
    const locType = [];
    const locPrefix = [];
    const locUnit = [];
    const locZipcode = [];
    const locCity = [];
    candidates.forEach((c, i) => {
      if (i < maxCandidates) {
        locNumber.push(c.attributes.House);
        locName.push(c.attributes.StreetName);
        locType.push(c.attributes.SufType);
        locPrefix.push(c.attributes.PreDir);
        locUnit.push(c.attributes.SubAddrUnit);
        locZipcode.push(c.attributes.ZIP);
        locCity.push(c.attributes.City);
      }
    });

    const fquery = 'SELECT civicaddress_id, address_full, address_city, address_zipcode, '
    + 'address_number, address_unit, address_street_prefix, address_street_name '
    + 'from amd.get_search_addresses($1, $2, $3, $4, $5, $6, $7)';
    const args = [locNumber, locName, locType, locPrefix, locUnit, locZipcode, locCity];

    const idMap = {};
    return context.pool.query(fquery, args)
    .then(result => {
      return result.rows.map(row => {
        return {
          score: 0,
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
      })
      .filter(row => {
        if (idMap.hasOwnProperty(row.civic_address_id)) return false;
        idMap[row.civic_address_id] = true;
        return true;
      })
      ;
    })
    .then(clist => {
      const result = {
        type: 'searchContext',
        results: clist,
      };
      return Promise.resolve(result);
    });
  })
  .catch(error => {
    console.log(`Got an error: ${JSON.stringify(error)}`);
    throw new Error(error);
  });
}

function performSearch(searchString, searchContext, context) {
  if (searchContext === 'civicAddressId') {
    console.log(`Searching for civic address id ${searchString}`);
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
