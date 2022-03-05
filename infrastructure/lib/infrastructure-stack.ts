import { Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { InstanceType, IVpc, NatProvider, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ContainerImage, LogDrivers } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { AuroraMysqlEngineVersion, DatabaseClusterEngine, ServerlessCluster } from 'aws-cdk-lib/aws-rds';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { InfrastructureStackProps } from './infrastructure-interface';
import * as path from 'path';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';


const cidrBlocks = {
  vpcCidr: '10.11.0.0/16',
  publicSubnetACidr: '10.11.0.0/20',
  publicSubnetBCidr: '10.11.16.0/20',
  privateSubnetACidr: '10.11.32.0/20',
  privateSubnetBCidr: '10.11.48.0/20',
  isolatedSubnetACidr: '10.11.64.0/20',
  isolatedSubnetBCidr: '10.11.80.0/20',
};

export class InfrastructureStack extends Stack {
  vpc: IVpc;
  jwtSecret: Secret;
  appKeysSecret: Secret;
  assetsBucket: Bucket;
  dbCreds: ISecret;
  webBucket: Bucket;
  oai: OriginAccessIdentity;
  db: ServerlessCluster;
  certificate: ICertificate;
  domainZone: IHostedZone;
  service: ApplicationLoadBalancedFargateService;

  constructor(
    scope: Construct,
    id: string,
    private props: InfrastructureStackProps
  ) {
    super(scope, id, props);
    this.createVPC();
    this.createSecrets();
    this.createBuckets();
    this.createRdsDatabase();
    this.createCertificate();
    this.createHostedZone();
    this.createFargateContainer();
    this.createAccessPolicies();
  }

  private createVPC() {
    this.vpc = new Vpc(this, 'VPC', {
      maxAzs: 2,
      cidr: cidrBlocks.vpcCidr,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 20,
        },
        {
          name: 'private',
          subnetType: SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 20,
        },
        {
          name: 'isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 20,
        },
      ],
      natGatewayProvider: NatProvider.instance({
        instanceType: new InstanceType('t3.nano')
      }),
      natGateways: 1
    });
  }

  private createSecrets() {
    this.jwtSecret = new Secret(this, 'JwtSecret', {
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 20
      }
    });

    this.appKeysSecret = new Secret(this, 'AppKeysSecret', {
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 88
      }
    });
  }

  private createBuckets() {
    this.assetsBucket = new Bucket(this, 'AssetsBucket');
    this.webBucket = new Bucket(this, 'WebBucket');
    this.oai = new OriginAccessIdentity(this, 'OAI');
    this.webBucket.grantReadWrite(this.oai);
  }

  private createRdsDatabase() {
    const rdsSecurityGroup = new SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: this.vpc,
      description: 'Ingress access to RDS'
    });

    for (const cidr of Object.values(cidrBlocks)) {
      rdsSecurityGroup.addIngressRule(
        Peer.ipv4(cidr),
        Port.tcp(3306)
      )
    }

    this.db = new ServerlessCluster(this, 'RdsCluster', {
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_5_7_12
      }),
      defaultDatabaseName: 'strapi',
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [rdsSecurityGroup]
    });

    if (this.db.secret) {
      this.dbCreds = this.db.secret;
    }
  }

  private createCertificate() {
    this.certificate = Certificate.fromCertificateArn(
      this,
      'SSLCertificate',
      this.props.certificateArn
    );
  }

  private createHostedZone() {
    this.domainZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: this.props.domainName
    });
  }

  private createFargateContainer() {
    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: this.props.logGroupName,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const image = ContainerImage.fromAsset(
      path.join(__dirname, '../..', 'backend/docker')
    );

    this.service = new ApplicationLoadBalancedFargateService(
      this,
      'ApplicationLoadBalancedFargateService',
      {
        taskImageOptions: {
          image,
          environment: {
            NODE_ENV: 'production',
            JWT_SECRET_ARN: this.jwtSecret.secretArn,
            CREDS_SECRET_ARN: this.dbCreds.secretArn,
            APP_KEYS_SECRET_ARN: this.appKeysSecret.secretArn,
            AWS_BUCKET: this.assetsBucket.bucketName,
            PORT: '8080'
          },
          logDriver: LogDrivers.awsLogs({
            streamPrefix: this.props.subdomain,
            logGroup,
          }),
          containerPort: 8080,
        },
        vpc: this.vpc,
        taskSubnets: {
          subnetType: SubnetType.PUBLIC,
        },
        cpu: 512,
        memoryLimitMiB: 2048,
        desiredCount: 1,
        domainName: `${this.props.subdomain}.${this.props.domainName}`,
        domainZone: this.domainZone,
        certificate: this.certificate,
        assignPublicIp: true,
      }
    );
  }

  private createAccessPolicies() {
    const s3PolicyStatement = new PolicyStatement({
      actions: [
        's3:PutObject',
        's3:GetObjectAcl',
        's3:GetObject',
        's3:AbortMultipartUpload',
        's3:ListBucket',
        's3:DeleteObject',
        's3:PutObjectAcl',
        's3:GetObjectAcl',
        's3:PutObjectAcl'
      ],
      effect: Effect.ALLOW,
      resources: [
        this.assetsBucket.bucketArn,
        Fn.join('/', [this.assetsBucket.bucketArn, '*'])
      ],
    });

    const secretsPolicyStatement = new PolicyStatement({
      actions: [
        'secretsmanager:DescribeSecret',
        'secretsmanager:GetSecretValue',
        'secretsmanager:ListSecretVersionIds'
      ],
      effect: Effect.ALLOW,
      resources: [
        this.dbCreds.secretArn,
        this.jwtSecret.secretArn,
        this.appKeysSecret.secretArn,
      ],
    });

    this.service.taskDefinition.taskRole.addToPrincipalPolicy(secretsPolicyStatement);
    this.service.taskDefinition.taskRole.addToPrincipalPolicy(s3PolicyStatement);
  }
}
