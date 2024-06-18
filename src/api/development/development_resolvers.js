import addressresolver from '../address/address_resolvers.js';
import addressschema from '../address/address_schema.js';

function preparePermitTasks(rows) {
  if (rows.length === 0) return [];
  return rows.map(itm => {
    return {
      permit_number: itm.permit_num,
      permit_group: itm.permit_group,
      permit_type: itm.permit_type,
      permit_subtype: itm.permit_subtype,
      permit_category: itm.permit_category,
      permit_description: itm.permit_description,
      process_code: itm.process_code,
      task: itm.task,
      task_status: itm.task_status,
      current_status_date: itm.current_status_date,
      step_number: itm.step_number,
      relation_sequence_id: itm.relation_sequence_id,
      parent_task_name: itm.parent_task_name,
      user_name: itm.user_name,
      user_id: itm.user_id,
      user_department: itm.user_department,
      due_date: itm.due_date,
      record_date: itm.record_date,
      comments: itm.comments,
      is_completed: itm.is_completed === 'Y',
      is_active: itm.is_active === 'Y',
      assigned_date: itm.assigned_date,
      assigned_user: itm.assigned_user,
      assigned_department: itm.assigned_department,
      process_history_sequence_number: itm.process_history_sequence_number,
    };
  });
}

function prepareInspections(rows) {
  if (rows.length === 0) return [];
  return rows.map(itm => {
    return {
      inspection_id: itm.inspection_id,
      permit_number: itm.permit_num,
      permit_group: itm.permit_group,
      permit_type: itm.permit_type,
      permit_subtype: itm.permit_subtype,
      permit_category: itm.permit_category,
      inspection_type: itm.inspection_type,
      requestor_name: itm.requestor_name,
      status: itm.status,
      inspector: itm.inspector,
      request_date: itm.request_date,
      scheduled_date: itm.scheduled_date,
      completed_date: itm.completed_date,
      submit_date: itm.submit_date,
      result_comment: itm.result_comment,
      unit_number: itm.unit_number,
      record_date: itm.record_date,
    };
  });
}

// To work around the 6MB limit on Lambda response size, we truncate the data.
// This is a temporary solution to a pathological query. 
// It will fail again as the data grows. Pagination would work better.
function truncateLargeData(rows) {
  const dataLength = JSON.stringify(rows).length;
  if (dataLength > 6_000_000) {
    rows.forEach((row) => {  // temp remove comments to get under 6MB
      row.comments = [];
    });
    const dataLength2 = JSON.stringify(rows).length;
    if (dataLength2 > 6_000_000) {
      rows.forEach((row) => {  // temp truncate description to get under 6MB
        row.permit_description = row.permit_description ? row.permit_description.substring(0, 10) : null;
      });
    }
  }
  return rows;
}

const resolvers = {
  Query: {
    firstReviewSLASummary(obj, args, context) {
      const pool = context.pool;
      let tasks = null;
      let q = 'select * from simplicity.dsd_first_review_sla_summary';
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
      const qargs = [];
      let query = `
      select *
      from simplicity.m_v_simplicity_permits AS A
      `
      if(args.trc) { // Limit to just large permits
        query = `
        select * from (
          select *
          from simplicity.m_v_simplicity_permits
          where 
          permit_group = 'Planning' and
          permit_type = 'Development' and
          permit_subtype = 'Level I'
            union 
          select *
          from simplicity.m_v_simplicity_permits
          where 
          permit_group = 'Planning' and
          permit_type = 'Subdivision' and
          permit_subtype = 'Major'
            union 
          select *
          from simplicity.m_v_simplicity_permits
          where 
          permit_group = 'Planning' and
          permit_type = 'Development' and
          permit_subtype = 'Level II' 
            union 
          select *
          from simplicity.m_v_simplicity_permits
          where 
          permit_group = 'Planning' and
          permit_type = 'Development' and
          permit_subtype = 'Conditional Zoning'
            union 
          select *
          from simplicity.m_v_simplicity_permits
          where 
          permit_group = 'Planning' and
          permit_type = 'Development' and
          permit_subtype = 'Conditional Use' 
        ) as A
        `;
      }
      if (args.permit_numbers && args.permit_numbers.length > 0) {
        qargs.push(args.permit_numbers);
        query += 'WHERE A.permit_number = ANY ($1) ';
      } else if (args.before || args.after || args.permit_groups) {
        const dateField = (args.date_field === 'status_date') ? 'status_date' : 'applied_date';
        let nextParam = '$1';
        query += 'where ';
        if (args.before) {
          query += `${dateField} < $1 `;
          nextParam = '$2';
          if (args.after) query += 'and ';
          qargs.push(args.before);
        }
        if (args.after) {
          query += `${dateField} > ${nextParam} `;
          nextParam = (nextParam === '$1') ? '$2' : '$3';
          qargs.push(args.after);
        }
        if (args.permit_groups) {
          if (args.before || args.after) query += 'and ';
          query += `A.permit_group = ANY(${nextParam}) `;
          qargs.push(args.permit_groups);
        }
      }
      query += 'ORDER BY A.applied_date DESC, A.permit_number DESC ';
      return context.pool.query(query, qargs)
        .then((result) => {
          return result.rows;
        })
        .catch((err) => {
          console.log(err);
          throw new Error(`Got an error in permits: ${JSON.stringify(err)}`);
        });
    },
    permits_by_address(obj, args, context) {
      const radius = args.radius ? Number(args.radius) : 10; // State plane units are feet
      let query = `
      select A.*
      from internal.coa_bc_address_master M1
      inner join internal.coa_bc_address_master M2
      on ST_DWithin(M1.shape, M2.shape, $2) --uses index!
      inner join simplicity.m_v_simplicity_permits A
      on M2.civicaddress_id::text = A.civic_address_id
      where M1.civicaddress_id = $1
      AND A.permit_group <> 'Services'
      `;
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
      query += 'ORDER BY A.applied_date DESC, A.permit_number DESC ';

      return context.pool.query(query, qargs)
        .then(result => {
          const rows = truncateLargeData(result.rows);
          return rows;
        })
        .catch((err) => {
          console.error(`Got an error in permits_by_address: ${err} ${query} ${qargs}`);
          throw new Error(`Got an error in permits_by_address: ${err}`);
        });
    },
    permits_by_street(obj, args, context) {
      const radius = (args.radius) ? Number(args.radius) : 100; // State plane units are feet
      if (args.centerline_ids.length <= 0) return [];
      const query = `
      SELECT DISTINCT A.* FROM simplicity.get_permits_along_streets($1, $2, $3, $4) AS A
      WHERE permit_group <> 'Services'
      ORDER BY A.applied_date DESC, A.permit_number DESC
      `;

      return context.pool.query(query, [args.centerline_ids, radius, args.after, args.before])
        .then(result => {
          return result.rows;
        })
        .catch((err) => {
          if (err) {
            console.error(`Got an error in permits_by_street: ${err}`);
            throw new Error(err);
          }
        });
    },
    permits_by_neighborhood(obj, args, context) {

      if (args.nbrhd_ids.length <= 0) return [];
      const query = `
			SELECT permit_number, permit_group, permit_type, permit_subtype, permit_category, permit_description, 
      -- substring(A.permit_description,0,20) as permit_description, 
			applicant_name, application_name, applied_date, status_current, status_date, technical_contact_name, 
			technical_contact_email, created_by, building_value, job_value, total_project_valuation, total_sq_feet, 
			fees, paid, balance, invoiced_fee_total, civic_address_id, address, city, zip, pinnum, x, y, 
			internal_record_id, contractor_names, contractor_license_numbers, "comments"
      FROM simplicity.get_permits_by_neighborhood($1, $2, $3) AS A 
      WHERE permit_group <> 'Services' 
      ORDER BY A.applied_date DESC, A.permit_number DESC;
      `
      return context.pool.query(query, [args.nbrhd_ids, args.after, args.before])
        .then(result => {
          const rows = truncateLargeData(result.rows);
          return rows;
        })
        .catch((err) => {
          if (err) {
            console.error(`Got an error in permits_by_neighborhood: ${err}`);
            throw new Error(err);
          }
        });
    },
    firstReviewSLAItems(obj, args, context) {
      const pool = context.pool;
      return pool.query(
        'SELECT * from internal.dsd_first_review_sla'
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
    permit_tasks(obj, args, context) {
      const qargs = [];
      let query = 'SELECT * FROM internal.permit_tasks AS A ';
      if (args.permit_numbers && args.permit_numbers.length > 0) {
        qargs.push(args.permit_numbers);
        query += 'WHERE A.permit_num = ANY ($1) ';
      } else if (args.before || args.after) {
        const dateField = args.date_field || 'current_status_date';
        let nextParam = '$1';
        query += 'where ';
        if (args.before) {
          query += `${dateField} < $1 `;
          nextParam = '$2';
          if (args.after) query += 'and ';
          qargs.push(args.before);
        }
        if (args.after) {
          query += `${dateField} > ${nextParam} `;
          nextParam = (nextParam === '$1') ? '$2' : '$3';
          qargs.push(args.after);
        }
        if (args.permit_groups) {
          if (args.before || args.after) query += 'and ';
          query += `A.permit_group = ANY(${nextParam}) `;
          qargs.push(args.permit_groups);
        }
      }
      query += 'ORDER BY A.applied_date DESC, A.permit_number DESC ';
      return context.pool.query(query, qargs)
        .then((result) => {
          return preparePermitTasks(result.rows);
        })
        .catch((err) => {
          console.log(err);
          throw new Error(`Got an error in permit_tasks: ${JSON.stringify(err)}`);
        });
    },
    inspections(obj, args, context) {
      const qargs = [];
      let query = 'SELECT * FROM internal.inspections AS A ';
      if (args.permit_numbers && args.permit_numbers.length > 0) {
        qargs.push(args.permit_numbers);
        query += 'WHERE A.permit_num = ANY ($1) ';
      } else if (args.before || args.after) {
        const dateField = args.date_field || 'record_date';
        let nextParam = '$1';
        query += 'where ';
        if (args.before) {
          query += `${dateField} < $1 `;
          nextParam = '$2';
          if (args.after) query += 'and ';
          qargs.push(args.before);
        }
        if (args.after) {
          query += `${dateField} > ${nextParam} `;
          nextParam = (nextParam === '$1') ? '$2' : '$3';
          qargs.push(args.after);
        }
        if (args.permit_groups) {
          if (args.before || args.after) query += 'and ';
          query += `A.permit_group = ANY(${nextParam}) `;
          qargs.push(args.permit_groups);
        }
      }
      query += 'ORDER BY A.permit_num DESC ';
      return context.pool.query(query, qargs)
        .then((result) => {
          return prepareInspections(result.rows);
        })
        .catch((err) => {
          console.log(err);
          throw new Error(`Got an error in inspections: ${JSON.stringify(err)}`);
        });
    },
    async permit_realtime(obj, args, context) { // deprecated
      const newargs = { permit_numbers: [args.permit_number] };
      let x = await resolvers.Query.permits(obj, newargs, context);
      return x[0];
    },
    async permits_by_address_realtime(obj, args, context) { // deprecated
      return await resolvers.Query.permits_by_address(obj, args, context);
    },
  },

  Permit: {
    // comments(obj, args, context) { // eslint-disable-line no-unused-vars
    //   return obj.comments;
    // },
    custom_fields(obj, args, context) {
      const query = `select type, name, value from internal.permit_custom_fields 
      where permit_num = $1`;
      return context.pool.query(query, [obj.permit_number])
        .then((result) => {
          return result.rows;
        })
        .catch((err) => {
          console.log(err);
          throw new Error(`Got an error in Permit.custom_fields: ${err}`);
        });
    },
    async address_info(obj, args, context) {
      const civicaddress_ids = [obj.civic_address_id];
      args.civicaddress_ids = civicaddress_ids;
      const ret = await addressresolver.Query.addresses(obj, args, context);
      return ret[0];
    }

  },
  PermitRT: { // deprecated
    custom_fields(obj, args, context) {
      return resolvers.Permit.custom_fields(obj, args, context);
    },
  }
};

export default resolvers;
