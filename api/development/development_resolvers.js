const resolvers = {
  Query: {
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
      + 'a.contractor_license_number, a.longitude as x, a.lattitude as y, '
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
      + 'A.contractor_license_number, A.longitude as x, A.lattitude as y, '
      + 'C.comment_seq_number, C.comment_date, C.comments '
      + 'from amd.v_mda_permits_xy as A '
      + 'left outer join amd.coa_bc_address_master as B '
      + 'on ST_Point_Inside_Circle(ST_SetSRID(ST_Point(A.address_x, A.address_y),2264), B.address_x, B.address_y, $2) '
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
    permits_by_street(obj, args, context) {
      const pool = context.pool;
      const radius = (args.radius) ? Number(args.radius) : 100; // State plane units are feet
      const ids = args.centerline_ids;
      if (ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_permits_along_streets($1, $2)';
      const fargs = [
        ids,
        radius,
      ];
      return pool.query(query, fargs)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          return {
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
        });
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in permits_by_street: ${JSON.stringify(err)}`);
          throw new Error(err);
        }
      });
    },
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
  },

  Permit: {
    comments(obj, args, context) {
      return obj.comments;
    },
  },
};

module.exports = resolvers;
