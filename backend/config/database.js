module.exports = ({ env }) => {
  const sslSelf = env.bool('DATABASE_SSL_SELF', false);
  return {
    connection: {
      client: 'mysql',
      connection: {
        host: env('DATABASE_HOST', '127.0.0.1'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: sslSelf ? {
          rejectUnauthorized: sslSelf, // For self-signed certificates
        } : false,
      },
      debug: false,
    },
  };
};
