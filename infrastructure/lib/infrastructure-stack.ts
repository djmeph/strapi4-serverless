import { Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { InstanceType, IVpc, NatProvider, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AuroraMysqlEngineVersion, DatabaseClusterEngine, ServerlessCluster } from 'aws-cdk-lib/aws-rds';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { InfrastructureStackProps } from './infrastructure-interface';


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
}
