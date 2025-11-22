import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

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
    }

    async sendBatchZip(zipBuffer: Buffer, zipName: string) {
        const adminEmail = this.configService.get<string>('ADMIN_EMAIL');

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
}
