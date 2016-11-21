import { find, filter } from 'lodash';
import { pubsub } from './subscriptions';

const addresses = [
  {
    civic_address_id: 230126,
    full_address: '60 N. Market St. #503, Asheville, NC 28801',
    pin: '9649415481C0503',
    owner: 'JACKSON PHILIP ERIC;LAMOTTE KATHY',
    in_city: true
  },
  {
    civic_address_id: 238441,
    full_address: '28 Walnut Dr, Asheville, NC 28748',
    pin: '87801023450000',
    owner: 'WALDROP NADINE R',
    in_city: false
  },
];

var searchCivicAddressId = function (searchString, context) {
  const pool = context.pool;
  let result = null;
  const myQuery = `SELECT civicaddress_id, property_pin, jurisdiction_type, address_full, owner_name from coa_bc_address_master where cast(civicaddress_id as TEXT) LIKE '${searchString}%'  limit 5`;
  return pool.query(myQuery)
    .then( (result) => {
      if (result.rows.length == 0) return {
        type: 'civicAddressId',
        results: [],
      };

      let finalResult = {
        type: 'civicAddressId',
        results: result.rows.map( (address) => {
          return {
            score: 33,
            type: 'civicAddressId',
            id: address.civicaddress_id,
            civic_address_id: address.civicaddress_id,
            full_address: address.address_full,
            pin: address.property_pin,
            owner: address.owner_name,
            is_in_city: (address.jurisdiction_type == 'Asheville Corporate Limits'),
          }
        }),
      };
      return finalResult;
    })
    .catch((err) => {
      if (err) {
        console.log("Got an error in searchCivicAddressID: " + JSON.stringify(err));
      }
    });
}

var performSearch = function (searchString, searchContext, context) {
  if (searchContext === 'civicAddressId') {
    return searchCivicAddressId(searchString, context);
  }
  else {
    return Promise.resolve({
      type: searchContext,
      results: [
        {
          score: 22,
          type: 'silly',
          id: 1,
          text: "search by " + searchContext,
        }
      ]}
    );
  }
}

const resolveFunctions = {
  Query: {
    search (obj, args, context) {
      let searchString = args.searchString;
      let searchContexts = args.searchContexts;
      console.log("In search: " + JSON.stringify(args));
      console.log("The search string is: " + searchString);
      console.log("The search contexts is " + JSON.stringify(searchContexts));
      return Promise.all(searchContexts.map( (searchContext) => {
        return performSearch(searchString, searchContext, context);
      }));
    },

    my_simplicity (obj, args, context) {
      console.log("I am in my_simplicity");
      if (context.loggedin) {
        return {
          email: context.email,
          groups: context.groups,
          subscriptions: context.subscriptions
        };
      }
      else {
        return {
          email: 'none',
          groups: [],
          subscriptions: JSON.stringify({})
        };
      }
    },

    permits (obj, args, context) {
      /*
       * Sample query:
       query {
          permits (type: "Residential", violated: true, limit: 500) {
             permit_id
             type
             subtype
             sla
             violation
          }
        }
      */
      console.log("I am resolving permits with args " + JSON.stringify(args));
      const pool = context.pool;
      let result = null;
      let where = [], whereClause = '';
      if ('type' in args) {
        where.push(`type = '${args.type}'`);
      }
      if ('violated' in args) {
        where.push(`violation = ${args.violated}`);
      }
      if (where.length > 0) {
        whereClause = ' where ' + where.join(' AND ');
      }
      let query = 'SELECT permit_id, type, subtype, category,';
      query += `to_char(app_date,'YYYY-MM-DD"T"HH24:MI:SS') as app_date,`;
      query += 'app_status,';
      query += `to_char(app_status_date,'YYYY-MM-DD"T"HH24:MI:SS') as app_status_date,`;
      query += 'trips, violation, violation_count,';
      query += 'violation_days, sla, building, fire, zoning, addressing';
      query += ` from permits ${whereClause}`;

      if ('limit' in args) {
        if (args.limit > 0) {
          query += ` limit ${args.limit}`;
        }
      }
      console.log("Permits query: " + query);
      return pool.query(query)
        .then( (result) => {
          if (result.rows.length == 0) return null;
          let permits = result.rows.map ( (permit, index) => {
            return {...permit};
          });
          return permits;
        })
        .catch((err) => {
          if (err) {
            console.log("Got an error in permits: " + JSON.stringify(err));
          }
        });
    },

    address (obj, args, context) {
      const id = args.id;
      const pool = context.pool;
      console.log("I am in address");
      let result = null;
      return pool.query(`SELECT civicaddress_id, property_pin, jurisdiction_type, address_full, owner_name from coa_bc_address_master where civicaddress_id = ${id}  limit 1`)
        .then( (result) => {
          if (result.rows.length == 0) return null;
          const address = result.rows[0];
          return {
            civic_address_id: address.civicaddress_id,
            full_address: address.address_full,
            pin: address.property_pin,
            owner: address.owner_name,
            is_in_city: (address.jurisdiction_type == 'Asheville Corporate Limits')
          };
        })
        .catch((err) => {
          if (err) {
            console.log("Got an error in address: " + JSON.stringify(err));
          }
        });
    }
  },

  TypedSearchResult: {
    type(obj) {return obj.type},
    results (obj, args, context) {
      return obj.results;
    }
  },

  SearchResult: {
    __resolveType(data, context, info) {
      if (data.type == 'civicAddressId') {
        return info.schema.getType('AddressResult');
      }
      else {
        return info.schema.getType('SillyResult');
      }
    }
  },

};

export default resolveFunctions;
