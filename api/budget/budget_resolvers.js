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
      let view = 'amd.budget_summary_by_dept_view';
      if (which === 'use') {
        categoryColumn = 'category_name';
        view = 'amd.budget_summary_by_use_view';
      }
      return pool.query('SELECT * from amd.budget_parameters_view')
      .then(bp => {
        if (bp.rows.length === 0) return null;
        const inBudgetSeason = bp.rows[0].in_budget_season === 'true';
        const defaultYear = bp.rows[0].defaultyear;
        const currentYear = bp.rows[0].currentyear;
        const isProposed = inBudgetSeason && currentYear === defaultYear;
        console.log(`inBudgetSeason = ${inBudgetSeason}, defaultYear = ${defaultYear}, current = ${currentYear}`);
        let endYear = currentYear;
        if ((inBudgetSeason && currentYear === defaultYear) ||
            (defaultYear > currentYear)) endYear = currentYear + 1;
        const startYear = inBudgetSeason ? currentYear - 2 : defaultYear - 3;
    
        const query = `
          SELECT  account_type, year, total_proposed_budget, total_adopted_budget, total_actual,
                  ${categoryColumn} AS category_name
          FROM ${view}
          WHERE year >= ${startYear} and year <= ${endYear}
          ORDER BY year desc, account_type
        `;
        return pool.query(query)
        .then((result) => {
          if (result.rows.length === 0) return null;
          const p = result.rows.map(itm => {
            const year = parseInt(itm.year, 10);
            let derivedBudget = itm.total_adopted_budget;
            if (isProposed && year === endYear) derivedBudget = itm.total_proposed_budget;
            return {
              account_type: itm.account_type,
              category_name: itm.category_name,
              year,
              total_budget: derivedBudget,
              total_actual: itm.total_actual,
            };
          });
          return p;
        })
        .catch((err) => {
          if (err) {
            logger.error(`Got an error in budgetSumary: ${err}`);
          }
        });
      });
    },
    budgetParameters(obj, args, context) {
      const pool = context.pool;
      return pool.query('SELECT * from amd.budget_parameters_view')
      .then(bp => {
        if (bp.rows.length === 0) return null;
        const inBudgetSeason = bp.rows[0].in_budget_season === 'true';
        const defaultYear = bp.rows[0].defaultyear;
        const currentYear = bp.rows[0].currentyear;
        let endYear = currentYear;
        if ((inBudgetSeason && currentYear === defaultYear) ||
            (defaultYear > currentYear)) endYear = currentYear + 1;
        const startYear = inBudgetSeason ? currentYear - 2 : defaultYear - 3;
        return {
          start_year: startYear,
          end_year: endYear,
          in_budget_season: (inBudgetSeason && currentYear === defaultYear),
        };
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
        const defaultYear = bp.rows[0].defaultyear;
        const currentYear = bp.rows[0].currentyear;
        const isProposed = inBudgetSeason && currentYear === defaultYear;
        console.log(`inBudgetSeason = ${inBudgetSeason}, defaultYear = ${defaultYear}, current = ${currentYear}`);
        let endYear = currentYear;
        if ((inBudgetSeason && currentYear === defaultYear) ||
            (defaultYear > currentYear)) endYear = currentYear + 1;
        const startYear = inBudgetSeason ? currentYear - 2 : defaultYear - 3;
        console.log(`Start year is ${startYear}, end year is ${endYear}`);
        const bhQuery = `SELECT * from amd.v_gl_5yr_plus_budget_mapped where year >= ${startYear} AND year <= ${endYear}`;
        console.log(`BHQUERY: ${bhQuery}`);
        return pool.query(bhQuery)
        .then((result) => {
          if (result.rows.length === 0) return null;
          return result.rows.map((itm) => {
            const year = parseInt(itm.year, 10);
            let useActual = true;
            if (year > currentYear || year === defaultYear) {
              useActual = false;
            }
            let derivedBudget = itm.adopted_budget;
            if (isProposed && year === endYear) derivedBudget = itm.proposed_budget;
            // Set isProposed on each line, so it only applies to new budget year
            return {
              account_type: itm.account_type,
              account_name: itm.object_name,
              fund_name: itm.fund_name,
              department_name: itm.department_name,
              division_name: itm.division_name,
              costcenter_name: itm.costcenter_name,
              function_name: itm.function_name,
              charcode_name: null,
              organization_name: itm.organization_name,
              category_name: itm.category_name,
              budget_section_name: itm.budget_section_name,
              object_name: itm.object_name,
              year: itm.year,
              budget: derivedBudget,
              actual: itm.actual,
              full_account_id: null,
              org_id: itm.organization_id,
              obj_id: itm.object_id,
              fund_id: itm.fund_id,
              dept_id: itm.department_id,
              div_id: itm.division_id,
              cost_id: itm.costcenter_id,
              func_id: itm.function_id,
              charcode: null,
              category_id: itm.category_name,
              budget_section_id: itm.budget_section_name,
              proj_id: itm.project_id,
              is_proposed: isProposed && itm.year === endYear,
              use_actual: useActual,
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
      return pool.query('SELECT * from amd.budget_parameters_view')
      .then(bp => {
        if (bp.rows.length === 0) return null;
        const inBudgetSeason = bp.rows[0].in_budget_season === 'true';
        const defaultYear = bp.rows[0].defaultyear;
        const currentYear = bp.rows[0].currentyear;
        const isProposed = inBudgetSeason && currentYear === defaultYear;
        console.log(`inBudgetSeason = ${inBudgetSeason}, defaultYear = ${defaultYear}, current = ${currentYear}`);
        let endYear = currentYear;
        if ((inBudgetSeason && currentYear === defaultYear) ||
            (defaultYear > currentYear)) endYear = currentYear + 1;
        const startYear = inBudgetSeason ? currentYear - 2 : defaultYear - 3;
        console.log(`Start year is ${startYear}, end year is ${endYear}`);

        let query = `
          SELECT account_type, department_name, department_name as dept_id, fund_id, fund_name,
            SUM(adopted_budget) as adopted_budget, SUM(proposed_budget) as proposed_budget,
            NULL as category_name, NULL as category_id, year
          FROM amd.v_gl_5yr_plus_budget_mapped
          WHERE account_type = 'E' and year = ${endYear}
          GROUP BY account_type, year, fund_id, fund_name, dept_id,
          department_name, category_id, category_name
        `;
        if (args.accountType === 'R') {
          query = `
          SELECT account_type, category_name, category_name as category_id, year,
            SUM(adopted_budget) as adopted_budget, SUM(proposed_budget) as proposed_budget,
            fund_name, fund_id, NULL as dept_id, NULL as department_name
          FROM amd.v_gl_5yr_plus_budget_mapped
          WHERE account_Type = 'R' and year = ${endYear}
          GROUP BY category_id, category_name, account_type, year, fund_id,
          fund_name, dept_id, department_name
        `;
        }
        return pool.query(query)
        .then((result) => {
          if (result.rows.length === 0) return null;
          const p = result.rows.map(itm => {
            const year = parseInt(itm.year, 10);
            let derivedBudget = itm.adopted_budget;
            if (isProposed && year === endYear) derivedBudget = itm.proposed_budget;
            return {
              account_type: itm.account_type,
              category_name: itm.category_name,
              category_id: itm.category_id,
              department_name: itm.department_name,
              dept_id: itm.dept_id,
              fund_id: itm.fund_id,
              fund_name: itm.fund_name,
              budget: derivedBudget,
              year: itm.year,
            };
          })
          .filter(itm => {
            return (itm.budget !== null && itm.budget !== 0.0);
          })
          .map(itm => {
            // console.log(itm);
            return itm;
          });
          return p;
        })
        .catch((err) => {
          if (err) {
            logger.error(`Got an error in property: ${err}`);
          }
        });
      });
    },
  },
};

module.exports = resolvers;
