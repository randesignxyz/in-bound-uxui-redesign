export type AccountType = 'user' | 'group' | 'all'

export interface SearchAccount {
    id: string,
    name: string,
    code?: string;
    type: 'user' | 'group'| 'USER' | 'GROUP_USER' | 'DEPT' | 'SUB_DEPT'
    description?: string
}

export type DestSelectorType = {
    name: string,
    description?: string,
    dataType: 'Int' | 'String' | 'Date' | 'ListString'
}

export type Selector = {
    id?: number;
    key: string;
    operand: string;
    dataType: String;
    selector?: string;
    value?: string;
    remarks?: string;
}

export type DestSelector = {
    id?: number;
    approver: string;
    selectors: Selector[];
}