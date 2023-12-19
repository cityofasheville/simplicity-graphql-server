
import "dotenv/config.js";
import pgpkg from 'pg';
const { Pool, defaults } = pgpkg;
import mssqlpkg from 'mssql';
const { connect } = mssqlpkg;

import realtimeResolvers from "../api/development/realtime_resolvers.js";
const { Query } = realtimeResolvers;

defaults.poolSize = 1;

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
  try{
    const args = {
      permit_num: '21-05505',
    }
    const pool = new Pool(dbConfig);
    const pool_accela = await connect(dbConfig_accela);
    const context = {
      logger: null,
      pool,
      pool_accela
    }
    console.log("context",context)
    const x = await Query.permit_realtime(null, args, context)
    console.log(x)
  }catch(err){console.log(err)}
}

startApolloServer()
