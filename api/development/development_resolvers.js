function preparePermits(rows, before = null, after = null) {
  if (rows.length === 0) return [];
  let curPermit = null;
  let curContractors = {};
  let curComments = {};
  const fResults = [];
  console.log('Count 1: ' + rows.length);
  // We get a row per unique contractor per unique comment id, so we have
  // to filter down to just the unique information.
  rows.forEach(itm => {
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
        contractor_names: [],
        contractor_license_numbers: [],
        comments: [],
      };
      curContractors = {};
      curComments = {};
      fResults.push(curPermit);
    }
    if (itm.contractor_name !== null &&
        !curContractors.hasOwnProperty(itm.contractor_license_number)) {
      curContractors[itm.contractor_name] = true;
      curPermit.contractor_names.push(itm.contractor_name);
      curPermit.contractor_license_numbers.push(itm.contractor_license_number);
    }
    if (itm.comment_seq_number !== null &&
        !curComments.hasOwnProperty(itm.comment_seq_number)) {
      curPermit.comments.push({
        comment_seq_number: itm.comment_seq_number,
        comment_date: itm.comment_date,
        comments: itm.comments,
      });
      curComments[itm.comment_seq_number] = true;
    }
  });
  console.log('Count 1: ' + fResults.length);
  return fResults.filter((item) => {
    let keep = true;
    if (after || before) {
      const date1 = new Date(item.applied_date);
      if (after && date1 < new Date(`${after} 00:00:00 GMT-0500`)) {
        keep = false;
      }
      if (keep && before && date1 > new Date(`${before} 00:00:00 GMT-0500`)) {
        keep = false;
      }
    }
    return keep;
  });
}
const stdQuery = 'SELECT A.permit_num, A.permit_group, A.permit_type, '
              + 'A.permit_subtype, A.permit_category, A.permit_description, '
              + 'A.applicant_name, A.applied_date, A.status_current, A.status_date, '
              + 'A.civic_address_id, A.address, A.contractor_name, '
              + 'A.contractor_license_number, A.longitude as x, A.lattitude as y, '
              + 'B.comment_seq_number, B.comment_date, B.comments ';
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
      if (args.permit_numbers.length <= 0) return [];
      const query = `${stdQuery}`
      + 'FROM amd.v_mda_permits_xy AS A '
      + 'LEFT JOIN amd.mda_permit_comments AS B on A.permit_num = B.permit_num '
      + 'WHERE A.permit_num = ANY ($1) '
      + 'ORDER BY A.permit_num DESC, B.comment_seq_number ASC ';
      return context.pool.query(query, [args.permit_numbers])
      .then((result) => {
        return preparePermits(result.rows);
      })
      .catch((err) => {
        throw new Error(`Got an error in crimes: ${JSON.stringify(err)}`);
      });
    },
    permits_by_address(obj, args, context) {
      const radius = args.radius ? Number(args.radius) : 10; // State plane units are feet
      let query = `${stdQuery}`
      + 'from amd.v_mda_permits_xy as A '
      + 'left outer join amd.coa_bc_address_master as M '
      + 'on ST_Point_Inside_Circle(ST_SetSRID(ST_Point(M.address_x, M.address_y),2264), M.address_x, M.address_y, $2) '
      + 'LEFT JOIN amd.mda_permit_comments AS B on A.permit_num = B.permit_num '
      + 'where M.civicaddress_id = $1 '; // Future function name change - ST_PointInsideCircle
      const qargs = [String(args.civicaddress_id), radius];
      let nextParam = '$3';
      if (args.before !== undefined) {
        qargs.push(`'${args.before}'`);
        query += `and applied_date < ${nextParam} `;
        nextParam = '$4';
      }
      if (args.after !== undefined) {
        qargs.push(`'${args.after}'`);
        query += `and applied_date > ${nextParam} `;
      }
      query += 'ORDER BY A.permit_num DESC, B.comment_seq_number ASC ';
      return context.pool.query(query, qargs)
      .then(result => {
        return preparePermits(result.rows, args.before, args.after);
      })
      .catch((err) => {
        console.log(`Got an error in permits_by_address: ${JSON.stringify(err)}`);
        throw new Error(`Got an error in permits_by_address: ${JSON.stringify(err)}`);
      });
    },
    permits_by_street(obj, args, context) {
      const radius = (args.radius) ? Number(args.radius) : 100; // State plane units are feet
      if (args.centerline_ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_permits_along_streets($1, $2) '
      + 'ORDER BY permit_num DESC, comment_seq_number ASC ';
      return context.pool.query(query, [args.centerline_ids, radius])
      .then(result => {
        return preparePermits(result.rows, args.before, args.after);
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in permits_by_street: ${JSON.stringify(err)}`);
          throw new Error(err);
        }
      });
    },
    permits_by_neighborhood(obj, args, context) {
      if (args.nbrhd_ids.length <= 0) return [];
      const query = 'SELECT * FROM amd.get_permits_by_neighborhood($1) '
      + 'ORDER BY permit_num DESC, comment_seq_number ASC ';
      return context.pool.query(query, [args.nbrhd_ids])
      .then(result => {
        return preparePermits(result.rows, args.before, args.after);
      })
      .catch((err) => {
        if (err) {
          console.log(`Got an error in permits_by_neighborhood: ${JSON.stringify(err)}`);
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
