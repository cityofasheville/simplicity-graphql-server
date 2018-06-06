const { merge } = require('lodash');

const resolvers = {
  Query: {
  },
  Point: {
    x(obj) {return obj.x;},
    y(obj) {return obj.y;},
  },
  SimplePolygon: {
    points(obj) {
      return obj.points;
    },
  },
  Polygon: {
    outer(obj) { return obj.outer; },
    holes(obj) { return obj.holes; },
  },

};
module.exports = merge(resolvers,
  require('./search/resolvers'),
  require('./internal/internal_resolvers'),
  require('./municipalities/municipalities_resolvers'),
  require('./address/address_resolvers'),
  require('./street/street_resolvers'),
  require('./neighborhood/neighborhood_resolvers'),
  require('./property/property_resolvers'),
  require('./development/development_resolvers'),
  require('./crime/crime_resolvers'),
  require('./budget/budget_resolvers'),
  require('./cip/cip_resolvers'),
  require('./finance/finance_resolvers'),
);
