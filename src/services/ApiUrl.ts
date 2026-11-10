import { Endpoint } from "./API"

export const WORKFLOW_API = '/services/workflow/api/v1/workflow'
// export const SAP_API = '/services/sapintegration/api/v1/sap'
export const SAP_API = '/services/deliveryexpense/api/v1/sap'
export const INVENTORY_API = '/services/inventory/api'
export const CRM_API = '/services/crm/api'
export const SALE_API = '/services/sale/api'
export const SETTING_API = '/services/setting/api'
export const REPORT_API = '/services/reports/api'
export const DELIVERY_API = '/services/delivery/api'
export const PRO_API = '/services/pro/api'
export const FILE_API = '/services/files/api'
export const ICT_API = '/services/ict/api'
export const HR_API = '/services/hrm/api'
export const RETAILER_API = '/services/retailer/api'
export const FLEET_API = '/services/fleet/api'
export const SAP_SOURCE_API = '/services/sap/api'
export const PROD_API = '/services/prod/api'
export const DMS_API = '/services/dms/api'
export const FMA_API = '/services/fma/api'

export const getServiceUrl = (service: Endpoint) => {
    switch (service) {
        case 'SAP': return SAP_API
        case 'WORK_FLOW': return WORKFLOW_API
        case 'INVENTORY': return INVENTORY_API
        case 'CRM': return CRM_API
        case 'SALE': return SALE_API
        case 'SETTING': return SETTING_API
        case 'DELIVERY': return DELIVERY_API
        case 'FILE': return FILE_API
        case 'PRO': return PRO_API
        case 'ICT': return ICT_API
        case 'HR': return HR_API
        case 'RETAILER': return RETAILER_API
        case 'FLEET': return FLEET_API
        case 'DMS': return DMS_API
        case 'SAP_SOURCE': return SAP_SOURCE_API
        case 'DLV_EXPENSE': return SAP_API
        case 'PROD': return PROD_API
        case 'DMS': return DMS_API
        case 'FMA': return FMA_API
        default: throw Error(`${service} cannot be found`)
    }
}
