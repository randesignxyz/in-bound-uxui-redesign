
import { LookupData } from './data'

export interface Contact {
    key?: string;
    id?: number;
    internalName: string;
    name: string;
    type: LookupData;
    channels: ContactChannel[];
    description?: string;

}

export interface ContactChannel {
    id?: number;
    type: LookupData;
    value: string;
}
