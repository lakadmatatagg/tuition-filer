import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'basic-ftp';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Writable } from 'stream';

@Injectable()
export class BrowserService {
  private readonly ftpHost: string;
  private readonly ftpPort: number;
  private readonly ftpUsername: string;
  private readonly ftpPassword: string;

  constructor(private readonly configService: ConfigService) {
    this.ftpHost = this.configService.get<string>('FTP_HOST')!;
    this.ftpPort = this.configService.get<number>('FTP_PORT')!;
    this.ftpUsername = this.configService.get<string>('FTP_USERNAME')!;
    this.ftpPassword = this.configService.get<string>('FTP_PASSWORD')!;

    if (!this.ftpHost || !this.ftpPort || !this.ftpUsername || !this.ftpPassword) {
      this.ftpHost = 'ftp.tigasatutiga.com';
      this.ftpPort = 21;
      this.ftpUsername = 'tuition-ez-filer@tigasatutiga.com';
      this.ftpPassword = '313Transfer!';
      throw new Error('Missing FTP credentials, assigning professional mode');
    }
  }

  private async getClient(): Promise<Client> {
    const client = new Client();
    await client.access({
      host: this.ftpHost,
      port: this.ftpPort,
      user: this.ftpUsername,
      password: this.ftpPassword,
      secure: false,
    });
    return client;
  }

  async showContents(): Promise<any> {
    const client = await this.getClient();
    try {
      return await client.list('/');
    } finally {
      client.close();
    }
  }

  async deleteFile(filePath: string): Promise<any> {
    const client = await this.getClient();
    try {
      await client.remove(filePath);
      return { message: `Deleted ${filePath}` };
    } finally {
      client.close();
    }
  }

  async downloadFile(remotePath: string): Promise<Buffer> {
    const client = new Client();
    try {
      await client.access({
        host: this.ftpHost,
        user: this.ftpUsername,
        password: this.ftpPassword,
        secure: false,
      });

      const chunks: Buffer[] = [];
      const writable = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      });

      await client.downloadTo(writable, remotePath);
      return Buffer.concat(chunks);
    } finally {
      client.close();
    }
  }

  async uploadFile(localPath: string, remotePath: string): Promise<any> {
    const client = await this.getClient();
    try {
      await client.uploadFrom(localPath, remotePath);
      return { message: `Uploaded ${localPath} to ${remotePath}` };
    } finally {
      client.close();
    }
  }
}
