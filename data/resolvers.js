const searchCivicAddressId = function (searchString, context) {
  const pool = context.pool;
  const myQuery = `SELECT civicaddress_id, property_pin, jurisdiction_type, address_full, owner_name from coa_bc_address_master where cast(civicaddress_id as TEXT) LIKE '${searchString}%'  limit 5`;
  return pool.query(myQuery)
    .then((result) => {
      if (result.rows.length === 0) return { type: 'civicAddressId', results: []};

      const finalResult = {
        type: 'civicAddressId',
        results: result.rows.map((address) => {
          return {
            score: 33,
            type: 'civicAddressId',
            id: address.civicaddress_id,
            civic_address_id: address.civicaddress_id,
            full_address: address.address_full,
            pin: address.property_pin,
            owner: address.owner_name,
            is_in_city: (address.jurisdiction_type === 'Asheville Corporate Limits'),
          };
        }),
      };
      return finalResult;
    })
    .catch((err) => {
      if (err) {
        console.log(`Got an error in searchCivicAddressID: ${JSON.stringify(err)}`);
      }
    });
};

const performSearch = function (searchString, searchContext, context) {
  if (searchContext === 'civicAddressId') {
    return searchCivicAddressId(searchString, context);
  } else {
    return Promise.resolve({
      type: searchContext,
      results: [
        {
          score: 22,
          type: 'silly',
          id: 1,
          text: `search by ${searchContext}`,
        },
      ] }
    );
  }
};

const permitsHandler = function (result) {
  if (result.rows.length === 0) return [];
  const trips = result.rows.map((permit) => {
    return { ...permit };
  });
  // Now let's bundle up the trips into the permits
  const permits = [];
  if (trips.length > 0) {
    let i = 0;
    let cur = null;
    while (i < trips.length) {
      const t = trips[i];
      if (!cur || t.permit_id !== cur.permit_id) {
        cur = {
          permit_id: t.permit_id,
          type: t.type,
          subtype: t.subtype,
          category: t.category,
          app_date: t.app_date,
          app_status: t.app_status,
          app_status_date: t.app_status_date,
          ntrips: t.ntrips,
          violation: t.violation,
          violation_count: t.violation_count,
          violation_days: t.violation_days,
          sla: t.sla,
          building: t.building,
          fire: t.fire,
          zoning: t.zoning,
          addressing: t.addressing,
          trips: [],
        };
        permits.push(cur);
      }
      if (t.trip) {
        cur.trips.push({
          trip: t.trip,
          start_date: t.start_date,
          end_date: t.end_date,
          due_date: t.due_date,
          trip_violation_days: t.trip_violation_days,
          trip_sla: t.trip_sla,
          division: t.division,
        });
      }
      ++i;
    }
  }
  return permits;
};

const queryPermits = function (pool, obj, args, context) {
  const where = [];
  let whereClause = '';
  if ('type' in args) where.push(`p.type ILIKE '${args.type}'`);
  if ('violated' in args) where.push(`p.violation = ${args.violated}`);
  if (where.length > 0) whereClause = ` where ${where.join(' AND ')}`;
  let query = 'SELECT p.permit_id as permit_id, p.type as type, '
            + 'p.subtype as subtype, p.category as category,'
            + 'to_char(p.app_date,\'YYYY-MM-DD"T"HH24:MI:SS\') as app_date,'
            + 'p.app_status as app_status,'
            + 'to_char(p.app_status_date,\'YYYY-MM-DD"T"HH24:MI:SS\') as app_status_date,'
            + 't.trip as trip,'
            + 'p.trips as ntrips, p.violation as violation,'
            + 'p.violation_count as violation_count,'
            + 'p.violation_days as violation_days, p.sla as sla,'
            + 'p.building as building, p.fire as fire, p.zoning as zoning, '
            + 'p.addressing as addressing, '
            + 't.start_date as start_date, t.end_date as end_date, '
            + 't.violation_days as trip_violation_days,'
            + 't.sla as trip_sla, t.division as division'
            + ' from permits as p left outer join'
            + ' permit_trips as t on p.permit_id = t.permit_id'
            + ` ${whereClause} `
            + ' order by p.permit_id, t.trip, t.start_date, t.end_date';
  if ('limit' in args && args.limit > 0) query += ` limit ${args.limit}`;

  return pool.query(query).then(permitsHandler).catch((err) => {
    if (err) {
      console.log(`Got an error in permits: ${JSON.stringify(err)}`);
    }
  });
};

const resolveFunctions = {
  Query: {
    permits(obj, args, context) {
      const pool = context.pool;
      return queryPermits(pool, obj, args, context);
    },

    search(obj, args, context) {
      const searchString = args.searchString;
      const searchContexts = args.searchContexts;
      return Promise.all(searchContexts.map((searchContext) => {
        return performSearch(searchString, searchContext, context);
      }));
    },

    my_simplicity(obj, args, context) {
      if (context.loggedin) {
        return {
          email: context.email,
          groups: context.groups,
          subscriptions: context.subscriptions,
        };
      }
      return {
        email: 'none',
        groups: [],
        subscriptions: JSON.stringify({})
      };
    },

    mda_address(obj, args, context) {
      const id = args.id;
      const pool = context.pool;
      return pool.query(`SELECT civicaddress_id, property_pin, jurisdiction_type, address_full, owner_name from coa_bc_address_master where civicaddress_id = ${id}  limit 1`)
        .then((result) => {
          if (result.rows.length === 0) return null;
          const address = result.rows[0];
          return {
            civic_address_id: address.civicaddress_id,
            full_address: address.address_full,
            pin: address.property_pin,
            owner: address.owner_name,
            is_in_city: (address.jurisdiction_type === 'Asheville Corporate Limits'),
          };
        })
        .catch((err) => {
          if (err) {
            console.log(`Got an error in address: ${JSON.stringify(err)}`);
          }
        });
    },
  },

  TypedSearchResult: {
    type(obj) {return obj.type;},
    results(obj, args, context) {
      return obj.results;
    },
  },

  Permit: {
    // The other fields are trivial & Apollo knows how to deal with them.
    trips(obj, args, context) {
      return obj.trips.map((t) => {
        return { ...t };
      });
    },
  },

  SearchResult: {
    __resolveType(data, context, info) {
      if (data.type === 'civicAddressId') {
        return info.schema.getType('AddressResult');
      }
      return info.schema.getType('SillyResult');
    },
  },

};

export default resolveFunctions;
