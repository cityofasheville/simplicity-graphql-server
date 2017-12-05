const baseSchema = `
  # the schema allows the following query:
  type Query {
    version: String
  }
`;

const apiSchema = require('./api').schema;

module.exports = baseSchema.concat(apiSchema);
