const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const baseSchema = `
  # the schema allows the following query:
  type Query {
    version: String
  }
`;

const schema = baseSchema.concat(
  require('./data/simplicity').schema,
  require('./data/mda').schema
);

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
