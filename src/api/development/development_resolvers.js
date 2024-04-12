
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
      select A.*
      from simplicity.m_v_simplicity_permits as A 
      `;
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
      query += 'ORDER BY A.permit_number DESC ';
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
      from simplicity.m_v_simplicity_permits as A
      inner join internal.coa_bc_address_master as M
      on ST_DWithin(
			ST_Transform(ST_SetSRID(ST_Point(A.x, A.y),4326),2264), 
			ST_Transform(ST_SetSRID(ST_Point(M.longitude_wgs, M.latitude_wgs),4326),2264), $2)
      where M.civicaddress_id = $1
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
      query += 'ORDER BY A.permit_number DESC ';

      return context.pool.query(query, qargs)
      .then(result => {
        return result.rows;
      })
      .catch((err) => {
        console.error(`Got an error in permits_by_address: ${err}`);
        throw new Error(`Got an error in permits_by_address: ${err}`);
      });
    },
    permits_by_street(obj, args, context) {
      const radius = (args.radius) ? Number(args.radius) : 100; // State plane units are feet
      if (args.centerline_ids.length <= 0) return [];
      const query = `
      SELECT DISTINCT A.* FROM simplicity.get_permits_along_streets($1, $2, $3, $4) AS A
      WHERE permit_group <> 'Services'
      ORDER BY permit_number DESC
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
      SELECT A.*
      FROM simplicity.get_permits_by_neighborhood($1, $2, $3) AS A 
      WHERE permit_group <> 'Services' 
      ORDER BY permit_number DESC;
      `
      return context.pool.query(query, [args.nbrhd_ids, args.after, args.before])
      .then(result => {
        return result.rows;
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
      query += 'ORDER BY A.permit_num DESC ';
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
  },

  Permit: {
    // comments(obj, args, context) { // eslint-disable-line no-unused-vars
    //   return obj.comments;
    // },
    custom_fields(obj, args, context) {
      const query = `select type, name, value from internal.permit_custom_fields 
      where permit_num = $1`;
      return context.pool.query(query,[obj.permit_number])
      .then((result) => {
        return result.rows;
      })
      .catch((err) => {
        console.log(err);
        throw new Error(`Got an error in Permit.custom_fields: ${err}`);
      });
    },
  },
};

export default resolvers;