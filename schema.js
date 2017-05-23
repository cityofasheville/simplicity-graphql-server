const baseSchema = `
  # the schema allows the following query:
  type Query {
    version: String
  }
`;

module.exports = baseSchema.concat(
  require('./data/simplicity').schema,
  require('./data/mda').schema
);
