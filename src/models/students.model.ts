import { ReferenceData } from './reference-data.model';
import { Parent } from './parents.model';

export interface Student {
    id: number | null;
    name: string;
    mykid: string;
    grade: ReferenceData;
    age: ReferenceData;
    parent: Parent;
    subjects: ReferenceData[];
}
