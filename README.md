# SimpliCity GraphQL Server

GraphQL backend Server for the SimpliCity system. 

## Usage
### Prerequisites
- Requires a file ```.env``` in the root directory based on ```env.example```.

### Commands
- Test Locally, run one: ```npm test``` (runs Lambda locally with test/sam_event.json as event)
- Test Locally: 
  - ```npm start``` To use Bastion Server set runlocal=true in .env
                    From the City network runlocal=false
- Deploy: 
  - ```npm run deploy```
- Destroy: (removes all objects from AWS)
  - ```npm run destroy```
- Clean:  (removes local temp files)
  - ```npm run clean```



### IMPORTANT DEPLOYMENT NOTES:
The Deploy/Destroy commands use the name of the active GitHub branch when creating AWS resources.
For example, if the active GitHub branch is "feature" and the name of the resource is "template", the resource is
named "template_feature". For API gateway domains, it's "feature-template.ashevillenc.gov". Production (or main) branches do not get a prefix/suffix.

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
CNAME d-xxxxxxxxx.execute-api.us-east-1.amazonaws.com
