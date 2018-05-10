const newBudgetFlag = true;

function getOldBudgetHistory(obj, args, context) {
  console.log('I am in the old budget');
  const logger = context.logger;
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
      logger.error(`Got an error in property: ${err}`);
    }
  });
}

const resolvers = {
  Query: {
    budgetSummary(obj, args, context) {
      const logger = context.logger;
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
          logger.error(`Got an error in property: ${err}`);
        }
      });
    },
    budgetHistory(obj, args, context) {
      if (!newBudgetFlag) return getOldBudgetHistory(obj, args, context);
      const logger = context.logger;
      const pool = context.pool;
      return pool.query('SELECT * from amd.budget_parameters_view')
      .then(bp => {
        if (bp.rows.length === 0) return null;
        const inBudgetSeason = bp.rows[0].in_budget_season === 'true';
        let isProposed = inBudgetSeason && currentYear === defaultYear;
        const defaultYear = bp.rows[0].defaultyear;
        const currentYear = bp.rows[0].currentyear;
        console.log(`inBudgetSeason = ${inBudgetSeason}, defaultYear = ${defaultYear}, current = ${currentYear}`);
        let endYear = currentYear;
        if ((inBudgetSeason && currentYear === defaultYear) ||
            (defaultYear > currentYear)) endYear = currentYear + 1;
        const startYear = inBudgetSeason ? currentYear - 2 : defaultYear - 3;
        console.log(`Start year is ${startYear}, end year is ${endYear}`);
        return pool.query(
          'SELECT * from coagis.v_budget_proposed_plus_history where year >= 2015'
        )
        .then((result) => {
          if (result.rows.length === 0) return null;
          return result.rows.map((itm) => {
            const year = parseInt(itm.year, 10);
            let useActual = true;
            if (year > currentYear || year === defaultYear) {
              useActual = false;
            }
            // Set isProposed on each line, so it only applies to new budget year
            return {
              account_type: itm.account_type,
              account_name: itm.account_name,
              fund_name: itm.fund_name,
              department_name: itm.department_name,
              division_name: itm.division_name,
              costcenter_name: itm.costcenter_name,
              function_name: itm.function_name,
              charcode_name: itm.charcode_name,
              organization_name: itm.organization_name,
              category_name: itm.category_name,
              budget_section_name: itm.budget_section_name,
              object_name: itm.object_name,
              year: itm.year,
              budget: itm.budget,
              actual: itm.actual,
              full_account_id: itm.full_account_id,
              org_id: itm.org_id,
              obj_id: itm.obj_id,
              fund_id: itm.fund_id,
              dept_id: itm.dept_id,
              div_id: itm.div_id,
              cost_id: itm.cost_id,
              func_id: itm.func_id,
              charcode: itm.charcode,
              category_id: itm.category_id,
              budget_section_id: itm.budget_section_id,
              proj_id: itm.proj_id,
              is_proposed: isProposed,
            };
          });
        })
        .catch((err) => {
          if (err) {
            logger.error(`Got an error in budget history: ${err}`);
          }
        });
      });
    },
    budgetCashFlow(obj, args, context) {
      const logger = context.logger;
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
          logger.error(`Got an error in property: ${err}`);
        }
      });
    },
  },
};

module.exports = resolvers;
