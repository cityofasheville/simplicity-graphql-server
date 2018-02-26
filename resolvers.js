const { merge } = require('lodash');
const { version } = require('./package.json');
const resolverMap = {
  Query: {
    version(obj, args, context) {
      return version;
    },
  },
};

module.exports = merge(
  resolverMap,
  require('./api').resolvers
);
