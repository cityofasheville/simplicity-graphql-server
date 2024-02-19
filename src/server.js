import {
  startServerAndCreateLambdaHandler,
  handlers,
} from '@as-integrations/aws-lambda';
import { 
  server,
  pool,
  pool_accela
} from "./set_up_server.js";

export default startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async ({ event }) => {
      console.log("request: ", event.body);
      return {
        pool,
        pool_accela,
        user: null,
        employee: null,
      };
    },
  },
);
console.log(`SimpliCity: GraphQL Server is now running`);

