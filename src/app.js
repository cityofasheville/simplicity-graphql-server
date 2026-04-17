import typeDefs from './schema.js';
import resolvers from './resolvers.js';

import { ApolloServer } from '@apollo/server';

import pgpkg from 'pg';
const { Pool } = pgpkg;

// Set NODE_ENV based on debug flag
let debug = false;
if(process.env.debug === 'true') {
  debug = true;
  process.env.NODE_ENV = 'development';
} else {
  process.env.NODE_ENV = 'production';
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: debug,
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