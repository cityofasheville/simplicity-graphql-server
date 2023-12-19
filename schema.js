const baseSchema = `
  # the schema allows the following query:
  type Query {
    version: String
  }
`;

import { schema as apiSchema } from './api/index.js';

export default baseSchema.concat(apiSchema);
