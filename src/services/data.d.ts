export type LookupDataType =
  | 'CONTRACT_TYPE'
  | 'CONTACT_TYPE'
  | 'CONTRACT_STATUS'
  | 'SPACE_RESERVED_ATTRIBUTE'
  | 'DAY_OF_WEEK'
  | 'DISPLAY_A'
  | 'DISPLAY_B'
  | 'OFFER_FREQUENCY'
  | 'OFL_OFFER'
  | 'CUSTOMER_DISPLAY'
  | 'SETTLEMENT_PLAN'
  | 'WEEK_OF_MONTH'
  | 'CONTACT_CHANNEL_TYPE'
  | 'CUSTOMER_STATUS'
  | 'CUSTOMER_TYPE'
  | 'SALE_MAIN_CHANNEL'
  | 'SALE_SUB_CHANNEL'
  | 'EXCLUSIVE_PRODUCT'
  | 'SETTLEMENT_STATUS'
  | 'SETTLEMENT_RUN_STATUS'
  | 'SETTLEMENT_CYCLE_TYPE'
  | 'CUSTOMER_CODE_TYPE'
  | 'ADDRESS_TYPE'
  | 'SALE_RECORD_SOURCE'
  | 'SALE_ORDER_STATUS'
  | 'GENDER'
  | 'BUDGET'
  | 'SALE_TYPE'
  | 'STOCK_CATEGORY'
  | 'URGENCY'
  | 'IMPACT'
  | 'PRIORITY'
  | 'SOURCE'
  | 'COMPANY'
  | 'LOCATION'
  | 'CLOSURE_CODE'
  | 'CUSTOMER_DIVISION'
  | 'POSM_CATEGORY'
  | 'POSM_ITEM_REVIEWED'
  | 'POSM_REVIEWED_STATUS'
  | 'OUTLET_TYPE'
  | 'ICT_FORM_FINGER_PRINT_ATTENDANCE'
  | 'ICT_FORM_FINGER_PRINT_ACCESS_DOOR'
  | 'ICT_FORM_SHARE_DRIVE'
  | 'ICT_FORM_SYSTEM_ACCESS'
  | 'ICT_FORM_WORKFLOW_ACCESS'
  | 'ICT_FORM_NETWORK_ACCESS'
  | 'SALESPERSON_POSITION'
  | 'SALE_PRICE_LIST'
  | 'SALE_PAYMENT_TERM'
  | 'SALE_SAP_SERIES'
  | 'SALE_PAYMENT_TERM_SAP'
  | 'SALE_PRICE_LIST_SAP'
  | 'VERIFIED_ADDRESS_LAT_LONG'



export interface LookupData {
  id: number;
  code: string;
  name: string;
  type: LookupDataType;
  actived?: string;
  sequence?: number;
}

export interface StockCategoryLess {
  id: number;
  code: string;
  name: string;
  type: LookupDataType;
  sequence: number;
}

export interface LookupDataItem {
  groupType: string;
  sequence?: number;
  id: number;
  key?: string;
  name: string;
  code?: string;
  description?: string;
}

export interface LookupDataItem2 {
  id: number;
  type: 'CONTACT_TYPE' |
  'EMPLOYEE_SEGMENT' |
  'EMPLOYEE_CONTRACT_TYPE' |
  'REQUISITION_TYPE' |
  'WORK_PLACE' |
  'WORK_SHIFT' |
  'DAY_OFF_GROUP' |
  'CONTRACT_COMPLIANCE_CHECK' |
  'FMA_WORK_PLACE_ARRANGEMENT' |
  'FMA_ACCESSORY' |
  'FMA_UNIFORM' |
  'FMA_SYSTEM' | string;


  name: string;
  code?: string;
  description?: string;
}

export interface LookupDataItem3 extends LookupDataItem2 {
  parentId?: number;
}

export interface LookupDataItem4 extends LookupDataItem {
  parentId?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
}

export interface AttachmentFile {
  uri: any;
  id: string;
  title?: string;
  description?: string;
  fileName: string;
  fileType: string;
  createdBy?: string;
  createdDate: moment.Moment;
}

export interface BusinessUnit {
  id: numner;
  code: string;
  name: string;
  description?: string;
}

export interface CustomerLess {
  id: number;
  code: string;
  internalName: string;
  name: string;
  division?: string;
}
