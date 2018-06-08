let initialized = false;
const firebase = require('firebase');

function coaWebLogin(pool, logger, req) {
  const userInfo = {
    user: {
      loggedin: false,
      token: null,
      uid: null,
      name: null,
      email: null,
    },
    employee: {
      employee_id: 0,
      department: null,
      division: null,
      groups: [],
    },
  };

  if (!initialized) {
    // Import Firebase - for now (8/25/16), the use of require and import of individual
    // submodules is needed to avoid problems with webpack (import seems to require
    // beta version of webpack 2).
    logger.info('Initialize firebase');
    firebase.initializeApp({
      serviceAccount: process.env.firebase_service_account,
      databaseURL: process.env.firebase_db_url,
    });
    logger.info('Firebase initialized');
    initialized = true;
  }
  logger.info('New client connection');
  if (!req.headers.authorization || req.headers.authorization === 'null') {
    return userInfo;
  }
  logger.info('Attempt login verification');
  return firebase.auth().verifyIdToken(req.headers.authorization)
  .then((decodedToken) => {
    logger.info(`Logging in ${decodedToken.email}`);
    const decodedEmail = decodedToken.email.toLowerCase();
    userInfo.user.loggedin = true;
    userInfo.user.token = req.headers.authorization;
    userInfo.user.uid = decodedToken.uid;
    userInfo.user.name = decodedToken.name;
    userInfo.user.email = decodedEmail;
    if (!decodedEmail.endsWith('@ashevillenc.gov')) return userInfo;
    const query = `SELECT emp_id, ad_memberships, active, department, division from amd.employee_main where email_city = '${decodedEmail}'`;
    return pool.query(query)
    .then(eres => {
      if (eres.rows.length > 0) {
        const employee = eres.rows[0];
        if (employee.active !== 'A') {
          logger.warn(`Non-active employee ${decodedEmail} login attempt`);
          return userInfo;
        }
        userInfo.employee = {
          employee_id: employee.emp_id,
          department: employee.department,
          division: employee.division,
          groups: employee.ad_memberships.split(','),
        };
        return userInfo;
      }
      logger.error(`Unable to match employee by email ${decodedEmail}`);
      throw new Error('Unable to find employee by email.');
    })
    .catch(error => {
      logger.error(`Error on employee lookup: ${error}`);
      return userInfo;
    });
  }).catch((error) => {
    if (req.headers.authorization !== 'null') {
      logger.error(`Error decoding authentication token: ${error}`);
    }
    return userInfo;
  });
}

module.exports = coaWebLogin;
