import moment from "moment";

export type LookupDataType = 'CONTRACT_TYPE' | 'CONTACT_TYPE' | 'CONTRACT_STATUS' | 'DAY_OF_WEEK' |
    'DISPLAY_A' | 'DISPLAY_B' | 'OFFER_FREQUENCY' | 'OFL_OFFER' | 'CUSTOMER_DISPLAY' |
    'SETTLEMENT_PLAN' | 'WEEK_OF_MONTH' | 'CONTACT_CHANNEL_TYPE' | 'CUSTOMER_STATUS' | 'CUSTOMER_TYPE' |
    'SALE_MAIN_CHANNEL' | 'SALE_SUB_CHANNEL' | 'EXCLUSIVE_PRODUCT' | 'SETTLEMENT_STATUS' | 'SETTLEMENT_RUN_STATUS' |
    'SETTLEMENT_CYCLE_TYPE' | 'CUSTOMER_CODE_TYPE' | 'ADDRESS_TYPE'

export type CommentObjectType = 'CONTACT'


export interface Page<T> {
    items: T[],
    page?: number,
    pageSize?: number,
    total?: number
}

export interface Pagination {
    page: number,
    pageSize?: number = 20
}

export interface LookupData {
    id: number,
    code: string,
    name: string,
    type: LookupDataType
}

export interface LookupDataItem {
    id: number;
    key?: string;
    name: string;
    code?: string;
    description?: string;
}

export interface CommentData {
    id?: number;
    objectType: CommentObjectType;
    objectId: number;
    description: string;
    createdBy?: string;
    createdDate?: moment.Moment;
    lastModifiedBy?: string;
    lastModifiedDate?: moment.Moment;
}


export type Contributor = {
    id: number | string;
    code?: string;
    name: string;
    type: 'USER' | 'GROUP_USER' | 'DEPT' | 'SUB_DEPT',
    description?: string;
}



export interface DataResponse<T extends { id: number }> {
    id: number
    items?: T[]
}


export type FieldInfo = {
    fieldDisplay: string;
    fieldName: string;
    fieldValue: string?,
    isFailed: boolean;
    message?: string;
}

export type ImportDataItem = {
    id: number
    fieldInfoList: FieldInfo[];
    action?: string;
}

export type ImportDataResponse = DataResponse<ImportDataItem>  