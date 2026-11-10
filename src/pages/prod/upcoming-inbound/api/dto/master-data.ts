export interface InboundSupplierMasterListParams {
  businessUnit?: string | null;
  business_unit?: string | null;
  searchValue?: string | null;
  status?: string | null;
  pageNumber?: number;
  pageSize?: number;
}

export interface InboundUomMasterListParams {
  businessUnit?: string | null;
  business_unit?: string | null;
  searchValue?: string | null;
  status?: string | null;
  pageNumber?: number;
  pageSize?: number;
}

export interface InboundWarehouseMasterListParams {
  businessUnit?: string | null;
  business_unit?: string | null;
  searchValue?: string | null;
  status?: string | null;
  pageNumber?: number;
  pageSize?: number;
}

export interface InboundItemMasterListParams {
  businessUnit?: string | null;
  business_unit?: string | null;
  searchValue?: string | null;
  activeOnly?: boolean | null;
  pageNumber?: number;
  pageSize?: number;
}

export interface InboundSupplierMasterApi {
  id?: number | null;
  business_unit: string;
  supplier_code: string;
  supplier_name: string;
  status: string;
}

export interface InboundUomMasterApi {
  id?: number | null;
  business_unit: string;
  uom_entry?: number | null;
  uom_code: string;
  uom_name: string;
  status: string;
}

export interface InboundWarehouseMasterApi {
  id?: number | null;
  business_unit: string;
  warehouse_code: string;
  warehouse_name: string;
  status: string;
}

export interface InboundItemMasterApi {
  id?: number | null;
  business_unit: string;
  item_code: string;
  item_name: string;
  uom: string;
  is_active: boolean;
}
