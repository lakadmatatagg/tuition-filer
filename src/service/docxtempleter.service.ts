import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

@Injectable()
export class DocxtempleterService {
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

    generateInvoice(data: any): Buffer {
        const templatePath = path.resolve(
            __dirname,
            '../../templates/invoice_v12.docx',
        );
        const content = fs.readFileSync(templatePath, 'binary');

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(data);

        return doc.getZip().generate({ type: 'nodebuffer' });
    }
}
