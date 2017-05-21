const { merge } = require('lodash');

const resolverMap = {
  Query: {
    version(obj, args, context) {
      return '1.0';
    },
  },
};

module.exports = merge(
  resolverMap,
  require('./data/simplicity').resolvers,
  require('./data/mda').resolvers
);
