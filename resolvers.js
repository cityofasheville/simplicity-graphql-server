
const localResolvers = {
  my_simplicity(obj, args, context) {
    if (context.loggedin) {
      return {
        email: context.email,
        groups: context.groups,
        subscriptions: context.subscriptions,
      };
    }
    return {
      email: 'none',
      groups: [],
      subscriptions: JSON.stringify({}),
    };
  },
};
const simplicityResolvers = require('./data/simplicity').resolvers;
const mdaResolvers = require('./data/mda/resolvers');
const searchResolvers = require('./data/search/resolvers');
const queryResolvers = Object.assign(
  {},
  localResolvers,
  searchResolvers,
  mdaResolvers,
  simplicityResolvers
);
const resolveFunctions = {
  Query: queryResolvers,

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
      }
      return info.schema.getType('SillyResult');
    },
  },

};

module.exports = resolveFunctions;
