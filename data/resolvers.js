const searchCivicAddressId = function (searchString, context) {
  const pool = context.pool;
  const myQuery = `SELECT civicaddress_id, pinnum, address from coagis.bc_address where cast(civicaddress_id as TEXT) LIKE '${searchString}%'  limit 5`;
  return pool.query(myQuery)
    .then((result) => {
      if (result.rows.length === 0) return { type: 'civicAddressId', results: [] };

      const finalResult = {
        type: 'civicAddressId',
        results: result.rows.map((address) => {
          return {
            score: 33,
            type: 'civicAddressId',
            id: address.civicaddress_id,
            civic_address_id: address.civicaddress_id,
            address: address.address,
            pinnum: address.pinnum,
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
  }
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
};

const permitsHandler = function (result) {
  if (result.rows.length === 0) return [];
  const trips = result.rows.map((permit) => {
    return Object.assign({}, permit);
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

    gl_budget_summary (obj, args, context) {
      const pool = context.pool;
      const which = args.breakdown;
      let categoryColumn = 'department_name';
      let view = 'coagis.v_budget_summary_by_dept';
      if (which == 'use') {
        categoryColumn = 'account_name';
        view = 'coagis.v_budget_summary_by_use';
      }
      let maxCategories = 9;
      if ('maxCategories' in args) maxCategories = args.maxCategories + 0;
      let query = `
        SELECT account_type, ${categoryColumn}, year, SUM(total_budget) as total_budget, SUM(total_actual) AS total_actual
        FROM (
          select 
            account_type, year, total_budget, total_actual, row,
            case 
              when row > ${maxCategories} then 'Other'
              else ${categoryColumn}
            end AS category_name
          from ${view}
          where year >= 2014
        ) as ii
        GROUP BY account_type, category_name, year
        ORDER BY year desc, account_type, total_budget desc
      `;
      return pool.query(query)
      .then((result) => {
        console.log('Hi there - I am back from the query');
        console.log(`Back with result of length ${result.rows.length}`);
        if (result.rows.length === 0) return null;
        const p = result.rows;
        return p;
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in property: ${JSON.stringify(err)}`);
        }
      });
    },
    gl_budget_history_plus_proposed(obj, args, context) {
      const pool = context.pool;
      console.log('Ok, we are getting the budget history');
      return pool.query(
        'SELECT * from coagis.v_budget_history_plus_proposed where year >= 2014'
      )
      .then((result) => {
        console.log('Hi there - I am back from the query');
        console.log(`Back with result of length ${result.rows.length}`);
        if (result.rows.length === 0) return null;
        const p = result.rows;
        return p;
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in property: ${JSON.stringify(err)}`);
        }
      });
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
        subscriptions: JSON.stringify({}),
      };
    },

    mda_address(obj, args, context) {
      const id = args.id;
      console.log(`In mda_address with id = ${id}`);
      const pool = context.pool;
      return pool.query(
        `SELECT
          objectid,
          x,
          y,
          address,
          number,
          apt,
          prefix,
          street_name,
          street_type,
          postdirection,
          civicaddress_id,
          location_type,
          change_date,
          city,
          zipcode,
          maximo_type,
          maximo_seq_num,
          asset_code,
          mrc,
          pinnum,
          truckday,
          accelaid,
          centerline_id,
          location_id,
          parent_location_id
         from coagis.bc_address where civicaddress_id = '${id}'  limit 1`)
        .then((result) => {
          if (result.rows.length === 0) return null;
          const a = result.rows[0];
          return {
            objectid: a.objectid,
            x: a.x,
            y: a.y,
            address: a.address,
            number: a.number,
            apt: a.apt,
            prefix: a.prefix,
            street_name: a.street_name,
            street_type: a.street_type,
            postdirection: a.postdirection,
            civicaddress_id: a.civicaddress_id,
            location_type: a.location_type,
            change_date: a.change_date,
            city: a.city,
            zipcode: a.zipcode,
            maximo_type: a.maximo_type,
            maximo_seq_num: a.maximo_seq_num,
            asset_code: a.asset_code,
            mrc: a.mrc,
            pinnum: a.pinnum,
            truckday: a.truckday,
            accelaid: a.accelaid,
            centerline_id: a.centerline_id,
            location_id: a.location_id,
            parent_location_id: a.parent_location_id,


            is_in_city: (a.jurisdiction_type === 'Asheville Corporate Limits'),
          };
        })
        .catch((err) => {
          if (err) {
            console.log(`Got an error in address: ${JSON.stringify(err)}`);
          }
        });
    },
    mda_permits(obj, args, context) {
      const id = args.id;
      const pool = context.pool;
      return pool.query(
        `SELECT
          objectid,
          record_id,
          record_name,
          date_opened,
          record_module,
          record_status,
          record_status_date,
          record_type,
          address,
          balance_due,
          date_assigned,
          date_closed,
          date_completed,
          date_statused,
          description,
          job_value,
          record_type_group,
          record_type_category,
          record_type_type,
          record_type_subtype,
          short_notes,
          status,
          apn,
          parcel_number,
          license_number,
          business_name,
          record_comments
          from coagis.coa_accela_opendata_view where record_id = '${id}'  limit 1`
        )
        .then((result) => {
          if (result.rows.length === 0) return null;
          const p = result.rows[0];
          return {
            objectid: p.objectid,
            record_id: p.record_id,
            record_name: p.record_name,
            date_opened: p.date_opened,
            record_module: p.record_module,
            record_status: p.record_status,
            record_status_date: p.record_status_date,
            record_type: p.record_type,
            address: p.address,
            balance_due: p.balance_due,
            date_assigned: p.date_assigned,
            date_closed: p.date_closed,
            date_completed: p.date_completed,
            date_statused: p.date_statused,
            description: p.description,
            job_value: p.job_value,
            record_type_group: p.record_type_group,
            record_type_category: p.record_type_category,
            record_type_type: p.record_type_type,
            record_type_subtype: p.record_type_subtype,
            short_notes: p.short_notes,
            status: p.status,
            apn: p.apn,
            parcel_number: p.parcel_number,
            license_number: p.license_number,
            business_name: p.business_name,
            record_comments: p.record_comments,
          };
        })
        .catch((err) => {
          if (err) {
            console.log(`Got an error in address: ${JSON.stringify(err)}`);
          }
        });
    },

    mda_property(obj, args, context) {
      const id = args.id;
      const pool = context.pool;
      console.log(`Ok, we are trying to get property with ID = ${id}`);
      return pool.query(
        `SELECT
          objectid,
          pinnum,
          pin,
          pinext,
          owner,
          nmptype,
          taxyear,
          condounit,
          condobuilding,
          deedbook,
          deedpage,
          platbook,
          platpage,
          subname,
          sublot,
          subblock,
          subsect,
          updatedate,
          housenumber,
          numbersuffix,
          direction,
          streetname,
          streettype,
          township,
          acreage,
          accountnumber,
          deeddate,
          stamps,
          instrument,
          reason,
          county,
          city,
          firedistrict,
          schooldistrict,
          careof,
          address,
          cityname,
          state,
          zipcode,
          class,
          improved,
          exempt,
          priced,
          totalmarketvalue,
          appraisedvalue,
          taxvalue,
          landuse,
          neighborhoodcode,
          landvalue,
          buildingvalue,
          improvementvalue,
          appraisalarea,
          state_route,
          state_route_suffix,
          propcard,
          oldpinnum,
          citystatezip,
          deedurl,
          platurl
         from coagis.bc_property where pin = '${id}' limit 1`
        )
        .then((result) => {
          console.log('Howdy');
          console.log(`Back with result of length ${result.rows.length}`);
          if (result.rows.length === 0) return null;
          const p = result.rows[0];
          return {
            objectid: p.objectid,
            pinnum: p.pinnum,
            pin: p.pin,
            pinext: p.pinext,
            owner: p.owner,
            nmptype: p.nmptype,
            taxyear: p.taxyear,
            condounit: p.condounit,
            condobuilding: p.condobuilding,
            deedbook: p.deedbook,
            deedpage: p.deedpage,
            platbook: p.platbook,
            platpage: p.platpage,
            subname: p.subname,
            sublot: p.sublot,
            subblock: p.subblock,
            subsect: p.subsect,
            updatedate: p.updatedate,
            housenumber: p.housenumber,
            numbersuffix: p.numbersuffix,
            direction: p.direction,
            streetname: p.streetname,
            streettype: p.streettype,
            township: p.township,
            acreage: p.acreage,
            accountnumber: p.accountnumber,
            deeddate: p.deeddate,
            stamps: p.stamps,
            instrument: p.instrument,
            reason: p.reason,
            county: p.county,
            city: p.city,
            firedistrict: p.firedistrict,
            schooldistrict: p.schooldistrict,
            careof: p.careof,
            address: p.address,
            cityname: p.cityname,
            state: p.state,
            zipcode: p.zipcode,
            class: p.class,
            improved: p.improved,
            exempt: p.exempt,
            priced: p.priced,
            totalmarketvalue: p.totalmarketvalue,
            appraisedvalue: p.appraisedvalue,
            taxvalue: p.taxvalue,
            landuse: p.landuse,
            neighborhoodcode: p.neighborhoodcode,
            landvalue: p.landvalue,
            buildingvalue: p.buildingvalue,
            improvementvalue: p.improvementvalue,
            appraisalarea: p.appraisalarea,
            state_route: p.state_route,
            state_route_suffix: p.state_route_suffix,
            propcard: p.propcard,
            oldpinnum: p.oldpinnum,
            citystatezip: p.citystatezip,
            deedurl: p.deedurl,
            platurl: p.platurl,
          };
        })
        .catch((err) => {
          if (err) {
            console.log(`Got an error in property: ${JSON.stringify(err)}`);
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
        return Object.assign({}, t);
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

module.exports = resolveFunctions;
