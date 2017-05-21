const { makeExecutableSchema } = require('graphql-tools');

const mdaTypes = require('./data/mda/mda_types');
const mdaEndpoints = require('./data/mda/mda_endpoints');

const simplicitySchema = require('./data/simplicity').schema;
const resolvers = require('./resolvers');

const schema = [
  mdaTypes,
  `
  # the schema allows the following query:
  type Query {
    search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
    ${mdaEndpoints}
  }
  `,
].concat(simplicitySchema, []); // just add more schemas here in place of []

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
