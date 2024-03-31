import * as archiver from 'archiver';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaServiceV2 } from '../prisma/prismav2.service';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

function generateRandomKey(length: number) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    key += characters[randomIndex];
  }
  return key;
}

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaServiceV2,
    private config: ConfigService,
  ) {}
  async create(
    org_id: string,
    policy_id: string,
    type: 'CLAIM' | 'NORMAL' = 'CLAIM',
    status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE',
  ) {
    const newCertificate = await this.prisma.certificates.create({
      data: {
        status,
        organization: {
          connect: {
            id: org_id,
          },
        },
        policies: {
          connect: {
            id: policy_id,
          },
        },
        type,
      },
    });

    if (type === 'CLAIM')
      await this.generatePrivateKeyAndCSR(
        'claim',
        `claim_${newCertificate.id}`,
        org_id,
        policy_id,
        generateRandomKey(10),
        newCertificate.id,
      );

    return newCertificate.id;
  }

  async certificateExists(id: string) {
    const certificate = await this.prisma.certificates.findUnique({
      where: {
        id,
      },
    });

    if (!certificate) {
      return false;
    }

    return true;
  }

  async findAll(org_id: string) {
    return await this.prisma.certificates.findMany({
      where: {
        organizationId: org_id,
      },
    });
  }

  async findOne(id: string, org_id: string) {
    return await this.prisma.certificates.findUnique({
      where: {
        id,
        organizationId: org_id,
      },
      include: {
        devices: {
          select: {
            id: true,
            name: true,
          },
        },
        policies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateCertificateDto: UpdateCertificateDto,
    org_id: string,
  ) {
    await this.prisma.certificates.update({
      where: {
        id,
        organizationId: org_id,
      },
      data: {
        devices: {
          connect: updateCertificateDto.devices.map((device) => ({
            id: device,
          })),
        },
        policies: {
          connect: {
            id: updateCertificateDto.policy,
          },
        },
      },
    });

    return 'Certificate updated';
  }

  async remove(id: string, org_id: string) {
    return await this.prisma.certificates.delete({
      where: {
        id,
        organizationId: org_id,
      },
    });
  }

  generatePrivateKeyAndCSR(
    device_name: string,
    device_id: string,
    organization_id: string,
    policy_id: string,
    passphrase: string,
    certificate_id: string,
  ) {
    return new Promise((resolve, reject) => {
      // create a new directory for the certificate
      const mkdirProcess = spawn('mkdir', [`./generated/${certificate_id}`]);
      mkdirProcess.on('exit', (mkdirCode) => {
        if (mkdirCode === 0 || mkdirCode === 1) {
          // 0: success, 1: directory already exists
          // const passOptions =
          //   device_name === 'claim'
          //     ? ['-nodes']
          //     : ['-passout', `pass:${passphrase}`];
          const requestProcess = spawn('openssl', [
            'req',
            '-newkey',
            'rsa:2048',
            '-keyout',
            `./generated/${certificate_id}/${device_name}-private-key.pem`,
            '-out',
            `./generated/${certificate_id}/${device_name}-csr.pem`,
            '-subj',
            `/CN=${device_id}/OU=${policy_id}/O=${organization_id}`,
            '-nodes',
          ]);

          // requestProcess.stdout.on('data', (data) => {
          //   console.log(`openssl stdout: ${data}`);
          // });
          // requestProcess.stderr.on('data', (data) => {
          //   console.error(`openssl stderr: ${data}`);
          // });

          requestProcess.on('exit', (code) => {
            if (code != 0) {
              reject(new Error('Error generating CSR'));
            } else {
              this.signPrivateKeyAndDeleteCSR(device_name, certificate_id)
                .then(() => resolve('Done generating'))
                .catch((error) => reject(error));
            }
          });
        } else {
          reject(new Error('Error creating directory'));
        }
      });
    });
  }

  private signPrivateKeyAndDeleteCSR(
    device_name: string,
    certificate_id: string,
  ) {
    return new Promise((resolve, reject) => {
      const signProcess = spawn('openssl', [
        'x509',
        '-req',
        '-in',
        `./generated/${certificate_id}/${device_name}-csr.pem`,
        '-CA',
        this.config.get<string>('CA_CERT_PATH'),
        '-CAkey',
        this.config.get<string>('CA_CERT_KEY'),
        '-CAcreateserial',
        '-out',
        `./generated/${certificate_id}/${device_name}-cert.crt`,
        '-days',
        '365',
        '-passin',
        `pass:${this.config.get<string>('CA_KEY_PASS')}`,
      ]);

      // Capture stdout and stderr
      // signProcess.stdout.on('data', (data) => {
      //   console.log(`openssl stdout: ${data}`);
      // });

      // signProcess.stderr.on('data', (data) => {
      //   console.error(`openssl stderr: ${data}`);
      // });

      signProcess.on('exit', (code) => {
        if (code === 0) {
          resolve('Certificate signed');
          //remove the csr file
          spawn('rm', [`./generated/${certificate_id}/${device_name}-csr.pem`]);
        } else {
          reject(new Error('Failed to sign certificate'));
        }
      });
    });
  }

  getFilesInString(certificate_id: string, device_name: string) {
    // Read the files
    const private_key = readFileSync(
      `./generated/${certificate_id}/${device_name}-private-key.pem`,
      'utf8',
    );

    const certificate = readFileSync(
      `./generated/${certificate_id}/${device_name}-cert.crt`,
      'utf8',
    );

    return {
      private_key,
      certificate,
    };
  }
}
