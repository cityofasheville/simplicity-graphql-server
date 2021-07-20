const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');

const cors = require('cors');
const Logger = require('coa-node-logging');
require('dotenv').config();
const pg = require('pg');
const Pool = pg.Pool;
const mssql = require('mssql');

pg.defaults.poolSize = 1;
const logFile = process.env.logfile ? process.env.logfile : null;
const logger = new Logger('simplicity', logFile);
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const gqlTypeDefs = gql`${typeDefs}`

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
}

async function startApolloServer() {
  logger.info('Connect to database');

  const pool = new Pool(dbConfig);
  const pool_accela = await mssql.connect(dbConfig_accela);

  logger.info('Database connection initialized');

  const GRAPHQL_PORT = process.env.PORT || 8080;
  ////////////////
  const server = new ApolloServer({ 
    typeDefs: gqlTypeDefs, 
    resolvers,
    context: {
        pool,
        pool_accela,
        logger,
        // introspection: true,
        // playground: true,
        user: null,
        employee: null,
    }
  });
  await server.start();

  const app = express();
  app.use('*', cors());
  app.use(express.json());

  logger.info('Initialize graphql server');
  
  server.applyMiddleware({ app });

  logger.info(`Start listening on port ${GRAPHQL_PORT}`);
  
  await new Promise(resolve => app.listen({ port: GRAPHQL_PORT }, resolve));
  console.log(`SimpliCity: GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphql`);
  return { server, app };
}

startApolloServer()
