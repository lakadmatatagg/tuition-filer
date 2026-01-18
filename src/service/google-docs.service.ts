import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { JWT, GoogleAuth } from 'google-auth-library';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class GoogleDocsService {
    private readonly logger = new Logger(GoogleDocsService.name);
    private auth: GoogleAuth;
    private readonly isProd: boolean;
    private readonly gotenbergUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.isProd = this.configService.get<string>('PRODUCTION') === 'true';
        this.auth = new GoogleAuth({
            keyFile: this.isProd
                ? undefined
                : path.resolve(
                      __dirname,
                      '../../auth/tigasatutiga-439419-8f706d892fc7.json',
                  ),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        this.gotenbergUrl = this.configService.get<string>('GOTENBURG_URL')!;
        if (!this.gotenbergUrl) {
            this.logger.error('GOTENBURG_URL is not defined');
        }
        this.logger.log(`Loaded Gotenburg URL: ${this.gotenbergUrl}`);
    }

    async convertDocxBufferToPdf(buffer: Buffer): Promise<Buffer> {
        const authClient = (await this.auth.getClient()) as JWT;
        const drive: drive_v3.Drive = google.drive({
            version: 'v3',
            auth: authClient,
        });

        // 1. Upload DOCX buffer to Google Drive
        const fileMetadata = {
            name: `temp-${randomUUID()}.docx`,
            mimeType: 'application/vnd.google-apps.document',
        };

        const media = {
            mimeType:
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            body: Readable.from(buffer),
        };

        const uploadRes = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: 'id',
        });

        const fileId = uploadRes.data.id!;

        // 2. Export the uploaded file to PDF
        const pdfRes = await drive.files.export(
            {
                fileId,
                mimeType: 'application/pdf',
            },
            { responseType: 'arraybuffer' },
        );

        // 3. Delete the temporary DOCX from Drive
        // await drive.files.delete({ fileId });

        return Buffer.from(pdfRes.data as ArrayBuffer);
    }

    async docxToPdfBuffer(docxBuffer: Buffer) {
        const form = new FormData();

        form.append('files', docxBuffer, {
            filename: 'input.docx',
            contentType:
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const res = await axios.post(
            this.gotenbergUrl + '/forms/libreoffice/convert',
            form,
            {
                headers: form.getHeaders(),
                responseType: 'arraybuffer', // 🔑 IMPORTANT
                timeout: 120000,
            },
        );

        return Buffer.from(res.data);
    }
}
