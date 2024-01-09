import typeDefs from './schema.js';
import resolvers from './resolvers.js';

import { ApolloServer } from '@apollo/server';
import {
  startServerAndCreateLambdaHandler,
  handlers,
} from '@as-integrations/aws-lambda';
import Logger from './logger.js';

import pgpkg from 'pg';
const { Pool, defaults } = pgpkg;

import mssqlpkg from 'mssql';
const { connect } = mssqlpkg;

// import get_connection from './api/common/get_connection.js';

// const db_connection = await get_connection('pubrecdb1/mdastore1/dbadmin');
// const db_connection_accela = await get_connection('coa-acceladb/accela/mssqlgisadmin');

defaults.poolSize = 1;
const logger = new Logger('simplicity');

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

// const dbConfig = {
//   host: db_connection.host,
//   user: db_connection.username,
//   password: db_connection.password,
//   database: db_connection.database,
//   port: db_connection.port,
//   ssl: false,
// };
// const dbConfig_accela = {
//   user: db_connection_accela.username,
//   password: db_connection_accela.password,
//   server: db_connection_accela.host,
//   domain: db_connection_accela.domain,
//   database: db_connection_accela.database,
//   options: { enableArithAbort: true, encrypt: false },
//   connectionTimeout: 30000,
//   requestTimeout: 680000,
//   trustServerCertificate: true,  // Acella has self-signed certs?
// };

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
  options: { enableArithAbort: true,  encrypt: false },
  connectionTimeout: 30000,
  requestTimeout: 680000,
  trustServerCertificate: true,  // Acella has self-signed certs?
};


logger.info('Connect to database');
const pool = new Pool(dbConfig);
const pool_accela = await connect(dbConfig_accela);

logger.info('Database connection initialized');

export default startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async ({ event }) => {
      return {
        pool,
        pool_accela,
        logger,
        user: null,
        employee: null,
      };
    },
  },
);
console.log(`SimpliCity: GraphQL Server is now running`);

