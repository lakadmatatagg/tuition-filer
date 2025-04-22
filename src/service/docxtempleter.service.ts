import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

@Injectable()
export class DocxtempleterService {
  generateDocument(data: Record<string, any>): Buffer {
    const templatePath = path.resolve(__dirname, '../../templates/input.docx');
    return this.fillTemplate(templatePath, data);
  }

  private fillTemplate(templatePath: string, data: Record<string, any>): Buffer {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(data);

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buffer;
  }

  generateInvoice(): Buffer {
    const templatePath = path.resolve(__dirname, '../../templates/invoice.docx');
    const content = fs.readFileSync(templatePath, 'binary');

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const data = {
      company_name: 'Sufi Tuition Center',
      motto: 'Learn with Passion, Excel with Purpose',
      invoice_no: 'INV-20250422-001',
      parent_name: 'Ahmad bin Sulaiman',
      parent_phone: '012-3456789',
      item: [
        { description: 'Math Tuition (April)', price: 80, qty: 1, total: 80 },
        { description: 'Science Tuition (April)', price: 90, qty: 1, total: 90 },
      ],
      subtotal: 170,
      tax: 10.2,
      total: 180.2,
      bank_name: 'Maybank',
      bank_account_name: 'Sufi Tuition',
      bank_account_no: '112233445566',
    };

    doc.render(data);

    return doc.getZip().generate({ type: 'nodebuffer' });
  }
}