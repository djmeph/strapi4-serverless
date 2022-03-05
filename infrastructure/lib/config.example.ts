import { InfrastructureStackProps } from "./infrastructure-interface";

export const config: InfrastructureStackProps = {
  env: {
    region: 'us-east-1',
    account: '000000000000',
  },
  domainName: 'example.com',
  subdomain: 'strapi4',
  certificateArn: 'arn:aws:acm:us-east-1:000000000000:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  logGroupName: 'strapi4-serverless'
};
