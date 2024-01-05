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

import get_connection from './api/common/get_connection.js';

const db_connection = await get_connection('pubrecdb1/mdastore1/dbadmin');
const db_connection_accela = await get_connection('coa-acceladb/accela/mssqlgisadmin');

defaults.poolSize = 1;
const logFile = db_connection.logfile ? db_connection.logfile : null;
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
  host: db_connection.host,
  user: db_connection.username,
  password: db_connection.password,
  database: db_connection.database,
  port: db_connection.port,
  ssl: false,
};
const dbConfig_accela = {
  user: db_connection_accela.username,
  password: db_connection_accela.password,
  server: db_connection_accela.host,
  domain: db_connection_accela.domain,
  database: db_connection_accela.database,
  options: { enableArithAbort: true, encrypt: false },
  connectionTimeout: 30000,
  requestTimeout: 680000,
  trustServerCertificate: true,  // Acella has self-signed certs?
};

logger.info('Connect to database');
const pool = new Pool(dbConfig);
const pool_accela = null; // await connect(dbConfig_accela); // await is needed, vscode complains

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

