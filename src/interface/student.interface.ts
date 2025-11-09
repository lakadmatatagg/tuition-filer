import { ParentInterface } from './parent.interface';
import { ReferenceDataInterface } from './configuration/reference-data.interface';

export interface StudentInterface {
    id: number | null;
    name: string;
    mykid: string;
    grade: ReferenceDataInterface;
    age: ReferenceDataInterface;
    parent: ParentInterface;
    subjects: ReferenceDataInterface[];
}
