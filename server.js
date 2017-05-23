const express = require('express');
const { apolloExpress, graphiqlExpress } = require('apollo-server');
const { makeExecutableSchema } = require('graphql-tools');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const pg = require('pg');
const Pool = pg.Pool;

const Groups = require('./data/groups');
const MySimpliCity = require('./data/mysimplicity');
console.log('Build the schema');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
console.log('Done');
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

// Decoded token: {
//   "iss":"https://securetoken.google.com/simplicityii-878be",
//   "name":"Eric Jackson",
//   "picture":"https://lh3.googleusercontent.com/-YfuE6u4uQpE/AAAAAAAAAAI/AAAAAAAAAI8/aMN1TtvIV_I/s96-c/photo.jpg",
//   "aud":"simplicityii-878be",
//   "auth_time":1475009898,
//   "user_id":"B9ewtFNqm0a9yOu2ljdHSEwkRS92",
//   "sub":"B9ewtFNqm0a9yOu2ljdHSEwkRS92",
//   "iat":1476205771,
//   "exp":1476209371,
//   "email":"eric@deepweave.com",
//   "email_verified":true,
//   "firebase":{
//     "identities":{
//       "google.com":["113759490376150867470"],
//       "email":["eric@deepweave.com"]
//     },
//     "sign_in_provider":"google.com"
//   },
//   "uid":"B9ewtFNqm0a9yOu2ljdHSEwkRS92"
// }

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
        groups: [],
        subscriptions: null,
      },
    };
  }
  return firebase.auth().verifyIdToken(req.headers.authorization).then((decodedToken) => {
    const groups = Groups.getGroupsByEmail(decodedToken.email);
    const ss = MySimpliCity.getSubscriptions(decodedToken.email, groups);
    const subscriptions = JSON.stringify(ss);
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
        groups,
        subscriptions,
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
        groups: [],
        subscriptions: null,
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
