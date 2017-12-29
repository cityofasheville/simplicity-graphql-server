const axios = require('axios');

const searchCivicAddressId = require('./contexts/searchCivicAddressId');
const searchPin = require('./contexts/searchPin');
const searchNeighborhood = require('./contexts/searchNeighborhood');
const searchOwner = require('./contexts/searchOwner');
const searchProperty = require('./contexts/searchProperty');
const searchStreet = require('./contexts/searchStreet');
const searchAddress = require('./contexts/searchAddress');
const searchPlace = require('./contexts/searchPlace');

// Context options: address, pin, neighborhood, property, civicAddressId, street, owner, google
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
    return searchStreet(searchContext, searchString, geoCodeResponse, context);
  } else if (searchContext === 'neighborhood') {
    return searchNeighborhood(searchString, context);
  } else if (searchContext === 'owner') {
    return searchOwner(searchString, context);
  } else if (searchContext === 'place') {
    return searchPlace(searchString, context);
  }
  throw new Error(`Unknown search context ${searchContext}`);
}

function callGeocoder(searchString, searchContext = 'address') {
  const minCandidateScore = 50;
  let geoLocator = 'BC_address_unit'; // BC_address_unit or BC_street_address
  if (searchContext === 'street') geoLocator = 'bc_street_intersection';
  const baseLocator = `http://arcgis.ashevillenc.gov/arcgis/rest/services/Geolocators/${geoLocator}/GeocodeServer/findAddressCandidates`;
  const geolocatorUrl = `${baseLocator}?Street=&City=&ZIP=`
  + `&Single+Line+Input=${encodeURIComponent(searchString)}&category=`
  + '&outFields=House%2C+PreDir%2C+StreetName%2C+SufType%2C+SubAddrUnit%2C+City%2C+ZIP'
  + '&maxLocations=&outSR=&searchExtent='
  + '&location=&distance=&magicKey=&f=pjson';

  return axios.get(geolocatorUrl, { timeout: 5000 })
  .then(response => {
    return Promise.resolve(response.data.candidates.filter(c => {
      return (c.score >= minCandidateScore);
    }));
  })
  .catch((err) => {
    if (err) {
      console.log(`Got an error in geocoder lookup: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

function mergeGeocoderResults(candidateSet) {
  const maxCandidates = 500;
  const result = {
    locNumber: [],
    locName: [],
    locType: [],
    locPrefix: [],
    locUnit: [],
    locZipcode: [],
    locCity: [],
  };
  if (candidateSet.length > 0 && candidateSet[0] !== null) {
    let total = 0;
    candidateSet.forEach((candidates, i) => {
      candidates.forEach((c) => {
        ++total;
        if (total < maxCandidates) {
          result.locNumber.push(c.attributes.House);
          result.locName.push(c.attributes.StreetName);
          result.locType.push(c.attributes.SufType);
          result.locPrefix.push(c.attributes.PreDir);
          result.locUnit.push(c.attributes.SubAddrUnit);
          result.locZipcode.push(c.attributes.ZIP);
          if (c.attributes.City === null || c.attributes.City === '') {
            result.locCity.push(c.attributes.City);
          } else {
            result.locCity.push(c.attributes.City);
          }
        }
      });
    });
  }
  return result;
}

const resolvers = {
  Query: {
    search(obj, args, context) {
      const searchString = args.searchString;
      const searchContexts = args.searchContexts;
      const geoCodeResponse = [];

      if (searchContexts.indexOf('address') >= 0 ||
       searchContexts.indexOf('property') >= 0 ||
       searchContexts.indexOf('street') >= 0) {
        // geoCodeResponse.push(requestGeo(searchString, 'address'));
        geoCodeResponse.push(callGeocoder(searchString, 'address'));
      }
      if (searchContexts.indexOf('street') >= 0) {
        // geoCodeResponse.push(requestGeo(searchString, 'street'));
        geoCodeResponse.push(callGeocoder(searchString, 'street'));
      }
      if (geoCodeResponse.length === 0) geoCodeResponse.push(Promise.resolve(null));

      return Promise.all(geoCodeResponse).then(results => {
        const result = mergeGeocoderResults(results);
        // console.log(JSON.stringify(result));
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

  NeighborhoodResult: {
    polygon(obj) {
      return obj.polygon;
    },
  },

  TypedSearchResult: {
    type(obj) {return obj.type;},
    results(obj, args, context) {
      return obj.results;
    },
  },

  SearchResult: {
    __resolveType(data, context, info) {
      if (data.type === 'civicAddressId') {
        return info.schema.getType('AddressResult');
      } else if (data.type === 'address') {
        return info.schema.getType('AddressResult');
      } else if (data.type === 'property') {
        return info.schema.getType('PropertyResult');
      } else if (data.type === 'pin') {
        return info.schema.getType('PropertyResult');
      } else if (data.type === 'street') {
        return info.schema.getType('StreetResult');
      } else if (data.type === 'neighborhood') {
        return info.schema.getType('NeighborhoodResult');
      } else if (data.type === 'owner') {
        return info.schema.getType('OwnerResult');
      } else if (data.type === 'place') {
        return info.schema.getType('PlaceResult');
      }
      return info.schema.getType('SillyResult');
    },
  },
};

module.exports = resolvers;
