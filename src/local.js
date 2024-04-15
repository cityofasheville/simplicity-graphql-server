
import { startStandaloneServer } from '@apollo/server/standalone'; 
import { 
  server,
  pool,
} from "./app.js";

(async () => {
  try {
    const GRAPHQL_PORT = 8080;

    const { url } = await startStandaloneServer(server, {
      context: () => {
        return {
          pool,
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