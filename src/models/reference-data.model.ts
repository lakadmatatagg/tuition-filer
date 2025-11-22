import { ReferenceGroup } from './reference-group.model';

export interface ReferenceData {
    id: number | null;
    group: ReferenceGroup;
    code: string;
    name: string;
    order: number;
    active: boolean;
}
