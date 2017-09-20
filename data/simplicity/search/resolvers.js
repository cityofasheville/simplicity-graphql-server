const axios = require('axios');
function searchCivicAddressId(searchString, context) {
  const pool = context.pool;
  const myQuery = 'SELECT civicaddress_id, property_pinnum, address_full '
  + 'FROM amd.coa_bc_address_master '
  + `WHERE cast(civicaddress_id as TEXT) = '${searchString}'  limit 5`;
  console.log(`Query: ${myQuery}`);
  return pool.query(myQuery)
  .then((result) => {
    console.log(`Got the rows: ${JSON.stringify(result)}`);
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
      console.log(`Got an error in searchCivicAddressID: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

function searchPin(searchString, context) {
  const myQuery = 'SELECT pin, pinext, address, cityname, zipcode FROM amd.bc_property '
  + `where cast(pin as TEXT) = '${searchString}' OR `
  + `cast(pinnum as TEXT) = '${searchString}' limit 5`;

  return context.pool.query(myQuery)
  .then(result => {
    if (result.rows.length === 0) return { type: 'pin', results: [] };

    const finalResult = {
      type: 'pin',
      results: result.rows.map(row => {
        return {
          score: 0,
          type: 'pin',
          pinnum: row.pin,
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
      console.log(`Got an error in searchPin: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

function searchProperty(searchString, searchContext, context) {
  const maxCandidates = 500;
  const minCandidateScore = 50;
  const geoLocator = 'BC_address_point'; // BC_address_unit or BC_street_address
  const baseLocator = `http://arcgis.ashevillenc.gov/arcgis/rest/services/Geolocators/${geoLocator}/GeocodeServer/findAddressCandidates`;
  const geolocatorUrl = `${baseLocator}?Street=&City=&ZIP=`
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

    const fquery = 'SELECT DISTINCT property_pinnum '
    + 'from amd.get_search_addresses($1, $2, $3, $4, $5, $6, $7)';
    const args = [locNumber, locName, locType, locPrefix, locUnit, locZipcode, locCity];

    return context.pool.query(fquery, args)
    .then(result => {
      const pinList = result.rows.map(row => {
        return `'${row.property_pinnum}'`;
      }).join(',');

      const pQuery = 'SELECT pin, pinext, address, cityname, zipcode FROM amd.bc_property '
      + `WHERE pinnum IN (${pinList})`;
      return context.pool.query(pQuery)
      .then(props => {
        return props.rows.map(row => {
          return {
            score: 0,
            type: 'property',
            pinnum: row.pin,
            pinnumext: row.pinext,
            address: row.address,
            city: row.city,
            zipcode: row.zipcode,
          };
        });
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

function searchAddress(searchString, searchContext, context) {
  const maxCandidates = 500;
  const minCandidateScore = 50;
  const geoLocator = 'BC_address_point'; // BC_address_unit or BC_street_address
  const baseLocator = `http://arcgis.ashevillenc.gov/arcgis/rest/services/Geolocators/${geoLocator}/GeocodeServer/findAddressCandidates`;
  const geolocatorUrl = `${baseLocator}?Street=&City=&ZIP=`
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

// Context options: address, pin, neighborhood, property, civicAddressId, street, owner, and google

function performSearch(searchString, searchContext, context) {
  if (searchContext === 'civicAddressId') {
    return searchCivicAddressId(searchString, context);
  } else if (searchContext === 'pin') {
    return searchPin(searchString, context);
  } else if (searchContext === 'address') {
    return searchAddress(searchString, searchContext, context);
  } else if (searchContext === 'property') {
    return searchProperty(searchString, searchContext, context);
  } else if (searchContext === 'street') {
    return null;
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
