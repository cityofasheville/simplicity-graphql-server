import {
  startServerAndCreateLambdaHandler,
  handlers,
} from '@as-integrations/aws-lambda';
import { 
  server,
  pool,
} from "./app.js";

let handler = startServerAndCreateLambdaHandler(
    server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async ({ event }) => {
      console.log("request: ", event.body);
      return {
        pool,
        user: null,
        employee: null,
      };
    },
  },
);
console.log(`SimpliCity: GraphQL Server is now running`);
export { handler };

