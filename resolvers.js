import merge_deep from './api/common/merge_deep.js';
import * as fs from 'fs';
const packagejson = JSON.parse(fs.readFileSync('./package.json'));
const version = packagejson.version;
import { resolvers } from './api/index.js';
const resolverMap = {
  Query: {
    version(obj, args, context) {
      return version;
    },
  },
};

export default merge_deep(
  resolverMap,
  resolvers
);
