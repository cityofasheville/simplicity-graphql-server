const resolvers = {
  Query: {
    budgetSummary(obj, args, context) {
      const logger = context.logger;
      const pool = context.pool;
      const which = args.breakdown;
      let categoryColumn = 'department_name';
      let accountType = 'E';
      if (args.accountType) accountType = args.accountType;
      let maxCategories = 10;
      if ('maxCategories' in args) maxCategories = parseInt(args.maxCategories, 10);
      let view = 'simplicity.budget_summary_by_dept_view';
      if (which === 'use') {
        categoryColumn = 'category_name';
        view = 'simplicity.budget_summary_by_use_view';
      }

      return pool.query('SELECT * from simplicity.budget_parameters_view')
      .then(bp => {
        if (bp.rows.length === 0) return null;
        const inBudgetSeason = bp.rows[0].in_budget_season === 'true';
        const defaultYear = bp.rows[0].defaultyear;
        const currentYear = bp.rows[0].currentyear;
        const isProposed = inBudgetSeason && currentYear === defaultYear;
        let endYear = currentYear;
        if ((inBudgetSeason && currentYear === defaultYear) ||
            (defaultYear > currentYear)) endYear = currentYear + 1;
        const startYear = inBudgetSeason ? currentYear - 2 : defaultYear - 3;

        const query = `
          SELECT  account_type, year, total_proposed_budget, total_adopted_budget, total_actual,
                  ${categoryColumn} AS category_name
          FROM ${view}
          WHERE year >= ${startYear} and year <= ${endYear} AND account_type = '${accountType}'
          ORDER BY year desc, account_type
        `;

        const byYear = {};
        const sumByCategory = {};
        return pool.query(query)
        .then((result) => {
          if (result.rows.length === 0) return null;
          result.rows.forEach(itm => {
            const year = parseInt(itm.year, 10);
            let derivedBudget = itm.total_adopted_budget;
            if (isProposed && year === endYear) derivedBudget = itm.total_proposed_budget;
            let useActual = true;
            if (year > currentYear || year === defaultYear) {
              useActual = false;
            }
            const val = useActual ? parseFloat(itm.total_actual) : parseFloat(derivedBudget);
            if (!sumByCategory.hasOwnProperty(itm.category_name)) {
              sumByCategory[itm.category_name] = val;
            } else {
              sumByCategory[itm.category_name] += val;
            }
            if (!byYear.hasOwnProperty(itm.year)) byYear[itm.year] = [];
            byYear[itm.year].push({
              account_type: itm.account_type,
              category_name: itm.category_name,
              year,
              total_budget: derivedBudget,
              total_actual: itm.total_actual,
              use_actual: useActual,
            });
          });
          const topCategories = {};
          Object.keys(sumByCategory)
          .map(key => { return { name: key, value: sumByCategory[key] }; })
          .sort((a, b) => {
            return b.value - a.value;
          })
          .filter((cat, index) => {
            return (index < maxCategories - 1);
          })
          .forEach(cat => {
            topCategories[cat.name] = true;
          });
          const p = [];
          Object.keys(byYear).forEach(yr => {
            const other = {
              account_type: accountType,
              category_name: 'Other',
              year: yr,
              total_budget: 0,
              total_actual: 0,
              use_actual: byYear[yr][0].use_actual,
            };
            byYear[yr].forEach(yearCat => {
              if (!topCategories.hasOwnProperty(yearCat.category_name)) {
                if (yearCat.total_budget) other.total_budget += parseFloat(yearCat.total_budget);
                if (yearCat.total_actual) other.total_actual += parseFloat(yearCat.total_actual);
              } else {
                p.push(yearCat);
              }
            });
            if (Math.abs(other.total_budget) > 0 || Math.abs(other.total_actual)) p.push(other);
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
      return pool.query('SELECT * from simplicity.budget_parameters_view')
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
      const logger = context.logger;
      const pool = context.pool;
      return pool.query('SELECT * from simplicity.budget_parameters_view')
      .then(bp => {
        if (bp.rows.length === 0) return null;
        const inBudgetSeason = bp.rows[0].in_budget_season === 'true';
        const defaultYear = bp.rows[0].defaultyear;
        const currentYear = bp.rows[0].currentyear;
        const isProposed = inBudgetSeason && currentYear === defaultYear;
        const byAccount = {};
        let endYear = currentYear;
        if ((inBudgetSeason && currentYear === defaultYear) ||
            (defaultYear > currentYear)) endYear = currentYear + 1;
        const startYear = inBudgetSeason ? currentYear - 2 : defaultYear - 3;
        const bhQuery = 'SELECT * from simplicity.v_gl_5yr_plus_budget_mapped '
        + `where year >= ${startYear} AND year <= ${endYear}`;
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
            const oo = `${itm.organization_name}.${itm.object_name}`;
            if (!byAccount.hasOwnProperty(oo)) {
              byAccount[oo] = 0.0;
            }
            const actual = itm.actual ? parseFloat(itm.actual) : '0.0';
            byAccount[oo] += Math.abs(actual + parseFloat(derivedBudget));
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
          })
          .filter(itm => {
            const oo = `${itm.organization_name}.${itm.object_name}`;
            return byAccount[oo] > 0.0;
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
      return pool.query('SELECT * from simplicity.budget_parameters_view')
      .then(bp => {
        if (bp.rows.length === 0) return null;
        const inBudgetSeason = bp.rows[0].in_budget_season === 'true';
        const defaultYear = bp.rows[0].defaultyear;
        const currentYear = bp.rows[0].currentyear;
        const isProposed = inBudgetSeason && currentYear === defaultYear;
        let endYear = currentYear;
        if ((inBudgetSeason && currentYear === defaultYear) ||
            (defaultYear > currentYear)) endYear = currentYear + 1;

        let query = `
          SELECT account_type, department_name, department_name as dept_id, fund_id, fund_name,
            SUM(adopted_budget) as adopted_budget, SUM(proposed_budget) as proposed_budget,
            NULL as category_name, NULL as category_id, year
          FROM simplicity.v_gl_5yr_plus_budget_mapped
          WHERE account_type = 'E' and year = ${endYear}
          GROUP BY account_type, year, fund_id, fund_name, dept_id,
          department_name, category_id, category_name
        `;
        if (args.accountType === 'R') {
          query = `
          SELECT account_type, category_name, category_name as category_id, year,
            SUM(adopted_budget) as adopted_budget, SUM(proposed_budget) as proposed_budget,
            fund_name, fund_id, NULL as dept_id, NULL as department_name
          FROM simplicity.v_gl_5yr_plus_budget_mapped
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

export default resolvers;
