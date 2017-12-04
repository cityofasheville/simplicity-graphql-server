const { merge } = require('lodash');

const resolvers = {
  Query: {
  },

};
module.exports = merge(resolvers,
  require('./search/resolvers'),
  require('./internal/internal_resolvers'),
  require('./address/address_resolvers'),
  require('./property/property_resolvers'),
  require('./development/development_resolvers'),
  require('./crime/crime_resolvers'),
  require('./budget/budget_resolvers')
);
