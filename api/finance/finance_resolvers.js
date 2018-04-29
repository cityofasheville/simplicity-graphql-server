const { merge } = require('lodash');

const resolvers = {
  Query: {
  },
};

module.exports = merge(resolvers,
  require('./pcard/pcard_resolvers'),
);

