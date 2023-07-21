const { callGeocoder } = require('./geocoder');
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

const resolvers = {
  Query: {
    search(obj, args, context) {
      const logger = context.logger;
      const geoCodeResponse = [Promise.resolve(null), Promise.resolve(null)];
      const startTime = new Date().getTime();
      const searchString = args.searchString.trim();
      logger.info(`Search for '${searchString} in contexts ${args.searchContexts}`);
      if (args.searchContexts.indexOf('address') >= 0 ||
          args.searchContexts.indexOf('property') >= 0 ||
          args.searchContexts.indexOf('street') >= 0) {
        geoCodeResponse[0] = callGeocoder(searchString, logger);
      }
      return Promise.all(geoCodeResponse).then(results => {
        const result = results;
        return Promise.all(args.searchContexts.map((searchContext) => {
          const ret = performSearch(searchString, searchContext, result, context);
          const totalTime = (new Date().getTime() - startTime) / 1000.0;
          if (totalTime > 4.0) {
            logger.warn(`Search time (${searchContext}): ${totalTime} seconds`);
          }
          return ret; 
        }));
      })
      .catch((err) => {
        if (err) {
          logger.error(`Got an error in search: ${err}`);
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
