import typeDefs from './schema.js';
import resolvers from './resolvers.js';

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone'; 
import "dotenv/config.js";

import pgpkg from 'pg';
const { Pool, defaults } = pgpkg;

import mssqlpkg from 'mssql';
const { connect } = mssqlpkg;

defaults.poolSize = 1;

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
  options: { enableArithAbort: true,  encrypt: false },
  connectionTimeout: 30000,
  requestTimeout: 680000,
  trustServerCertificate: true,  // Acella has self-signed certs?
};

(async () => {
  try {
    console.info('Connect to database');
    const pool = new Pool(dbConfig);
    const pool_accela = await connect(dbConfig_accela);

    console.info('Database connection initialized');

    const GRAPHQL_PORT = process.env.PORT || 8080;

    const { url } = await startStandaloneServer(server, {
      context: () => {
        return {
          pool,
          pool_accela,
          user: null,
          employee: null,
        }
      },
      listen: { port: GRAPHQL_PORT },
    });
    console.log(`SimpliCity: GraphQL Server is now running on ${url}`);
  }  catch (err) {
    console.log(err);
  }
})();