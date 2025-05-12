import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocxtempleterService } from '../service/docxtempleter.service';
import { GoogleDocsService } from '../service/google-docs.service';

@Controller('generate')
export class GenerateController {
    constructor(
        private docxtempleterService: DocxtempleterService,
        private googleDocsService: GoogleDocsService,
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
        const bufferDocx = this.docxtempleterService.generateInvoice(data);
        const buffer =
            await this.googleDocsService.convertDocxBufferToPdf(bufferDocx);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${filename}.pdf`,
        });

        res.send(buffer);
    }
}
