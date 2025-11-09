import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { SpringbootService } from './springboot.service';
import { SystemSettingInterface } from '../interface/system-setting.interface';
import { BrowserService } from './browser.service';

@Injectable()
export class DocxtempleterService {
    constructor(
        private readonly browserService: BrowserService,
        private readonly springbootService: SpringbootService,
    ) {}

    generateDocument(data: Record<string, any>): Buffer {
        const templatePath = path.resolve(
            __dirname,
            '../../templates/invoice_v1.docx',
        );
        return this.fillTemplate(templatePath, data);
    }

    private fillTemplate(
        templatePath: string,
        data: Record<string, any>,
    ): Buffer {
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(data);

        return doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });
    }

    async generateInvoice(data: Record<string, any>): Promise<Buffer> {
        const setting =
            await this.springbootService.getInvoiceFileName('invoice_template');
        if (!setting) {
            throw new Error('Invoice file name not found in system settings');
        }

        // ✅ Dynamic require (works in CJS & avoids ESM import issues)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const expressionParser = require('docxtemplater/expressions.js');

        // ✅ Configure parser safely
        const parser = expressionParser.configure({
            filters: {
                upper: (input: string) => input?.toUpperCase() ?? '',
                lower: (input: string) => input?.toLowerCase() ?? '',
                currency: (value: number) =>
                    typeof value === 'number' ? `RM ${value.toFixed(2)}` : '',
            },
        });

        const templateBuffer = await this.browserService.downloadFile(
            setting.value,
        );
        const zip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            parser,
        });

        doc.render(data);

        return doc.getZip().generate({ type: 'nodebuffer' });
    }
}
