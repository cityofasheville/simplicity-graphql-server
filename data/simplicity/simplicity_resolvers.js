const { merge } = require('lodash');

const resolvers = {
  Query: {
    firstReviewSLAItems(obj, args, context) {
      const pool = context.pool;
      return pool.query(
        'SELECT * from amd.dsd_first_review_sla'
      )
      .then((result) => {
        console.log(`Back with result of length ${result.rows.length}`);
        if (result.rows.length === 0) return null;
        const p = result.rows;
        return p;
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in firstReviewSLAItems: ${JSON.stringify(err)}`);
        }
      });
    },
    firstReviewSLASummary(obj, args, context) {
      const pool = context.pool;
      let tasks = null;
      let q = 'select * from amd.dsd_first_review_sla_summary';
      if (args.tasks) {
        args.tasks.forEach(t => {
          tasks = (tasks === null) ? `'${t}'` : `${tasks}, '${t}'`;
        });
        q += ` where task in (${tasks})`;
      }
      return pool.query(q)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(item => {
          const total = Number(item.met_sla) + Number(item.past_sla);
          const pct = 100.0 * Number(item.met_sla) / total;
          return {
            task: item.task,
            met_sla: item.met_sla,
            past_sla: item.past_sla,
            met_sla_percent: pct.toPrecision(5),
            month: item.month,
            year: item.year,
          };
        });
      })
      .catch(err => {
        if (err) {
          console.log(`Error in firstReviewSLASummary: ${JSON.stringify(err)}`);
        }
        return [];
      });
    },
    budgetSummary(obj, args, context) {
      const pool = context.pool;
      const which = args.breakdown;
      let categoryColumn = 'department_name';
      let view = 'coagis.v_budget_summary_by_dept';
      if (which === 'use') {
        categoryColumn = 'category_name';
        view = 'coagis.v_budget_summary_by_use';
      }
      let maxCategories = 10;
      if ('maxCategories' in args) maxCategories = args.maxCategories + 0;
      const query = `
        SELECT account_type, category_name, year, SUM(total_budget) as total_budget,
          SUM(total_actual) AS total_actual
        FROM (
          select 
            account_type, year, total_budget, total_actual, row,
            case 
              when row > ${maxCategories} or ${categoryColumn} = 'Non-Departmental Department'
              then 'Other'
              else ${categoryColumn}
            end AS category_name
          from ${view}
          where year >= 2015
        ) as ii
        GROUP BY account_type, category_name, year
        ORDER BY year desc, account_type, total_budget desc
      `;
      return pool.query(query)
      .then((result) => {
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
    budgetHistory(obj, args, context) {
      const pool = context.pool;
      console.log('Ok, we are getting the budget history');
      return pool.query(
        'SELECT * from coagis.v_budget_proposed_plus_history where year >= 2015'
      )
      .then((result) => {
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
    budgetCashFlow(obj, args, context) {
      const pool = context.pool;
      let query = `
        SELECT account_type, department_name, dept_id, fund_id, fund_name,
          SUM(budget) as budget, NULL as category_name, NULL as category_id, year
        FROM coagis.v_budget_proposed_plus_history
        WHERE account_type = 'E' and year = 2018 and budget <> 0
        GROUP BY account_type, year, fund_id, fund_name, dept_id,
        department_name, category_id, category_name
      `;
      if (args.accountType === 'R') {
        query = `
        SELECT account_type, category_name, category_id, year, SUM(budget) as budget,
          fund_name, fund_id, NULL as dept_id, NULL as department_name
        FROM coagis.v_budget_proposed_plus_history
        WHERE account_Type = 'R' and year = 2018 and budget <> 0
        GROUP BY category_id, category_name, account_type, year, fund_id,
        fund_name, dept_id, department_name
      `;
      }
      return pool.query(query)
      .then((result) => {
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
    addresses(obj, args, context) {
      const pool = context.pool;
      const ids = args.civicaddress_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');
      console.log(`The idlist is ${idList}`)
      const query = 'SELECT civicaddress_id, address_full, address_city, address_zipcode, '
      + 'address_number, address_unit, address_street_prefix, address_street_name, '
      + 'trash_pickup_day, zoning, owner_name, owner_address, owner_cityname, owner_state, '
      + 'owner_zipcode, property_pin, property_pinext, centerline_id, jurisdiction_type '
      + `FROM amd.coa_bc_address_master WHERE civicaddress_id in (${idList}) `;
      return pool.query(query)
      .then((result) => {
        console.log(`Back with result of length ${result.rows.length}`);
        if (result.rows.length === 0) return [];
        const p = result.rows;
        return p.map(itm => {
          return {
            civic_address_id: itm.civicaddress_id,
            address: itm.address_full,
            street_name: itm.address_street_name,
            street_prefix: itm.address_street_prefix,
            street_number: itm.address_number,
            unit: itm.address_unit,
            city: itm.address_city,
            zipcode: itm.address_zipcode,
            is_in_city: (itm.jurisdiction_type === 'Asheville Corporate Limits'),
            zoning: itm.zoning,
            trash_day: itm.trash_pickup_day,
            centerline_id: itm.centerline_id,
            pinnum: itm.property_pin,
            pinnumext: itm.property_pinext,
            owner_name: itm.owner_name,
            owner_address: itm.owner_address,
            owner_cityname: itm.owner_cityname,
            owner_state: itm.owner_state,
            owner_zipcode: itm.owner_zipcode,
          };
        });
      })
      .catch((err) => {
        throw new Error(`Got an error in addresses: ${JSON.stringify(err)}`);
      });
    },
  },

  TypedSearchResult: {
    type(obj) {return obj.type;},
    results(obj, args, context) {
      return obj.results;
    },
  },

  SearchResult: {
    __resolveType(data, context, info) {
      if (data.type === 'civicAddressId') {
        return info.schema.getType('AddressResult');
      } else if (data.type === 'address') {
        return info.schema.getType('AddressResult');
      }
      return info.schema.getType('SillyResult');
    },
  },
};
module.exports = merge(resolvers, require('./search/resolvers'));
