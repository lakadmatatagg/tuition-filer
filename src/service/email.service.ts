import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SystemSettingInterface } from '../interface/system-setting.interface';
import axios from 'axios';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;
    private readonly springbootUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: this.configService.get<boolean>('SMTP_SECURE'),
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });

        this.springbootUrl = this.configService.get<string>('BACKEND_URL')!;
        if (!this.springbootUrl) {
            this.logger.error('BACKEND_URL is not defined');
        }
        this.logger.log(`Loaded Springboot URL: ${this.springbootUrl}`);
    }

    async sendBatchZip(zipBuffer: Buffer, zipName: string, adminEmail: string) {
        const mailOptions = {
            from: this.configService.get<string>('SMTP_FROM'),
            to: adminEmail,
            subject: `Batch Invoice ZIP - ${zipName}`,
            html: `
                <p>Hello Admin,</p>
                <p>Attached is the latest batch of invoices.</p>
                <p>Regards,<br>TuitionEZ System</p>
            `,
            attachments: [
                {
                    filename: zipName,
                    content: zipBuffer,
                    contentType: 'application/zip',
                },
            ],
        };

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const info = await this.transporter.sendMail(mailOptions);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            this.logger.log(`Batch ZIP sent to admin: ${info.messageId}`);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            this.logger.error('Failed to send batch ZIP', err.stack);
            throw err;
        }
    }

    async getAdminEmail(key: string): Promise<SystemSettingInterface> {
        const url = `${this.springbootUrl}/system-setting/by-key/${key}`;

        try {
            const response = await axios.get<SystemSettingInterface>(url);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch setting by key ${key}`, error);
            throw error;
        }
    }
}
