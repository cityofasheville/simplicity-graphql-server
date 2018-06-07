const express = require('express');
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const coaWebLogin = require('./coa_web_login');
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
  const config = {
    schema: executableSchema,
    context: {
      pool,
      logger,
      user: null,
      employee: null,
    },
  };
  return coaWebLogin(pool, logger, req)
  .then(userInfo => {
    config.user = userInfo.user;
    config.employee = userInfo.employee;
    return config;
  })
  .catch(error => {
    logger.error(error);
    return config;
  });
}));

graphQLServer.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}));
logger.info(`Start listening on port ${GRAPHQL_PORT}`);

graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `SimpliCity: GraphQL Server is now running on host/${GRAPHQL_PORT}/graphql`
));

