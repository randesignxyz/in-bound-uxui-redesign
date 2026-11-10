import { request } from '@umijs/max';
import type { RequestActions, ServiceApiType } from '@/services/apiGateway';
import { singleRequest } from '@/services/apiGateway';
import { PROD_API } from '@/services/ApiUrl';
import type {
  InboundSupplierMasterListParams,
  InboundSupplierMasterApi,
  InboundUomMasterListParams,
  InboundUomMasterApi,
  InboundWarehouseMasterListParams,
  InboundWarehouseMasterApi,
  InboundItemMasterListParams,
  InboundItemMasterApi,
  InboundSuccessPayloadResponse,
} from '../dto';
import { extractArrayResponse } from './helpers';

const UpcomingInboundAction = {
  syncMasterDataFromSap: (): ServiceApiType<Record<string, never>> => ({
    type: 'EXEC',
    endpoint: 'PROD',
    actionName: 'inbound-sync-master-data-from-sap',
    payload: {},
  }),

  listSuppliers: (
    params: InboundSupplierMasterListParams,
  ): ServiceApiType<InboundSupplierMasterListParams> => ({
    type: 'LIST_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-list-suppliers',
    payload: params,
  }),

  listUoms: (params: InboundUomMasterListParams): ServiceApiType<InboundUomMasterListParams> => ({
    type: 'LIST_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-list-uoms',
    payload: params,
  }),

  listWarehouses: (
    params: InboundWarehouseMasterListParams,
  ): ServiceApiType<InboundWarehouseMasterListParams> => ({
    type: 'LIST_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-list-warehouses',
    payload: params,
  }),

  listItems: (
    params: InboundItemMasterListParams,
  ): ServiceApiType<InboundItemMasterListParams> => ({
    type: 'LIST_QUERY',
    endpoint: 'PROD',
    actionName: 'inbound-list-items',
    payload: params,
  }),
};

function normalizeInboundUomMaster(value: InboundUomMasterApi | any): InboundUomMasterApi {
  return {
    id: value?.id ?? null,
    business_unit: String(value?.business_unit ?? value?.businessUnit ?? '').trim().toUpperCase(),
    uom_entry: value?.uom_entry ?? value?.uomEntry ?? null,
    uom_code: value?.uom_code ?? value?.uomCode ?? value?.code ?? '',
    uom_name:
      value?.uom_name ?? value?.uomName ?? value?.name ?? value?.uom_code ?? value?.uomCode ?? '',
    status: value?.status ?? 'Active',
  };
}

function normalizeInboundSupplierMaster(
  value: InboundSupplierMasterApi | any,
): InboundSupplierMasterApi {
  const businessUnit = value?.business_unit ?? value?.businessUnit ?? '';
  const supplierCode = value?.supplier_code ?? value?.supplierCode ?? value?.code ?? '';
  const supplierName =
    value?.supplier_name ?? value?.supplierName ?? value?.name ?? supplierCode ?? '';

  return {
    id: value?.id ?? null,
    business_unit: String(businessUnit).trim().toUpperCase(),
    supplier_code: String(supplierCode).trim(),
    supplier_name: String(supplierName).trim(),
    status: value?.status ?? 'Active',
  };
}

function normalizeInboundWarehouseMaster(
  value: InboundWarehouseMasterApi | any,
): InboundWarehouseMasterApi {
  const businessUnit = value?.business_unit ?? value?.businessUnit ?? '';
  const warehouseCode = value?.warehouse_code ?? value?.warehouseCode ?? value?.code ?? '';
  return {
    id: value?.id ?? null,
    business_unit: String(businessUnit).trim().toUpperCase(),
    warehouse_code: String(warehouseCode).trim(),
    warehouse_name:
      value?.warehouse_name ?? value?.warehouseName ?? value?.name ?? warehouseCode ?? '',
    status: value?.status ?? 'Active',
  };
}

function normalizeInboundItemMaster(value: InboundItemMasterApi | any): InboundItemMasterApi {
  const businessUnit = value?.business_unit ?? value?.businessUnit ?? '';
  const itemCode = value?.item_code ?? value?.itemCode ?? value?.code ?? '';
  const itemName = value?.item_name ?? value?.itemName ?? value?.name ?? itemCode ?? '';
  const uom = value?.uom ?? value?.uom_code ?? value?.uomCode ?? '';

  return {
    id: value?.id ?? null,
    business_unit: String(businessUnit).trim().toUpperCase(),
    item_code: String(itemCode).trim(),
    item_name: String(itemName).trim(),
    uom: String(uom).trim(),
    is_active: Boolean(value?.is_active ?? value?.isActive ?? true),
  };
}

export const masterDataServiceAPI = (requestAction: RequestActions) => {
  return {
    syncMasterDataFromSap: async (): Promise<
      InboundSuccessPayloadResponse<Record<string, unknown>>
    > => {
      return (await singleRequest<InboundSuccessPayloadResponse<Record<string, unknown>>>(
        UpcomingInboundAction.syncMasterDataFromSap(),
      )(requestAction)) as InboundSuccessPayloadResponse<Record<string, unknown>>;
    },

    listSuppliers: async (
      params: InboundSupplierMasterListParams = {},
    ): Promise<InboundSupplierMasterApi[]> => {
      const response = await request<InboundSupplierMasterApi[]>(
        `${PROD_API}/inbound/master-data/suppliers`,
        {
          method: 'POST',
          data: params,
        },
      );
      const suppliersByKey = new Map<string, InboundSupplierMasterApi>();
      extractArrayResponse(response)
        .map(normalizeInboundSupplierMaster)
        .filter((supplier) => supplier.supplier_code || supplier.supplier_name)
        .forEach((supplier) => {
          const key = `${supplier.business_unit || 'ALL'}::${
            supplier.supplier_code || supplier.supplier_name
          }`;
          suppliersByKey.set(key, supplier);
        });

      return Array.from(suppliersByKey.values()).sort((left, right) => {
        const businessUnitCompare = left.business_unit.localeCompare(right.business_unit);
        return businessUnitCompare || left.supplier_name.localeCompare(right.supplier_name);
      });
    },

    listUoms: async (params: InboundUomMasterListParams = {}): Promise<InboundUomMasterApi[]> => {
      const response = await request<InboundUomMasterApi[]>(
        `${PROD_API}/inbound/master-data/uoms`,
        {
          method: 'POST',
          data: params,
        },
      );
      const uomsByKey = new Map<string, InboundUomMasterApi>();
      extractArrayResponse(response)
        .map(normalizeInboundUomMaster)
        .filter((uom) => uom.uom_code)
        .forEach((uom) => {
          const key = `${uom.business_unit || 'ALL'}::${uom.uom_entry ?? ''}::${uom.uom_code.toUpperCase()}`;
          uomsByKey.set(key, uom);
        });

      return Array.from(uomsByKey.values()).sort((left, right) => {
        const businessUnitCompare = left.business_unit.localeCompare(right.business_unit);
        return businessUnitCompare || left.uom_code.localeCompare(right.uom_code);
      });
    },

    listWarehouses: async (
      params: InboundWarehouseMasterListParams = {},
    ): Promise<InboundWarehouseMasterApi[]> => {
      const response = await request<InboundWarehouseMasterApi[]>(
        `${PROD_API}/inbound/master-data/warehouses`,
        {
          method: 'POST',
          data: params,
        },
      );
      const warehousesByKey = new Map<string, InboundWarehouseMasterApi>();
      extractArrayResponse(response)
        .map(normalizeInboundWarehouseMaster)
        .filter((warehouse) => warehouse.warehouse_code)
        .forEach((warehouse) => {
          const key = `${warehouse.business_unit || 'ALL'}::${warehouse.warehouse_code}`;
          warehousesByKey.set(key, warehouse);
        });

      return Array.from(warehousesByKey.values()).sort((left, right) => {
        const businessUnitCompare = left.business_unit.localeCompare(right.business_unit);
        return businessUnitCompare || left.warehouse_code.localeCompare(right.warehouse_code);
      });
    },

    listItems: async (
      params: InboundItemMasterListParams = {},
    ): Promise<InboundItemMasterApi[]> => {
      const response = await request<InboundItemMasterApi[]>(`${PROD_API}/inbound/master-data/items`, {
        method: 'POST',
        data: params,
      });
      const itemsByKey = new Map<string, InboundItemMasterApi>();
      extractArrayResponse(response)
        .map(normalizeInboundItemMaster)
        .filter((item) => item.item_code && item.item_name)
        .forEach((item) => {
          const key = `${item.business_unit || 'ALL'}::${item.item_code}`;
          itemsByKey.set(key, item);
        });

      return Array.from(itemsByKey.values()).sort((left, right) => {
        const businessUnitCompare = left.business_unit.localeCompare(right.business_unit);
        return businessUnitCompare || left.item_code.localeCompare(right.item_code);
      });
    },
  };
};
