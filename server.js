const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const Logger = require('coa-node-logging');
require('dotenv').config();
const pg = require('pg');
const Pool = pg.Pool;
const mssql = require('mssql');

// const typeDefs = `type Query {
//   numberSix: Int! # Should always return the number 6 when queried
//   numberSeven: Int! # Should always return 7
// }`
// const resolvers = {
//   Query: {
//     numberSix() {
//       return 6;
//     },
//     numberSeven() {
//       return 7;
//     },
//   },
// };

pg.defaults.poolSize = 1;
const logFile = process.env.logfile ? process.env.logfile : null;
const logger = new Logger('simplicity', logFile);

// PLAYGROUND
let debug = true;

let introspection = false;
let playground = false;
if (debug) {
  introspection = true;
  playground = true;
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection,
  playground,
});

const dbConfig = {
  host: process.env.dbhost,
  user: process.env.dbuser,
  password: process.env.dbpassword,
  database: process.env.database,
  port: 5432,
  ssl: false,
};
const dbConfig_accela = {
  user: process.env.dbuser_accela,
  password: process.env.dbpassword_accela,
  server: process.env.dbhost_accela,
  domain: process.env.dbdomain_accela,
  database: process.env.database_accela,
  options: { enableArithAbort: true },
  connectionTimeout: 30000,
  requestTimeout: 680000,
  trustServerCertificate: true,  // Acella has self-signed certs?
};

(async () => {
  logger.info('Connect to database');
  console.log('Connect connection initialized');
  const pool = new Pool(dbConfig);
  const pool_accela = await mssql.connect(dbConfig_accela);


  logger.info('Database connection initialized');

  const GRAPHQL_PORT = process.env.PORT || 8080;

  const { url } = await startStandaloneServer(server, {
    context: () => {
      return {
        pool,
        pool_accela,
        logger,
        user: null,
        employee: null,
      }
    },
    listen: { port: GRAPHQL_PORT },
  });

  console.log(`SimpliCity: GraphQL Server is now running on ${url}`);
})();