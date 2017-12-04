const express = require('express');
const { apolloExpress, graphiqlExpress } = require('apollo-server');
const { makeExecutableSchema } = require('graphql-tools');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const pg = require('pg');
const Pool = pg.Pool;

pg.defaults.poolSize = 1;
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
firebase.initializeApp({
  serviceAccount: './SimpliCityII-284f9d0ebb83.json',
  databaseURL: 'https://simplicityii-878be.firebaseio.com',
});

const dbConfig = {
  host: process.env.dbhost,
  user: process.env.dbuser,
  password: process.env.dbpassword,
  database: process.env.database,
  port: 5432,
  ssl: false,
};

const pool = new Pool(dbConfig);

const GRAPHQL_PORT = process.env.PORT || 8080;
console.log(`The graphql port is ${GRAPHQL_PORT}`);
const graphQLServer = express().use('*', cors());

graphQLServer.use('/graphql', bodyParser.json(), apolloExpress((req, res) => {
  if (!req.headers.authorization || req.headers.authorization === 'null') {
    return {
      schema: executableSchema,
      context: {
        pool,
        loggedin: false,
        token: null,
        uid: null,
        name: null,
        email: null,
      },
    };
  }
  return firebase.auth().verifyIdToken(req.headers.authorization).then((decodedToken) => {
    console.log('auth-verify');
    return {
      schema: executableSchema,
      context: {
        pool,
        loggedin: true,
        token: req.headers.authorization,
        uid: decodedToken.uid,
        name: decodedToken.name,
        email: decodedToken.email,
      },
    };
  }).catch((error) => {
    if (req.headers.authorization !== 'null') {
      console.log(`Error decoding firebase token: ${JSON.stringify(error)}`);
    }
    return {
      schema: executableSchema,
      context: {
        pool,
        loggedin: false,
        token: null,
        uid: null,
        name: null,
        email: null,
      },
    };
  });
}));

graphQLServer.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}));

graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphql`
));

// Killing the subscription server for now.
/*
// WebSocket server for subscriptions
const websocketServer = createServer((request, response) => {
  response.writeHead(404);
  response.end();
});

websocketServer.listen(WS_PORT, () => console.log( // eslint-disable-line no-console
  `Websocket Server is now running on http://localhost:${WS_PORT}`
));


// eslint-disable-next-line
new SubscriptionServer(
  { subscriptionManager },
  websocketServer
);
*/
