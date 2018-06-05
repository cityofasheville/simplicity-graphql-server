const express = require('express');
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const bodyParser = require('body-parser');
const cors = require('cors');
const Logger = require('coa-node-logging');
require('dotenv').config();
const pg = require('pg');
const Pool = pg.Pool;

pg.defaults.poolSize = 1;
const logFile = process.env.logfile ? process.env.logfile : null;
const logger = new Logger('simplicity', logFile);
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
// Import Firebase - for now (8/25/16), the use of require and import of individual
// submodules is needed to avoid problems with webpack (import seems to require
// beta version of webpack 2).
const firebase = require('firebase');
logger.info('Initialize firebase');
firebase.initializeApp({
  serviceAccount: './SimpliCityII-284f9d0ebb83.json',
  databaseURL: 'https://simplicityii-878be.firebaseio.com',
});
logger.info('Firebase initialized');

const dbConfig = {
  host: process.env.dbhost,
  user: process.env.dbuser,
  password: process.env.dbpassword,
  database: process.env.database,
  port: 5432,
  ssl: false,
};

logger.info('Connect to database');

const pool = new Pool(dbConfig);
logger.info('Database connection initialized');

const GRAPHQL_PORT = process.env.PORT || 8080;

const graphQLServer = express();
graphQLServer.use('*', cors());
graphQLServer.use((req, res, next) => {
  // This is middleware in prep for new authentication
  // console.log('I am in this middleware');
  return next();
});
graphQLServer.use(bodyParser.json());
logger.info('Initialize graphql server');

graphQLServer.use('/graphql', graphqlExpress((req, res) => {
  const baseConfig = {
    schema: executableSchema,
    context: {
      pool,
      logger,
      loggedin: false,
      token: null,
      uid: null,
      name: null,
      email: null,
      employee_id: 0,
      department: null,
      division: null,
      groups: [],
    },
  };
  logger.info('New client connection');
  if (!req.headers.authorization || req.headers.authorization === 'null') {
    return baseConfig;
  }
  logger.info('Attempt login verification');
  return firebase.auth().verifyIdToken(req.headers.authorization).then((decodedToken) => {
    logger.info(`Logging in ${decodedToken.email}`);
    const decodedEmail = decodedToken.email.toLowerCase();
    const query = `SELECT emp_id, ad_memberships from amd.ad_info where email_city = '${decodedEmail}'`;
    if (!decodedEmail.endsWith('@ashevillenc.gov')) return baseConfig;
    return pool.query(query)
    .then(eres => {
      if (eres.rows.length > 0) {
        const employee = eres.rows[0];
        const config = {
          schema: executableSchema,
          context: {
            pool,
            logger,
            loggedin: true,
            token: req.headers.authorization,
            uid: decodedToken.uid,
            name: decodedToken.name,
            email: decodedToken.email,
            employee_id: employee.emp_id,
            department: null,
            division: null,
            groups: employee.ad_memberships.split(','),
          },
        };
        return config;
      }
      logger.error(`Unable to match employee by email ${decodedEmail}`);
      throw new Error('Unable to find employee by email.');
    })
    .catch(error => {
      logger.error(`Error on employee lookup: ${error}`);
    });
  }).catch((error) => {
    if (req.headers.authorization !== 'null') {
      logger.error(`Error decoding authentication token: ${error}`);
    }
    return baseConfig;
  });
}));

graphQLServer.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}));
logger.info(`Start listening on port ${GRAPHQL_PORT}`);

graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `SimpliCity: GraphQL Server is now running on host/${GRAPHQL_PORT}/graphql`
));

