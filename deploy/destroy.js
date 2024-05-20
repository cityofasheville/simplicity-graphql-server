// This script removes all AWS resources
import { promises as fs } from 'fs';
import { execSync } from 'child_process';

try {
  // Running dev or prod?
  if (process.argv.length === 2) {
    console.error('Usage: npm run destroy prod|dev');
    process.exit(1);
  }
  let args = process.argv.slice(2);
  let deployType = args[0];

  let buildDir = 'build/';

  // get Lambda name from .env variables
  let env = await fs.readFile('../.env', 'utf8');
  let lambdaName;
  if (deployType === 'prod') {
    lambdaName = env.split('\n').find(line => line.startsWith('production_name')).split('=')[1].replace(/"| /g, '');
    buildDir += deployType;
  } else if (deployType === 'dev') {
    lambdaName = env.split('\n').find(line => line.startsWith('development_name')).split('=')[1].replace(/"| /g, '');
    buildDir += deployType;
  } else {
    console.error('Usage: npm run destroy prod|dev');
    process.exit(1);
  }

  execSync(`cd ${buildDir} && terraform init && terraform destroy -auto-approve -var-file=../../../.env`, { stdio: 'inherit' });
}
catch (err) {
  console.log(err);
}
