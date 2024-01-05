import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const region = 'us-east-1';

async function get_connection(secretName) {
  const client = new SecretsManagerClient({
    region,
  });

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    })
  );

  const secret = response.SecretString;
  return (JSON.parse(secret));
}

export default get_connection;
