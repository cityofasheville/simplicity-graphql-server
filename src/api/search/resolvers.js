import geocoder from './geocoder.js';
const { callGeocoder } = geocoder;
import searchCivicAddressId from './contexts/searchCivicAddressId.js';
import searchPin from './contexts/searchPin.js';
import searchNeighborhood from './contexts/searchNeighborhood.js';
import searchOwner from './contexts/searchOwner.js';
import searchProperty from './contexts/searchProperty.js';
import searchStreet from './contexts/searchStreet.js';
import searchAddress from './contexts/searchAddress.js';
import searchPlace from './contexts/searchPlace.js';
import searchPermit from './contexts/searchPermit.js';

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
  } else if (searchContext === 'permit') {
    return searchPermit(searchString, context);
  }
  throw new Error(`Unknown search context ${searchContext}`);
}

const resolvers = {
  Query: {
    async search(obj, args, context) {
      
      const geoCodeResponse = [Promise.resolve(null), Promise.resolve(null)];
      const startTime = new Date().getTime();
      const searchString = args.searchString.trim();
      console.info(`Search for '${searchString} in contexts ${args.searchContexts}`);
      if (args.searchContexts.indexOf('address') >= 0 ||
          args.searchContexts.indexOf('property') >= 0 ||
          args.searchContexts.indexOf('street') >= 0) {
        geoCodeResponse[0] = callGeocoder(searchString);
      }
      try {
        const results = await Promise.all(geoCodeResponse);
        return await Promise.all(args.searchContexts.map((searchContext) => {
          const ret = performSearch(searchString, searchContext, results, context);
          const totalTime = (new Date().getTime() - startTime) / 1000;
          if (totalTime > 4) {
            console.warn(`Search time (${searchContext}): ${totalTime} seconds`);
          }
          return ret;
        }));
      } catch (err) {
        if (err) {
          console.error(`Got an error in search: ${err}`);
          throw new Error(err);
        }
      }
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
        return ('AddressResult');
      } else if (data.type === 'address') {
        return ('AddressResult');
      } else if (data.type === 'property') {
        return ('PropertyResult');
      } else if (data.type === 'pin') {
        return ('PropertyResult');
      } else if (data.type === 'street') {
        return ('StreetResult');
      } else if (data.type === 'neighborhood') {
        return ('NeighborhoodResult');
      } else if (data.type === 'owner') {
        return ('OwnerResult');
      } else if (data.type === 'place') {
        return ('PlaceResult');
      } else if (data.type === 'permit') {
        return ('PermitResult');
      }
      return ('SillyResult');
    },
  },
};

export default resolvers;
