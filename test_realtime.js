
require('dotenv').config();
const pg = require('pg');
const Pool = pg.Pool;
const mssql = require('mssql');

const resolvers = require("./api/realtime/realtime_resolvers")
pg.defaults.poolSize = 1;

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
    const pool_accela = await mssql.connect(dbConfig_accela);
    const context = {
      logger: null,
      pool,
      pool_accela

    }
    const x = await resolvers.Query.permit_realtime(null, args, context)
    console.log(x)
  }catch(err){console.log(err)}
}

startApolloServer()
