import { Environment, StackProps } from 'aws-cdk-lib/core'

/**
 * Create a file named config.ts and export a default value
 * with this interface as the type
 */
export interface InfrastructureStackProps extends StackProps {
  env: Environment;
  domainName: string;
  subdomain: string;
  certificateArn: string;
  logGroupName: string;
}
