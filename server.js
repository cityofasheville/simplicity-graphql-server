const express = require('express');
// const { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
const { ApolloServer, gql } = require('apollo-server-express');
// const { makeExecutableSchema } = require('graphql-tools');
const cors = require('cors');
const Logger = require('coa-node-logging');
require('dotenv').config();
const pg = require('pg');
const Pool = pg.Pool;

pg.defaults.poolSize = 1;
const logFile = process.env.logfile ? process.env.logfile : null;
const logger = new Logger('simplicity', logFile);
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
// const executableSchema = makeExecutableSchema({
//   typeDefs,
//   resolvers,
// });

const dbConfig = {
  host: process.env.dbhost,
  user: process.env.dbuser,
  password: process.env.dbpassword,
  database: process.env.database,
  port: 5432,
  ssl: false,
};

async function startApolloServer() {
  logger.info('Connect to database');

  const pool = new Pool(dbConfig);
  logger.info('Database connection initialized');

  const GRAPHQL_PORT = process.env.PORT || 8080;
  ////////////////
  const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: {
        pool,
        logger,
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
  console.log(`SimpliCity: GraphQL Server is now running on localhost/${GRAPHQL_PORT}/graphql`);
  return { server, app };
  ////////////////


  // const graphQLServer = express();
  // graphQLServer.use('*', cors());
  // graphQLServer.use((req, res, next) => {
  //   // This is middleware in prep for new authentication
  //   // console.log('I am in this middleware');
  //   return next();
  // });
  // graphQLServer.use(express.json());
  // logger.info('Initialize graphql server');

  // graphQLServer.use('/graphql', graphqlExpress((req, res) => {
  //   const config = {
  //     schema: executableSchema,
  //     context: {
  //       pool,
  //       logger,
  //       user: null,
  //       employee: null,
  //     },
  //   };
  //   return config;
  // }));

  // // graphQLServer.use('/graphiql', graphiqlExpress({
  // //   endpointURL: '/graphql',
  // // }));
  // logger.info(`Start listening on port ${GRAPHQL_PORT}`);

  // graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  //   `SimpliCity: GraphQL Server is now running on host/${GRAPHQL_PORT}/graphql`
  // ));
}

startApolloServer()
