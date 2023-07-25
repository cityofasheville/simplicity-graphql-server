const mergeDeep = require('./mergeDeep');
const { version } = require('./package.json');
const resolverMap = {
  Query: {
    version(obj, args, context) {
      return version;
    },
  },
};

module.exports = mergeDeep(
  resolverMap,
  require('./api').resolvers
);
