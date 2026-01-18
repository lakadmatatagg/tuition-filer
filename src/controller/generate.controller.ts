import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocxtempleterService } from '../service/docxtempleter.service';
import { GoogleDocsService } from '../service/google-docs.service';
import { InvoiceTemplate } from '../models/invoice-template.model';
import { TelegramService } from '../service/telegram.service';
import { zipBuffers } from '../utils/zip.utils';
import { EmailService } from '../service/email.service';

@Controller('generate')
export class GenerateController {
    constructor(
        private docxtempleterService: DocxtempleterService,
        private googleDocsService: GoogleDocsService,
        private telegramService: TelegramService,
        private emailService: EmailService,
    ) {}

    @Get('download')
    download(@Res() res: Response) {
        const buffer = this.docxtempleterService.generateDocument({
            first_name: 'John',
            last_name: 'Doe',
            phone: '+33666666',
            description: 'The Acme Product',
        });

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=output.docx',
        );
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        );
        res.send(buffer);
    }

    @Post('invoice/:filename')
    async downloadInvoice(
        @Param('filename') filename: string,
        @Body() data: any,
        @Res() res: Response,
    ) {
        const bufferDocx =
            await this.docxtempleterService.generateInvoice(data);
        const buffer =
            await this.googleDocsService.convertDocxBufferToPdf(bufferDocx);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${filename}.pdf`,
        });

        res.send(buffer);
    }

    @Post('batch-invoice')
    async processBatchInvoice(@Body() data: InvoiceTemplate[]) {
        const adminSetting =
            await this.emailService.getAdminEmail('batch_admin_email');

        const batchEmail: Buffer[] = [];
        const batchInvoiceNos: string[] = [];

        let totalProcessed = 0;
        let sentToTelegram = 0;
        let failedTelegram = 0;
        let addedToEmailBatch = 0;
        let emailBatchFailures = 0;

        for (const invoiceData of data) {
            totalProcessed++;

            try {
                const bufferDocx =
                    await this.docxtempleterService.generateInvoice(
                        invoiceData,
                    );
                const bufferPdf =
                    await this.googleDocsService.convertDocxBufferToPdf(
                        bufferDocx,
                    );

                const chatId =
                    invoiceData.invoiceItems[0]?.student.parent.telegramChatId;

                if (chatId) {
                    try {
                        await this.telegramService.sendInvoiceToParent(
                            chatId,
                            bufferPdf,
                            invoiceData.INVOICE_NO,
                        );
                        sentToTelegram++;
                        continue;
                    } catch {
                        failedTelegram++;
                    }
                }

                // fallback → email batch
                batchEmail.push(bufferPdf);
                batchInvoiceNos.push(invoiceData.INVOICE_NO);
                addedToEmailBatch++;
            } catch (e) {
                console.error('Invoice generation failed:', e);
                emailBatchFailures++;
            }
        }

        // ---------------------------
        // ZIP THE EMAIL BATCH
        // ---------------------------
        const zipName = `Batch_Invoices_${this.formatDateForFilename()}.zip`;

        const zipped = await zipBuffers(
            batchEmail.map((buf, i) => ({
                filename: `${batchInvoiceNos[i]}.pdf`,
                buffer: buf,
            })),
        );

        // Send email to admin
        await this.emailService.sendBatchZip(
            zipped,
            zipName,
            adminSetting.value,
        );

        return {
            success: true,
            totalProcessed,
            sentToTelegram,
            failedTelegram,
            addedToEmailBatch,
            emailBatchFailures,
        };
    }

    formatDateForFilename(): string {
        const now = new Date();

        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();

        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // convert 0 → 12

        const hourStr = hours.toString().padStart(2, '0');

        return `${day}-${month}-${year}_${hourStr}-${minutes}-${seconds}_${ampm}`;
    }
}
