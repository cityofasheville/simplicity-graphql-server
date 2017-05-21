const { merge } = require('lodash');

const resolverMap = {
  Query: {},
};

module.exports = merge(
  resolverMap,
  require('./data/simplicity').resolvers,
  require('./data/mda').resolvers
);
