module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'a84ce0cfc5cc8d4828f7538865e707f5'),
  },
});
