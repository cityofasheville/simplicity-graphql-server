const axios = require('axios');
function searchCivicAddressId(searchString, context) {
  const pool = context.pool;
  const myQuery = 'SELECT civicaddress_id, property_pinnum, address_full '
  + 'FROM amd.coa_bc_address_master '
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

function searchProperty(searchString, geoCodeResponse, context) {
  if (geoCodeResponse.locName.length === 0) {
    return Promise.resolve(
      {
        type: 'searchContext',
        results: [],
      }
    );
  }

  const fquery = 'SELECT DISTINCT property_pinnum '
  + 'from amd.get_search_addresses($1, $2, $3, $4, $5, $6, $7)';

  console.log(`Query: ${fquery}`);
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
    console.log('ret1');
    if (result.rows.length === 0) {
      return Promise.resolve([]);
    }
    const pinList = result.rows.map(row => {
      return `'${row.property_pinnum}'`;
    }).join(',');

    const pQuery = 'SELECT pin, pinext, address, cityname, zipcode FROM amd.bc_property '
    + `WHERE pinnum IN (${pinList})`;
    return context.pool.query(pQuery)
    .then(props => {
      console.log('ret2');      
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
  })
  .catch((err) => {
    if (err) {
      console.log(`Got an error in property search: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

function searchAddress(searchContext, searchString, geoCodeResponse, context) {
  if (geoCodeResponse.locName.length === 0) {
    return Promise.resolve(
      {
        type: 'searchContext',
        results: [],
      }
    );
  }
  const fquery = 'SELECT A.civicaddress_id, A.address_full, A.address_city, A.address_zipcode, '
  + 'A.address_number, A.address_unit, A.address_street_prefix, A.address_street_name, '
  + 'A.centerline_id, B.full_street_name, B.lzip, B.rzip '
  + 'from amd.get_search_addresses($1, $2, $3, $4, $5, $6, $7) AS A '
  + 'LEFT OUTER JOIN amd.bc_street AS B on A.centerline_id = B.centerline_id ';
  const args = [
    geoCodeResponse.locNumber,
    geoCodeResponse.locName,
    geoCodeResponse.locType,
    geoCodeResponse.locPrefix,
    geoCodeResponse.locUnit,
    geoCodeResponse.locZipcode,
    geoCodeResponse.locCity,
  ];

  const idMap = {};
  return context.pool.query(fquery, args)
  .then(result => {
    if (searchContext === 'street') {
      const r = [];
      result.rows.forEach(row => {
        let idx = `${row.full_street_name}.${row.lzip}`;
        if (!idMap.hasOwnProperty(idx)) {
          idMap[idx] = {
            score: 0,
            type: 'street',
            full_street_name: row.full_street_name,
            zip_code: row.lzip,
            centerline_ids: {},
          };
          idMap[idx].centerline_ids[row.centerline_id] = row.centerline_id;
        } else {
          idMap[idx].centerline_ids[row.centerline_id] = row.centerline_id;
        }
        if (row.lzip !== row.rzip) {
          idx = `${row.full_street_name}.${row.rzip}`;
          if (!idMap.hasOwnProperty(idx)) {
            idMap[idx] = {
              score: 0,
              type: 'street',
              full_street_name: row.full_street_name,
              zip_code: row.rzip,
              centerline_ids: {},
            };
            idMap[idx].centerline_ids[row.centerline_id] = row.centerline_id;
          } else {
            idMap[idx].centerline_ids[row.centerline_id] = row.centerline_id;
          }
        }
      });
      for (const k in idMap) {
        if (idMap.hasOwnProperty(k)) {
          idMap[k].centerline_ids = Object.keys(idMap[k].centerline_ids);
          r.push(idMap[k]);
        }
      }
      return r;
    }
    // Search context is 'address'
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
  })
  .catch((err) => {
    if (err) {
      console.log(`Got an error in address search: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

// Context options: address, pin, neighborhood, property,
//                  civicAddressId, street, owner, and google
function performSearch(searchString, searchContext, geoCodeResponse, context) {
  if (searchContext === 'civicAddressId') {
    return searchCivicAddressId(searchString, context);
  } else if (searchContext === 'pin') {
    return searchPin(searchString, context);
  } else if (searchContext === 'address') {
    return searchAddress(searchContext, searchString, geoCodeResponse, context);
  } else if (searchContext === 'property') {
    return searchProperty(searchString, geoCodeResponse, context);
  } else if (searchContext === 'street') {
    return searchAddress(searchContext, searchString, geoCodeResponse, context);
  }
  throw new Error(`Unknown search context ${searchContext}`);
}

function requestGeo(searchString) {
  const maxCandidates = 500;
  const minCandidateScore = 50;
  const geoLocator = 'BC_address_unit'; // BC_address_unit or BC_street_address
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
    const result = {
      locNumber: [],
      locName: [],
      locType: [],
      locPrefix: [],
      locUnit: [],
      locZipcode: [],
      locCity: [],
    };
    if (candidates.length === 0) {
      return Promise.resolve(result);
    }
    candidates.forEach((c, i) => {
      if (i < maxCandidates) {
        result.locNumber.push(c.attributes.House);
        result.locName.push(c.attributes.StreetName);
        result.locType.push(c.attributes.SufType);
        result.locPrefix.push(c.attributes.PreDir);
        result.locUnit.push(c.attributes.SubAddrUnit);
        result.locZipcode.push(c.attributes.ZIP);
        if (c.attributes.City === null || c.attributes.City === '') {
          // result.locCity.push('ASHE');
          result.locCity.push(c.attributes.City);
        } else {
          result.locCity.push(c.attributes.City);
        }
      }
    });
    return Promise.resolve(result);
  })
  .catch((err) => {
    if (err) {
      console.log(`Got an error in geocoder lookup: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

const resolvers = {
  Query: {
    search(obj, args, context) {
      const searchString = args.searchString;
      const searchContexts = args.searchContexts;
      let geoCodeResponse = Promise.resolve(null);
      if (searchContexts.indexOf('address') >= 0 ||
       searchContexts.indexOf('property') >= 0 ||
       searchContexts.indexOf('street') >= 0) {
        geoCodeResponse = requestGeo(searchString);
      }
      return geoCodeResponse.then(result => {
        return Promise.all(searchContexts.map((searchContext) => {
          console.log(`Perform search for context ${searchContext}`);
          const ret = performSearch(searchString, searchContext, result, context);
          return ret;
        }));
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in search: ${err}`);
          throw new Error(err);
        }
      });
    },
  },
};

module.exports = resolvers;
