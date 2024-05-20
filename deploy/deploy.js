// This script sets up the "build" directory structure for deployment to AWS Lambda
import { promises as fs } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

try {
  // Running dev or prod?
  if (process.argv.length === 2) {
    console.error('Usage: npm run deploy prod|dev');
    process.exit(1);
  }
  let args = process.argv.slice(2);
  let deployType = args[0]; // prod or dev

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
    console.error('Usage: npm run deploy prod|dev');
    process.exit(1);
  }
  const __dirname = dirname(fileURLToPath(import.meta.url)); // current directory

  // create empty build dir
  await fs.rm('./' + buildDir, { force: true, recursive: true });
  await fs.mkdir('./' + buildDir, { force: true, recursive: true });

  // copy all deploy files to build dir
  let filelist = await fs.readdir(__dirname);
  filelist = filelist
    .filter(file => file !== 'deploy.js' && file !== 'destroy.js' && file !== 'build');
  for (const file of filelist) {
    await fs.copyFile(file, './' + buildDir + '/' + file);
  };

  // Substitute Lambda name in Terraform files
  let terraformFiles = await fs.readdir(`${buildDir}`);
  terraformFiles = terraformFiles
    .filter(file => file.endsWith('.tf'));
  for (const file of terraformFiles) {
    let data = await fs.readFile(`${buildDir}/` + file, 'utf8');
    let result = data.replace(/\$\{prog_name\}/g, lambdaName);
    await fs.writeFile(`${buildDir}/` + file, result, 'utf8');
  };

  // Copy files into "nodejs" and "funcdir" subdirectories for zip files
  await fs.mkdir(`${buildDir}/nodejs`);
  await fs.copyFile('../package.json', `${buildDir}/nodejs/package.json`);
  await fs.copyFile('../package-lock.json', `${buildDir}/nodejs/package-lock.json`);

  // // OR FOR PYTHON: Copy files into "python" and "funcdir" subdirectories for zip files
  // await fs.copyFile('../src/requirements.txt', `${buildDir}/requirements.txt`);
  // execSync(`cd ${buildDir}/ && ls && sam build --use-container`);
  // await fs.mkdir(`${buildDir}/python`);
  // await fs.mkdir(`${buildDir}/python/python`);
  // await fs.rename(`${buildDir}/.aws-sam/build/ftppy/`, `${buildDir}/python/python/`, { recursive: true });

  await fs.mkdir(`${buildDir}/funcdir`);
  await fs.cp('../src/', `${buildDir}/funcdir/`, { recursive: true });
  await fs.copyFile('../package.json', `${buildDir}/funcdir/package.json`);

  execSync(`npm install --prefix ${buildDir}/nodejs --omit-dev`, { stdio: 'inherit' });
  execSync(`cd ${buildDir} && terraform init && terraform apply -auto-approve -var-file=../../../.env`, { stdio: 'inherit' });

}
catch (err) {
  console.log(err);
}
