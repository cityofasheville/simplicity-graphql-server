# SimpliCity GraphQL Server

GraphQL backend Server for the SimpliCity system. 

## Usage
### Prerequisites
- Requires a file ```.env``` in the root directory based on ```env.example```.

### Commands
- Test Locally: start server: ```npm start``` 
- Test Locally, run one: ```npm test``` (runs Lambda locally with test/sam_event.json as event)
- Deploy: ```npm run deploy```
- Destroy: ```npm run destroy``` (removes all objects from AWS)
- Clean: ```npm run clean``` (removes local temp files)



### IMPORTANT DEPLOYMENT NOTE:
The API Server requires a second Route (/{proxy+} OPTIONS) that points to a separate Lambda return_204_for_options.
This is not yet included in Terraform, but it is just a simple Lambda like this:
```
export const handler = async (event) => {
  const response = {
    statusCode: 204,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};
```
To hook up a domain name through Route53, point the CNAME to the "API Gateway domain name", which can be found under API Gateway/Custom Domain Names/(your domain name)/Configurations.
It looks like this:
CNAME d-zq9uc0z1tg.execute-api.us-east-1.amazonaws.com
