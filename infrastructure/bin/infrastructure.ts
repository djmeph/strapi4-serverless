#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { config } from '../lib/config';

const app = new cdk.App();
new InfrastructureStack(app, 'Strapi4ServerlessStack', config);
