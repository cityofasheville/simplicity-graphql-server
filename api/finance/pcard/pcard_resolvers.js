
function loadTransactions(rows) {
  const results = [];
  rows.forEach(itm => {
    const t = {
      dept_id: itm.dept_id,
      department: itm.department,
      div_id: itm.div_id,
      division: itm.division,
      cardholder: itm.cardholder,
      statement_code: itm.statement_code,
      statement_id: itm.statement_id,
      statement_status: itm.statment_status, // NOTE MISSPELLING
      fiscal_year: itm.fiscal_year,
      fiscal_period: itm.fiscal_period,
      charge_date: itm.invoiced_date, // FIX LATER
      amount: 0.0,
      vendor_id: '',
      vendor_name: '',
      description: '',
      invoiced_date: itm.invoiced_date,
      reconciled_date: itm.reconciled_date,
      days_invoiced_to_reconciled: itm.days_invoiced_to_reconciled,
      approved_date: itm.approved_date,
      days_reconciled_to_approved: itm.days_reconciled_to_approved,
      days_since_invoiced: itm.days_since_invoiced,
      days_since_reconciled: itm.days_since_reconciled,
    };
    results.push(t);
  });
  return results;
}
const resolvers = {
  Query: {
    pcard_transactions(obj, args, context) {
      // console.log('In pcard_transactions');
      if (false && context.employee.employee_id <= 0) {
        throw new Error('You must be logged in as a City of Asheville employee to view this data');
      }
      const logger = context.logger;
      let query = 'SELECT * FROM amd.pcard_transaction ';
      const qargs = [];
      if (args.before !== undefined || args.after !== undefined) query += 'WHERE ';
      let nextParam = '$1';
      if (args.before !== undefined) {
        qargs.push(`'${args.before}'`);
        query += `charge_date < ${nextParam} `;
        nextParam = '$2';
      }
      if (args.after !== undefined) {
        if (qargs.length > 0) query += 'AND ';
        qargs.push(`'${args.after}'`);
        query += `charge_date > ${nextParam} `;
      }
      return context.pool.query(query, qargs)
      .then((result) => {
        return result.rows;
      })
      .catch((err) => {
        logger.error(`Got an error in pcard_transactions: ${err}`);
        throw new Error(`Got an error in pcard_transactions: ${err}`);
      });
    },

    pcard_statements_status(obj, args, context) {
      // console.log('In pcard_statements_status');
      if (false && context.employee.employee_id <= 0) {
        throw new Error('You must be logged in as a City of Asheville employee to view this data');
      }
      const logger = context.logger;
      let query = 'SELECT * FROM amd.pcard_statement_status_history ';
      const qargs = [];
      if (args.before !== undefined || args.after !== undefined) query += 'WHERE ';
      let nextParam = '$1';
      if (args.before !== undefined) {
        qargs.push(`'${args.before}'`);
        query += `invoiced_date < ${nextParam} `;
        nextParam = '$2';
      }
      if (args.after !== undefined) {
        if (qargs.length > 0) query += 'AND ';
        qargs.push(`'${args.after}'`);
        query += `invoiced_date > ${nextParam} `;
      }
      return context.pool.query(query, qargs)
      .then((result) => {
        return result.rows;
      })
      .catch((err) => {
        logger.error(`Got an error in pcard_statements_status: ${err}`);
        throw new Error(`Got an error in pcard_statements_status: ${err}`);
      });
    },
  },
};

module.exports = resolvers;
