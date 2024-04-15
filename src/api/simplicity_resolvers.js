import merge_deep from './common/merge_deep.js';
import searchresolvers from "./search/resolvers.js";
import internal_resolvers from "./internal/internal_resolvers.js";
import municipalities_resolvers from "./municipalities/municipalities_resolvers.js";
import address_resolvers from "./address/address_resolvers.js";
import street_resolvers from "./street/street_resolvers.js";
import neighborhood_resolvers from "./neighborhood/neighborhood_resolvers.js";
import property_resolvers from "./property/property_resolvers.js";
import development_resolvers from "./development/development_resolvers.js";
import crime_resolvers from "./crime/crime_resolvers.js";
import budget_resolvers from "./budget/budget_resolvers.js";
import cip_resolvers from "./cip/cip_resolvers.js";
import finance_resolvers from "./finance/finance_resolvers.js";
import stats_resolvers from "./stats/stats_resolvers.js";
import blockgroups_resolvers from "./blockgroups/blockgroups_resolvers.js";

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
export default merge_deep(resolvers,
searchresolvers,
internal_resolvers,
municipalities_resolvers,
address_resolvers,
street_resolvers,
neighborhood_resolvers,
property_resolvers,
development_resolvers,
crime_resolvers,
budget_resolvers,
cip_resolvers,
finance_resolvers,
stats_resolvers,
blockgroups_resolvers,
);

