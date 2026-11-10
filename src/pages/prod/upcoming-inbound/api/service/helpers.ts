import type { Paging } from '@/services/API';
import type { InboundSuccessPayloadResponse } from '../dto';

export function toBackendPage(page?: number): number | undefined {
  if (typeof page !== 'number' || Number.isNaN(page)) return undefined;
  return page;
}

export function extractPagingItems<IN>(paging: Paging<IN> | any): IN[] {
  if (Array.isArray(paging)) return paging;
  if (Array.isArray(paging?.items)) return paging.items;
  if (Array.isArray(paging?.content)) return paging.content;
  if (Array.isArray(paging?.data)) return paging.data;
  return [];
}

export function extractArrayResponse<IN>(response: IN[] | any): IN[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.list)) return response.list;
  if (Array.isArray(response?.payload)) return response.payload;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.result)) return response.data.result;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  if (Array.isArray(response?.data?.list)) return response.data.list;
  if (Array.isArray(response?.data?.payload)) return response.data.payload;
  return [];
}

export function mapPaging<IN, OU>(paging: Paging<IN>, mapper: (value: IN) => OU): Paging<OU> {
  const items = extractPagingItems<IN>(paging);
  return {
    ...paging,
    items: items.map(mapper),
    total: paging?.total ?? items.length,
  };
}

export function mapPayloadResponse<IN, OU>(
  response: InboundSuccessPayloadResponse<IN>,
  mapper: (value: IN) => OU,
): InboundSuccessPayloadResponse<OU> {
  return {
    message: response.message,
    data: mapper(response.data),
  };
}
