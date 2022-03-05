const strapi = require('@strapi/satrapi');
const { SecretsManager } = require('@aws-sdk/client-secrets-manager');

(async () => {
  const secretsManager = new SecretsManager({});
  const [credsOutput, jwtSecretOutput, appKeysOutput] = await Promise.all([
    secretsManager.getSecretValue({
      SecretId: process.env.CREDS_SECRET_ARN
    }),
    secretsManager.getSecretValue({
      SecretId: process.env.JWT_SECRET_ARN
    }),
    secretsManager.getSecretValue({
      SecretId: process.env.APP_KEYS_SECRET_ARN
    })
  ]);
  const creds = JSON.parse(credsOutput.SecretString);
  const { SecretString: appKeyLong } = appKeysOutput;

  if (appKeysOutput.SecretString.length !== 88) {
    throw Error('app key long str must be 88 characters');
  }

  const appKeys = [
    `${appKeyLong.substring(0, 22)}==`,
    `${appKeyLong.substring(22, 44)}==`,
    `${appKeyLong.substring(44, 66)}==`,
    `${appKeyLong.substring(66, 88)}==`,
  ].join(',');

  process.env['DATABASE_HOST'] = creds.host;
  process.env['DATABASE_PORT'] = `${creds.port}`;
  process.env['DATABASE_NAME'] = creds.dbname;
  process.env['DATABASE_USERNAME'] = creds.username;
  process.env['DATABASE_PASSWORD'] = creds.password;
  process.env['ADMIN_JWT_SECRET'] = jwtSecretOutput.SecretString;
  process.env['APP_KEYS'] = appKeys;

  await strapi().start();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
