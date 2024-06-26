import typeDefs from './schema.js';
import resolvers from './resolvers.js';

import { ApolloServer } from '@apollo/server';

import pgpkg from 'pg';
const { Pool } = pgpkg;

// PLAYGROUND
let debug = false;
if(process.env.debug === 'true') {
  debug = true;
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: debug,
  playground: debug,
});
const dbConfig = {
  host: process.env.runlocal==="true"?"localhost":process.env.dbhost,
  user: process.env.dbuser,
  password: process.env.dbpassword,
  database: process.env.database,
  port: 5432,
  ssl: false,
  max: 1
};

console.info('Connect to database');
const pool = new Pool(dbConfig);

export { 
  server,
  pool,
}