import { ReferenceGroupInterface } from './reference-group.interface';

export interface ReferenceDataInterface {
    id: number | null;
    group: ReferenceGroupInterface;
    code: string;
    name: string;
    order: number;
    active: boolean;
}
