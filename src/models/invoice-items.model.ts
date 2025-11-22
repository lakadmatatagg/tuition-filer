import { ReferenceData } from './reference-data.model';
import { Student } from './students.model';

export interface InvoiceItem {
    id: number | null;
    student: Student;
    subject: ReferenceData;
    description?: string;
    amount: number;
    createdAt?: string | null;
    updatedAt?: string | null;
}
