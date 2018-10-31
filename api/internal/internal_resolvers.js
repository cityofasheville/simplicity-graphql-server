const { merge } = require('lodash');

module.exports = merge(
  require('./workorders/workorders_resolvers'),
  require('./employees/employees_resolvers'),
);
