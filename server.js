import express from 'express';
import { apolloExpress, graphiqlExpress } from 'apollo-server';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
var pg = require('pg');
const Pool = pg.Pool;

import { subscriptionManager } from './data/subscriptions';
import schema from './data/schema';

// Import Firebase - for now (8/25/16), the use of require and import of individual
// submodules is needed to avoid problems with webpack (import seems to require
// beta version of webpack 2).
const firebase = require('firebase');

firebase.initializeApp({
  serviceAccount: "./SimpliCityII-284f9d0ebb83.json",
  databaseURL: "https://simplicityii-878be.firebaseio.com"
});

var dbConfig = {
  host: 'ec2-54-235-65-139.compute-1.amazonaws.com',
  user: 'jluztmsoizdhar',
  password: 'bWkhrp2UQSX2bJGcH4Zzgy_PY1',
  database: 'd324d1u5enjpd',
  ssl: true
};

var pool = new Pool(dbConfig);

const GRAPHQL_PORT = 8080;
const WS_PORT = 8090;

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
graphQLServer.use('/graphql', bodyParser.json(), apolloExpress( (req, res) => {
  if (!req.headers.authorization) {
    return {
      schema,
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
  return firebase.auth().verifyIdToken(req.headers.authorization).then (function (decodedToken) {
    return {
      schema,
      context: {
        pool,
        loggedin: true,
        token: req.headers.authorization,
        uid: decodedToken.uid,
        name: decodedToken.name,
        email: decodedToken.email,
      },
    };
  }).catch (function(error) {
    console.log("Error decoding firebase token: " + JSON.stringify(error));
    return {
      schema,
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
