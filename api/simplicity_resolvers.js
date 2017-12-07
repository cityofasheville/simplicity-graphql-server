const { merge } = require('lodash');

const resolvers = {
  Query: {
  },
  Point: {
    x(obj) {return obj.x;},
    y(obj) {return obj.y;},
  },
  Polygon: {
    points(obj) { return obj.points; },
  },
  Line: {
    points(obj) { return obj.points; },
  },
};
module.exports = merge(resolvers,
  require('./search/resolvers'),
  require('./internal/internal_resolvers'),
  require('./address/address_resolvers'),
  require('./street/street_resolvers'),
  require('./property/property_resolvers'),
  require('./development/development_resolvers'),
  require('./crime/crime_resolvers'),
  require('./budget/budget_resolvers')
);
