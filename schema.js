const { makeExecutableSchema } = require('graphql-tools');

const resolvers = require('./resolvers');
const mdaTypes = require('./data/mda/mda_types');
const mdaEndpoints = require('./data/mda/mda_endpoints');
const simplicitySchema = require('./data/simplicity').schema;
const searchSchema = require('./data/search').schema;

const schema = [
  `${mdaTypes}`,
  `
  # the schema allows the following query:
  type Query {
    search ( searchString: String!, searchContexts: [String] ): [TypedSearchResult]!
    ${mdaEndpoints}
  }
  `,
  searchSchema,
  simplicitySchema,
];

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
