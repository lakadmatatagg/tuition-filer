export interface InvoiceTemplateInterface {
    COMPANY_NAME: string;
    COMPANY_TAGLINE: string;
    COMPANY_ADDRESS_1: string;
    COMPANY_ADDRESS_2: string;
    PHONE_LABEL: string;
    COMPANY_PHONE_NO: string;
    INVOICE_LABEL: string;
    INVOICE_NO_LABEL: string;
    INVOICE_NO: string;
    DATE_LABEL: string;
    INVOICE_DATE: string; // Use `Date` if you're dealing with actual Date objects

    TO_LABEL: string;
    PARENT_NAME: string;
    PARENT_PHONE_NO: string;

    ITEM_LABEL: string;
    SUBJECT_LABEL: string;
    PRICE_LABEL: string;
    AMOUNT_LABEL: string;

    students: InvoiceStudentsInterface[];

    TOTAL_LABEL: string;
    SUB_TOTAL: number;
    PAYMENT_REMARKS: string;
    PAYMENT_ACCOUNT_INFO: string;
    END_LABEL: string;
}

export interface InvoiceStudentsInterface {
    student_name: string;
    subjects: InvoiceSubjectsInterface[];
}

export interface InvoiceSubjectsInterface {
    name: string;
    price: number;
    total: number;
}
