
export type ExportType = 'PDF' | 'EXCEL' | 'XLSX' | 'EXCELOPENXML' | 'CSV'


export type Endpoint = 'INVENTORY' | 'SAP' | 'WORK_FLOW' | 'CRM' | 'SALE' | 'SETTING' | 'DELIVERY' | 'FILE' | 'PRO' | 'ICT' | 'HR' | 'RETAILER' | 'FLEET' | 'SAP_SOURCE' | 'DLV_EXPENSE' | 'PROD' | 'DMS' | 'FMA'


// export interface ServiceType {
//   type: 'INVENTORY' | 'SAP' | 'WORK_FLOW' | 'CRM' | 'SALE' | 'SETTING' | 'ICT' | 'HR' | 'RETAILER'
//   name?: string
// }

//Use in Delivery Expendse Only -- Depreciated
// export type ServiceName = 'SAP' | 'WORK_FLOW' | 'GATEWAY' | 'INVENTORY' | 'CRM' | 'SALE' | 'SETTING'

type ServiceType = WorkflowServiceType | SAPServiceType | UserServiceType | DataFormServiceType | ReportServiceType | VisitPlanServiceType


//Use in Delivery Expendse Only -- Depreciated
type SAPServiceType = {
  name: ServiceName = 'SAP',
  action: 'none'
  | 'item-group-lookup'
  | 'search-sap-item'
  | 'look-for-sap-item'
  | 'product_type'
  | 'fetch-item'
  | 'list_provinces'
  | 'list_districts'
  | 'find_price_rate'
  | 'calculate_price_rate'
  | 'fetch_price_rate_by_doc_entry'
  | 'query_outsource_price_by_doc_entry'
  | 'commit_recalculate_price_rate'
  | 'query_delivery_cost_his'
  | 'split_delivery'
}


declare namespace API {
  import Keycloak from 'keycloak-js'
  export interface CurrentUser {
    avatar?: string;
    name?: string;
    login?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    email?: string;
    group?: string;
    signature?: string;
    tags?: {
      key: string;
      label: string;
    }[];
    userId?: string;
    access?: 'user' | 'guest' | 'admin';
    authorities: []
    groupAttributeMap?:Map<key,string>;
    unreadCount?: number;
    employeeInfo?: {
      id: number
      department: string
      firstName: string
      internalName: string
      jobTitle: string
      lastName: string
      reportTo: string
      hod: string
    }
  }

  export interface LoggedIn {
    access_token: string;
    refresh_token: string;
  }

  export interface LoginStateType {
    statusInfo?: 'OK' | 'error';
    status?: number;
    type?: string;
  }

  export interface NoticeIconData {
    id: string;
    key: string;
    avatar: string;
    title: string;
    datetime: string;
    type: string;
    read?: boolean;
    description: string;
    clickClose?: boolean;
    extra: any;
    status: string;
  }

  export interface TokenInfo {
    logout: () => void;
  }

  export interface HttpResponse<T> {
    status: number;
    statusInfo: 'OK' | 'Created' |
    'Accepted' | 'No Content' |
    'Reset Content' | 'Partial Content' |
    'Moved Permanently' | 'Found' | 'See Other' |
    'Not Modified' | 'Use Proxy' | 'Temporary Redirect' |
    'Bad Request' | 'Unauthorized' | 'Payment Required' |
    'Forbidden' | 'Not Found' | 'Method Not Allowed' |
    'Not Acceptable' | 'Proxy Authentication Required' |
    'Request Timeout' | 'Conflict' | 'Gone' | 'Length Required' |
    'Precondition Failed' | 'Request Entity Too Large' |
    'Request-URI Too Long' | 'Unsupported Media Type' | 'Requested Range Not Satisfiable' |
    'Expectation Failed' | 'Precondition Required' |
    'Too Many Requests' | 'Request Header Fields Too Large' |
    'Internal Server Error' | 'Not Implemented' |
    'Bad Gateway' | 'Service Unavailable' | 'Gateway Timeout' |
    'HTTP Version Not Supported' | 'Network Authentication Required';
    mediaType: string;
    entity: T;
  }

  export interface NamedService {
    type: ServiceName,
    value: 'deployWorkflow' | 'saveApproval'
  }
}

export const GLOBAL_CONST = {
  paging: {
    PAGE_SIZE: 20
  }
}

export interface Paging<T> {
  items: T[],
  refNo?: string;
  pageSize?: number,
  total?: number
}

export interface Pagination {
  page?: number,
  refNo?:string,
  current?: number, // used in some component, it's the same to page. 
  pageSize?: number = 20
}

type ParamData = {
  key: string;
  type?: 'int' | 'double' | 'float' | 'string' | 'boolean' | 'date' | 'dateTime';
  value?: any;
}

export type GenericReportParams = {
  reportName: string;
  reportPath: string;
  data: ParamData[]
}
