import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocxtempleterService } from '../service/docxtempleter.service';

@Controller('generate')
export class GenerateController {
    constructor(private docxtempleterService: DocxtempleterService) {}

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
    downloadInvoice(
        @Param('filename') filename: string,
        @Body() data: any,
        @Res() res: Response,
    ) {
        const buffer = this.docxtempleterService.generateInvoice(data);

        res.set({
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename=${filename}.docx`,
        });

        res.send(buffer);
    }
}
