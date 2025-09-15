import { Injectable, Logger } from '@nestjs/common';
import { SpringbootService } from './springboot.service';
import { StudentInterface } from '../interface/student.interface';
import { ReferenceDataInterface } from '../interface/configuration/reference-data.interface';
import {
    InvoiceStudentsInterface,
    InvoiceTemplateInterface,
} from '../interface/template/invoice-template.interface';
import { DocxtempleterService } from './docxtempleter.service';
import { GoogleDocsService } from './google-docs.service';

@Injectable()
export class InvoiceService {
    private readonly logger = new Logger(InvoiceService.name);

    constructor(
        private readonly springbootService: SpringbootService,
        private readonly docxtempleterService: DocxtempleterService,
        private readonly googleDocsService: GoogleDocsService,
    ) {}

    async getInvoiceCurrentMonth(
        chatId: string,
    ): Promise<{ buffer: Buffer; invoiceNo: string }> {
        // 1. Get Student List by Parent Chat ID
        this.logger.log('Fetching student list for invoice generation');
        const studentList: StudentInterface[] =
            await this.springbootService.getStudentListByParentChatId(chatId);

        // 2. Fetch company labels
        this.logger.log('Fetching company labels for invoice generation');
        const companyLabel: ReferenceDataInterface[] =
            await this.springbootService.getReferenceByGroup('COMPANY_INFO');

        // 3. Fetch invoice labels
        this.logger.log('Fetching invoice labels for invoice generation');
        const invoiceLabel: ReferenceDataInterface[] =
            await this.springbootService.getReferenceByGroup('INVOICE_LABELS');

        // 4. Map to InvoiceStudents
        const studentPrepList: InvoiceStudentsInterface[] = studentList.map(
            (student: StudentInterface) => ({
                student_name: student.name,
                subjects: student.subjects.map((subject) => ({
                    name: subject.name,
                    price: 80,
                    total: 80,
                })),
            }),
        );
        this.logger.log('Fetching invoice students for invoice generation');

        // 5. Construct invoice data
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // month is 0-based
        const invoiceNo: string = `INV${day}${month}313${studentList[0]?.parent?.id}`;

        const invoiceData: InvoiceTemplateInterface = {
            COMPANY_NAME:
                companyLabel.find((x) => x.code === 'COMPANY_NAME')?.name || '',
            COMPANY_TAGLINE:
                companyLabel.find((x) => x.code === 'COMPANY_TAGLINE')?.name ||
                '',
            COMPANY_ADDRESS_1:
                companyLabel.find((x) => x.code === 'COMPANY_ADDRESS_1')
                    ?.name || '',
            COMPANY_ADDRESS_2:
                companyLabel.find((x) => x.code === 'COMPANY_ADDRESS_2')
                    ?.name || '',
            COMPANY_PHONE_NO:
                companyLabel.find((x) => x.code === 'COMPANY_PHONE_NO')?.name ||
                '',
            PAYMENT_REMARKS:
                companyLabel.find((x) => x.code === 'PAYMENT_REMARKS')?.name ||
                '',
            PAYMENT_ACCOUNT_INFO:
                companyLabel.find((x) => x.code === 'PAYMENT_ACCOUNT_INFO')
                    ?.name || '',

            PHONE_LABEL:
                invoiceLabel.find((x) => x.code === 'PHONE_LABEL')?.name || '',
            INVOICE_LABEL:
                invoiceLabel.find((x) => x.code === 'INVOICE_LABEL')?.name ||
                '',
            INVOICE_NO_LABEL:
                invoiceLabel.find((x) => x.code === 'INVOICE_NO_LABEL')?.name ||
                '',
            DATE_LABEL:
                invoiceLabel.find((x) => x.code === 'DATE_LABEL')?.name || '',
            ITEM_LABEL:
                invoiceLabel.find((x) => x.code === 'ITEM_LABEL')?.name || '',
            SUBJECT_LABEL:
                invoiceLabel.find((x) => x.code === 'SUBJECT_LABEL')?.name ||
                '',
            PRICE_LABEL:
                invoiceLabel.find((x) => x.code === 'PRICE_LABEL')?.name || '',
            AMOUNT_LABEL:
                invoiceLabel.find((x) => x.code === 'AMOUNT_LABEL')?.name || '',
            TOTAL_LABEL:
                invoiceLabel.find((x) => x.code === 'TOTAL_LABEL')?.name || '',
            END_LABEL:
                invoiceLabel.find((x) => x.code === 'END_LABEL')?.name || '',
            TO_LABEL:
                invoiceLabel.find((x) => x.code === 'TO_LABEL')?.name || '',

            INVOICE_NO: invoiceNo,
            INVOICE_DATE: new Date().toLocaleDateString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }),
            PARENT_NAME: studentList[0]?.parent?.name || '',
            PARENT_PHONE_NO: studentList[0]?.parent?.phoneNo || '',
            students: studentPrepList,
            SUB_TOTAL: studentPrepList.reduce(
                (total, student) =>
                    total +
                    student.subjects.reduce((sum, subj) => sum + subj.total, 0),
                0,
            ),
        };

        const bufferDocx =
            await this.docxtempleterService.generateInvoice(invoiceData);
        const bufferPdf =
            await this.googleDocsService.convertDocxBufferToPdf(bufferDocx);
        return {
            buffer: bufferPdf,
            invoiceNo: invoiceNo,
        };
    }
}
