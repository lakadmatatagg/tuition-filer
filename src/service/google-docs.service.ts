import { Injectable } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { JWT, GoogleAuth } from 'google-auth-library';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class GoogleDocsService {
    private auth: GoogleAuth;

    constructor() {
        this.auth = new GoogleAuth({
            keyFile: path.resolve(
                __dirname,
                '../../auth/tuitionez-cloud-service-account.json',
            ),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
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
        await drive.files.delete({ fileId });

        return Buffer.from(pdfRes.data as ArrayBuffer);
    }
}
