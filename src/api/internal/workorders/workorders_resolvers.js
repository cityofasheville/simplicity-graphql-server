const resolvers = {
  Query: {
    projects(obj, args, context) {
      
      const status = args.status;
      const reqType = args.req_type;
      const priorities = args.priorities;
      const before = args.before;
      const after = args.after;

      const pool = context.pool;
      let query = 'SELECT * from internal.workorders';
      if (after) {
        query += ` where requested_date > '${after}'`;
      }
      return pool.query(query)
      .then((result) => {
        if (result.rows.length === 0) return [];
        return result.rows.map(itm => {
          return {
            ID: itm.id,
            ParentID: itm.parent_id,
            RespondBy: itm.respond_by,
            Summary: itm.summary,
            Type: itm.type,
            Requestor: itm.requestor,
            RequestedDate: itm.requested_date,
            ResolutionDate: itm.resolution_date,
            ElapsedTime: itm.elapsed_time,
            Priority: itm.priority,
            DueDate: itm.due_date,
            AssignedTechnician: itm.assigned_technician,
            DateCompleted: itm.date_completed,
            Hours: itm.hours,
            Department: itm.department,
            Notes: itm.notes,
            Resolution: itm.resolution,
            CurrentStatus: itm.current_status,
            IncidentOrServiceReq: itm.incident_or_service_req,
            HotList: itm.hotlist,
            DateResponded: itm.date_responded,
            WorkOrderTypeName: itm.work_order_type_name,
            Subtype: itm.sub_type,
            Text1: itm.text1,
            Text4: itm.text4,
            ForwardProject: itm.forward_project,
            OrgImpact: itm.org_impact,
            RequestorPriority: itm.requestor_priority,
            TaskLookup6: itm.task_lookup_6,
            TaskLookup7: itm.task_lookup_7,
            ITInvolvement: itm.it_involvement,
            ASSNDATE: itm.assndate,
            WOTYPE3: itm.wo_type_3,
            STATUS: itm.status,
            WO_TEXT2: itm.wo_text_2,
            WO_TEXT3: itm.wo_text_3,
            WO_TEXT5: itm.wo_text_5,
            WO_TEXT6: itm.wo_text_6,
            WO_NUM1: itm.wo_num_1,
            WO_INT1: itm.wo_int_1,
          };
        });
      })
      .then((results) => {
        return results
        .filter((item) => {
          let keep = true;
          if (after || before) {
            const date1 = new Date(item.RequestedDate);
            if (after && date1 < new Date(`${after} 00:00:00 GMT-0500`)) {
              keep = false;
            }
            if (keep && before && date1 > new Date(`${before} 00:00:00 GMT-0500`)) {
              keep = false;
            }
          }
          return keep;
        })
        .filter(item => {
          let keep = true;
          if (reqType) {
            keep = (item.IncidentOrServiceReq === reqType);
          }
          return keep;
        })
        .filter(item => {
          let keep = true;
          if (status) {
            keep = status.reduce((accum, cur) => {
              return (accum || item.CurrentStatus === cur);
            }, false);
          }
          return keep;
        })
        .filter(item => {
          let keep = true;
          if (priorities) {
            keep = priorities.reduce((accum, cur) => {
              return (accum || item.Priority === cur);
            }, false);
          }
          return keep;
        });
      })
      .catch((err) => {
        console.error(`Got an error in internal resolvers: ${err}`);
        throw new Error(`Got an error in internal resolvers: ${err}`);
      });
    },
  },
};

export default resolvers;
