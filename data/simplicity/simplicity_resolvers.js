const { merge } = require('lodash');

const resolvers = {
  Query: {
    firstReviewSLAItems(obj, args, context) {
      const pool = context.pool;
      return pool.query(
        'SELECT * from amd.dsd_first_review_sla'
      )
      .then((result) => {
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
      return pool.query(
        'SELECT * from coagis.v_budget_proposed_plus_history where year >= 2015'
      )
      .then((result) => {
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
    properties(obj, args, context) {
      const pool = context.pool;
      const pins = args.pins;
      if (pins.length <= 0) return [];
      const pinList = pins.map(p => {
        return `'${p}'`;
      }).join(',');
      const query = 'SELECT pin, pinext, pinnum, address, exempt, acreage, owner, cityname, '
      + 'zipcode, totalmarketvalue, appraisedvalue, taxvalue, landvalue, buildingvalue, '
      + 'propcard, deedurl, platurl, appraisalarea, neighborhoodcode, civicaddress_id, '
      + 'lattitude, longitude, zoning, owner_address '
      + 'FROM amd.v_simplicity_properties '
      + `WHERE pinnum in (${pinList})`;
      // console.log(`properties query: ${query}`);
      return pool.query(query)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          const taxExempt = (itm.exempt !== '');
          return {
            civic_address_id: itm.civicaddress_id,
            pinnum: itm.pin,
            pinnumext: itm.pinext,
            address: itm.address,
            city: itm.cityname,
            zipcode: itm.zipcode,
            tax_exempt: taxExempt,
            neighborhood: itm.neighborhoodcode,
            appraisal_area: itm.appraisalarea,
            acreage: itm.acreage,
            zoning: itm.zoning,
            deed_link: itm.deedurl,
            property_card_link: itm.propcard,
            plat_link: itm.platurl,
            latitude: itm.lattitude,
            longitude: itm.longitude,
            building_value: itm.buildingvalue,
            land_value: itm.landvalue,
            appraised_value: itm.appraisedvalue,
            tax_value: itm.taxvalue,
            market_value: itm.totalmarketvalue,
            owner: itm.owner,
            owner_address: itm.owner_address,
          };
        });
      })
      .catch(error => {
        console.log(`Error in properties endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
    // properties_by_street(obj, args, context) {
    //   const pool = context.pool;
    //   const radius = Number(args.radius); // State plane units are feet
    //   const ids = args.centerline_ids;
    //   if (ids.length <= 0) return [];
    //   const idList = ids.map(id => {
    //     return `'${id}'`;
    //   }).join(',');
    // },
    addresses(obj, args, context) {
      const pool = context.pool;
      const ids = args.civicaddress_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');

      const query = 'SELECT civicaddress_id, address_full, address_city, address_zipcode, '
      + 'address_number, address_unit, address_street_prefix, address_street_name, '
      + 'lattitude, longitude, '
      + 'trash_pickup_day, recycling_pickup_district, recycling_pickup_day, '
      + 'zoning, owner_name, owner_address, owner_cityname, owner_state, '
      + 'owner_zipcode, property_pin, property_pinext, centerline_id, jurisdiction_type '
      + `FROM amd.coa_bc_address_master WHERE civicaddress_id in (${idList}) `;
      return pool.query(query)
      .then((result) => {
        if (result.rows.length === 0) return [];
        const p = result.rows;
        return p.map(itm => {
          return {
            civic_address_id: itm.civicaddress_id,
            address: itm.address_full,
            x: itm.lattitude,
            y: itm.longitude,
            street_name: itm.address_street_name,
            street_prefix: itm.address_street_prefix,
            street_number: itm.address_number,
            unit: itm.address_unit,
            city: itm.address_city,
            zipcode: itm.address_zipcode,
            is_in_city: (itm.jurisdiction_type === 'Asheville Corporate Limits'),
            zoning: itm.zoning,
            trash_day: itm.trash_pickup_day,
            recycling_pickup_district: itm.recycling_pickup_district,
            recycling_pickup_day: itm.recycling_pickup_day,          
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
    addresses_by_street(obj, args, context) {
      const pool = context.pool;
      const ids = args.centerline_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');
      const query = 'SELECT civicaddress_id, address_full, address_city, address_zipcode, '
      + 'address_number, address_unit, address_street_prefix, address_street_name, '
      + 'lattitude, longitude, '
      + 'trash_pickup_day, recycling_pickup_district, recycling_pickup_day, '
      + 'zoning, owner_name, owner_address, owner_cityname, owner_state, '
      + 'owner_zipcode, property_pin, property_pinext, centerline_id, jurisdiction_type '
      + `FROM amd.coa_bc_address_master WHERE centerline_id in (${idList}) `;
      return pool.query(query)
      .then((result) => {
        if (result.rows.length === 0) return [];
        const p = result.rows;
        return p.map(itm => {
          return {
            civic_address_id: itm.civicaddress_id,
            address: itm.address_full,
            x: itm.lattitude,
            y: itm.longitude,
            street_name: itm.address_street_name,
            street_prefix: itm.address_street_prefix,
            street_number: itm.address_number,
            unit: itm.address_unit,
            city: itm.address_city,
            zipcode: itm.address_zipcode,
            is_in_city: (itm.jurisdiction_type === 'Asheville Corporate Limits'),
            zoning: itm.zoning,
            trash_day: itm.trash_pickup_day,
            recycling_pickup_district: itm.recycling_pickup_district,
            recycling_pickup_day: itm.recycling_pickup_day,
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
        throw new Error(`Got an error in addresses_by_street: ${JSON.stringify(err)}`);
      });
    },
    crimes_by_address(obj, args, context) {
      const civicaddressId = String(args.civicaddress_id);
      const before = args.before;
      const after = args.after;
      const radius = Number(args.radius); // State plane units are feet
      const pool = context.pool;
      let query = 'SELECT A.incident_id, A.date_occurred, A.case_number, '
      + 'A.address, A.geo_beat, A.x, A.y, A.x_wgs, A.y_wgs, A.offense_short_description, '
      + 'A.offense_long_description, A.offense_code, A.offense_group_code, '
      + 'A.offense_group_level, A.offense_group_short_description '
      + 'from amd.coa_apd_public_incidents_view_wgs as A '
      + 'left outer join amd.coa_bc_address_master as B '
      + 'on ST_Point_Inside_Circle(A.shape, B.address_x, B.address_y, $2) '
      + 'where b.civicaddress_id = $1 '; // Future function name change - ST_PointInsideCircle
      const qargs = [civicaddressId, radius];
      let nextParam = '$3';
      if (before !== undefined) {
        qargs.push(`'${before}'`);
        query += `and date_occurred < ${nextParam} `;
        nextParam = '$4';
      }
      if (after !== undefined) {
        qargs.push(`'${after}'`);
        query += `and date_occurred > ${nextParam} `;
      }

      return pool.query(query, qargs)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          return {
            incident_id: itm.incident_id,
            agency: itm.agency,
            date_occurred: itm.date_occurred,
            case_number: itm.case_number,
            address: itm.address,
            geo_beat: itm.geo_beat,
            geo_report_area: itm.geo_report_area,
            x: itm.x_wgs,
            y: itm.y_wgs,
            offense_short_description: itm.offense_short_description,
            offense_long_description: itm.offense_long_description,
            offense_code: itm.offense_code,
            offense_group_code: itm.offense_group_code,
            offense_group_level: itm.offense_group_level,
            offense_group_short_description: itm.offense_group_short_description,
          };
        });
      })
      .catch((err) => {
        console.log(`Got an error in crimes_by_address: ${JSON.stringify(err)}`);
        throw new Error(`Got an error in crimes_by_address: ${JSON.stringify(err)}`);
      });
    },
    crimes(obj, args, context) {
      const pool = context.pool;
      const ids = args.incident_ids;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');

      const query = 'SELECT incident_id, agency, date_occurred, case_number, '
      + 'address, geo_beat, geo_report_area, x, y, x_wgs, y_wgx, offense_short_description, '
      + 'offense_long_description, offense_code, offense_group_code, '
      + 'offense_group_level, offense_group_short_description, '
      + 'offense_group_long_description '
      + `FROM amd.coa_apd_public_incidents_view_wgs WHERE incident_id in (${idList}) `;
      return pool.query(query)
      .then((result) => {
        if (result.rows.length === 0) return [];
        const p = result.rows;
        return p.map(itm => {
          return {
            incident_id: itm.incident_id,
            agency: itm.agency,
            date_occurred: itm.date_occurred,
            case_number: itm.case_number,
            address: itm.address,
            geo_beat: itm.geo_beat,
            geo_report_area: itm.geo_report_area,
            x: itm.x_wgs,
            y: itm.y_wgs,
            offense_short_description: itm.offense_short_description,
            offense_long_description: itm.offense_long_description,
            offense_code: itm.offense_code,
            offense_group_code: itm.offense_group_code,
            offense_group_level: itm.offense_group_level,
            offense_group_short_description: itm.offense_group_short_description,
            offense_group_long_description: itm.offense_group_long_description,
          };
        });
      })
      .catch((err) => {
        throw new Error(`Got an error in crimes: ${JSON.stringify(err)}`);
      });
    },

    permits(obj, args, context) {
      const pool = context.pool;
      const ids = args.permit_numbers;
      if (ids.length <= 0) return [];
      const idList = ids.map(id => {
        return `'${id}'`;
      }).join(',');
      const query = 'SELECT a.permit_num, a.permit_group, a.permit_type, '
      + 'a.permit_subtype, a.permit_category, a.permit_description, '
      + 'a.applicant_name, a.applied_date, a.status_current, a.status_date, '
      + 'a.civic_address_id, a.address, a.contractor_name, '
      + 'a.contractor_license_number, a.lattitude as x, a.longitude as y, '
      + 'b.comment_seq_number, b.comment_date, b.comments '
      + 'FROM amd.v_mda_permits_xy AS a '
      + 'LEFT JOIN amd.mda_permit_comments AS b on a.permit_num = b.permit_num '
      + `WHERE a.permit_num in (${idList}) `
      + 'ORDER BY a.permit_num DESC, b.comment_seq_number ASC ';
      return pool.query(query)
      .then((result) => {
        if (result.rows.length === 0) return [];
        const p = result.rows;
        const fResults = [];
        let curPermit = null;

        p.forEach(itm => {
          if (curPermit === null || curPermit.permit_number !== itm.permit_num) {
            curPermit = {
              permit_number: itm.permit_num,
              permit_group: itm.permit_group,
              permit_type: itm.permit_type,
              permit_subtype: itm.permit_subtype,
              permit_category: itm.permit_category,
              permit_description: itm.permit_description,
              applicant_name: itm.applicant_name,
              applied_date: itm.applied_date,
              status_current: itm.status_current,
              status_date: itm.status_date,
              civic_address_id: itm.civic_address_id,
              address: itm.address,
              x: itm.x,
              y: itm.y,
              contractor_name: itm.contractor_name,
              contractor_license_number: itm.contractor_license_number,
              comments: [],
            };
            fResults.push(curPermit);
          }
          if (itm.comment_seq_number !== null) {
            curPermit.comments.push({
              comment_seq_number: itm.comment_seq_number,
              comment_date: itm.comment_date,
              comments: itm.comments,
            });
          }
        });
        return fResults;
      })
      .catch((err) => {
        throw new Error(`Got an error in crimes: ${JSON.stringify(err)}`);
      });
    },

    permits_by_address(obj, args, context) {
      const civicaddressId = String(args.civicaddress_id);
      const before = args.before;
      const after = args.after;
      const radius = Number(args.radius); // State plane units are feet
      const pool = context.pool;
      let query = 'SELECT A.permit_num, A.permit_group, A.permit_type, '
      + 'A.permit_subtype, A.permit_category, A.permit_description, '
      + 'A.applicant_name, A.applied_date, A.status_current, A.status_date, '
      + 'A.civic_address_id, A.address, A.contractor_name, '
      + 'A.contractor_license_number, A.lattitude as x, A.longitude as y, '
      + 'C.comment_seq_number, C.comment_date, C.comments '
      + 'from amd.v_mda_permits_xy as A '
      + 'left outer join amd.coa_bc_address_master as B '
      + 'on ST_Point_Inside_Circle(ST_Point(A.address_x, A.address_y), B.address_x, B.address_y, $2) '
      + 'LEFT JOIN amd.mda_permit_comments AS C on A.permit_num = C.permit_num '
      + 'where b.civicaddress_id = $1 '; // Future function name change - ST_PointInsideCircle

      const qargs = [civicaddressId, radius];
      let nextParam = '$3';
      if (before !== undefined) {
        qargs.push(`'${before}'`);
        query += `and applied_date < ${nextParam} `;
        nextParam = '$4';
      }
      if (after !== undefined) {
        qargs.push(`'${after}'`);
        query += `and applied_date > ${nextParam} `;
      }

      return pool.query(query, qargs)
      .then(result => {
        if (result.rows.length === 0) return [];
        const p = result.rows;
        const fResults = [];
        let curPermit = null;
        p.forEach(itm => {
          if (curPermit === null || curPermit.permit_number !== itm.permit_num) {
            curPermit = {
              permit_number: itm.permit_num,
              permit_group: itm.permit_group,
              permit_type: itm.permit_type,
              permit_subtype: itm.permit_subtype,
              permit_category: itm.permit_category,
              permit_description: itm.permit_description,
              applicant_name: itm.applicant_name,
              applied_date: itm.applied_date,
              status_current: itm.status_current,
              status_date: itm.status_date,
              civic_address_id: itm.civic_address_id,
              address: itm.address,
              x: itm.x,
              y: itm.y,
              contractor_name: itm.contractor_name,
              contractor_license_number: itm.contractor_license_number,
              comments: [],
            };
            fResults.push(curPermit);
          }
          if (itm.comment_seq_number !== null) {
            curPermit.comments.push({
              comment_seq_number: itm.comment_seq_number,
              comment_date: itm.comment_date,
              comments: itm.comments,
            });
          }
        });
        return fResults;
      })
      .catch((err) => {
        console.log(`Got an error in permits_by_address: ${JSON.stringify(err)}`);
        throw new Error(`Got an error in permits_by_address: ${JSON.stringify(err)}`);
      });
    },
  },

  Permit: {
    comments(obj, args, context) {
      return obj.comments;
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
      } else if (data.type === 'property') {
        return info.schema.getType('PropertyResult');
      } else if (data.type === 'pin') {
        return info.schema.getType('PropertyResult');
      } else if (data.type === 'street') {
        return info.schema.getType('StreetResult');
      }
      return info.schema.getType('SillyResult');
    },
  },
};
module.exports = merge(resolvers, require('./search/resolvers'));
