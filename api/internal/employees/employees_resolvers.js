
const resolvers = {
  Query: {
    employees(obj, args, context) {
      let query = 'SELECT * FROM amd.employee_main ';
      const qargs = [];
      if (args.ids && args.ids.length > 0) {
        query += 'WHERE emp_id = ANY($1)';
        qargs.push(args.ids);
      } else if (args.departments || args.divisions || args.supervisors) {
        query += 'WHERE ';
        const startCount = args.status ? 1 : 0;
        let count = startCount;
        if (args.status) {
          query += 'active = $1 ';
          qargs.push(args.status);
        }
        if (args.departments) {
          if (count > 0) query += 'AND ';
          ++count;
          query += `dept_id = ANY($${count}) `;
          qargs.push(args.departments);
        }
        if (args.divisions) {
          if (count > 0) query += 'AND ';
          ++count;
          query += `div_id = ANY($${count}) `;
          qargs.push(args.divisions);
        }
        if (args.supervisors) {
          if (count > 0) query += 'AND ';
          ++count;
          query += `sup_id = ANY($${count}) `;
          qargs.push(args.supervisors);
        }
      }

      return context.pool.query(query, qargs)
      .then(result => {
        if (result.rows.length === 0) return [];
        return result.rows.map(e => {
          return {
            employee_id: e.emp_id,
            ad_username: e.ad_username,
            email_city: e.email_city,
            ad_memberships: e.ad_memberships,
            active: e.active === 'A',
            employee_name: e.employee,
            employee_email: e.emp_email,
            position: e.position,
            department_id: e.dept_id,
            department: e.department,
            division_id: e.div_id,
            division: e.division,
            supervisor_id: e.sup_id,
            supervisor: e.supervisor,
            supervisor_email: e.sup_email,
            hire_date: e.hire_date,
          };
        });
      })
      .catch(error => {
        context.logger.error(`Error in employees endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
};
module.exports = resolvers;
