import { blobToBase64 } from '@/pages/utils';
import { SortOrder } from 'antd/lib/table/interface';
import { groupBy, map } from 'lodash';
import moment from 'moment';
import printJS from 'print-js';
import { request } from 'umi';
import { Endpoint, ExportType, GenericReportParams, Pagination, Paging, ServiceType } from './API';
import { REPORT_API, SALE_API, getServiceUrl } from './ApiUrl';
import { DataResponse } from './shared/data';

/** Services methods */

export interface MuitlParams {
  actionName: string;
  responseKey?: string;
  type?: 'List' | 'Single';
  payload?: any;
}

export type RequestActions = {
  start?: (serviceName?: string) => void;
  request?: { loading?: boolean; failed?: boolean; message?: string };
  end?: (status: 'SUCCESS' | 'FAILED', reason?: string) => void;
};

export const findService = <IN, OU>(service: ServiceType, actions?: RequestActions) => {
  return async (params: IN): Promise<OU> => {
    try {
      actions?.start?.(service.name);
      const rs = await findData<IN, OU>(service, params);
      if (!rs) throw Error();
      rs && actions?.end?.('SUCCESS');
      return rs;
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  };
};

export const findAllService = <IN, OU>(service: ServiceType, actions?: RequestActions) => {
  return async (params?: IN) => {
    try {
      actions?.start?.(service.name);
      const rs = await findAllData<IN, OU>(service, params);
      if (!rs) throw Error();
      rs && actions?.end?.('SUCCESS');
      return rs;
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  };
};

export const findPagingService = <IN, OU>(service: ServiceType, actions?: RequestActions) => {
  return async (params?: IN, pagination?: Pagination) => {
    try {
      actions?.start?.(service.name);
      const rs = await findPagingData<IN, OU>(service, params, pagination);
      if (!rs) throw Error();
      rs && actions?.end?.('SUCCESS');
      return rs;
    } catch (error) {
      actions?.end?.('FAILED', '');
      throw error;
    }
  };
};

export const findMultiService = <IN extends MuitlParams | undefined, OU>(
  service: ServiceType,
  actions?: RequestActions,
) => {
  return async (params: IN[]): Promise<OU> => {
    try {
      actions?.start?.(service.name);
      const rs = await findMulti<IN, OU>(service, params);
      if (!rs) throw Error();
      rs && actions?.end?.('SUCCESS');
      return rs;
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  };
};

export const execService =
  <IN, OU>(service: ServiceType, actions?: RequestActions) =>
    async (params: IN) => {
      try {
        actions?.start?.();
        const rs = await execData<IN, OU>(service, params);
        if (!rs) throw Error('');
        rs && actions?.end?.('SUCCESS');
        return rs;
      } catch (error) {
        actions?.end?.('FAILED');
        throw error;
      }
    };

export const execDownloadForm =
  (service: ServiceType, actions?: RequestActions) => async (instId: string) => {
    try {
      actions?.start?.();
      const rs = await downloadForm(service, { instId: instId });
      rs && actions?.end?.('SUCCESS');
      return rs;
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  };

export interface DownloadData<T> {
  reportName: string;
  fileName: string;
  type: ExportType;
  data?: T;
  target?: string;
}

export interface PrintPDFData<T> {
  reportName: string;
  data?: T;
}

const getReportFileExtension = (type: ExportType) => {
  switch (type) {
    case 'EXCEL':
      return 'xls';
    case 'XLSX':
    case 'EXCELOPENXML':
      return 'xlsx';
    case 'CSV':
      return 'csv';
    case 'PDF':
    default:
      return 'pdf';
  }
};

const getReportMimeType = (type: ExportType) => {
  switch (type) {
    case 'EXCEL':
      return 'application/vnd.ms-excel';
    case 'XLSX':
    case 'EXCELOPENXML':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'CSV':
      return 'text/csv';
    case 'PDF':
    default:
      return 'application/pdf';
  }
};

const doDownloadSalesReport = async <T>(params: DownloadData<T>): Promise<void> => {
  const blob = request<Blob>(`${SALE_API}/export/report/${params.reportName}/type/${params.type}`, {
    method: 'POST',
    responseType: 'blob',
    data: params.data,
  });

  const v = await blob;
  const element = document.createElement('a');
  element.target = '_blank';
  const file = new Blob([v], { type: getReportMimeType(params.type) });
  console.log('new Blob([v]', URL.createObjectURL(file));
  element.href = URL.createObjectURL(file);

  if (params.target) element.target = '_blank';
  if (!params.target)
    element.download = `${params.fileName}-${moment().format()}.${getReportFileExtension(params.type)}`;
  document.body.appendChild(element);
  element.click();
};

export const downloadGenericReport =
  (actions?: RequestActions) =>
    async (param: Omit<DownloadData<GenericReportParams>, 'reportName'>) => {
      try {
        actions?.start?.();
        await doDownloadReport({
          ...param,
          reportName: 'export-generic-report',
        });
        actions?.end?.('SUCCESS');
      } catch (error) {
        actions?.end?.('FAILED');
        throw error;
      }
    };

export const downloadReport =
  <T>(actions?: RequestActions) =>
    async (param: DownloadData<T>) => {
      try {
        actions?.start?.();
        await doDownloadReport<T>(param);
        actions?.end?.('SUCCESS');
      } catch (error) {
        actions?.end?.('FAILED');
        throw error;
      }
    };

export const downloadSaleReport =
  <T>(actions?: RequestActions) =>
    async (param: DownloadData<T>) => {
      try {
        actions?.start?.();
        await doDownloadSalesReport(param);
        actions?.end?.('SUCCESS');
      } catch (error) {
        actions?.end?.('FAILED');
        throw error;
      }
    };

export const downloadReport1 =
  <T>(actions?: RequestActions) =>
    async (param: DownloadData<T>) => {
      try {
        actions?.start?.();
        actions?.end?.('SUCCESS');
        return await doDownloadReport1<T>(param);
      } catch (error) {
        actions?.end?.('FAILED');
        throw error;
      }
    };

export const printPdf =
  <T>(actions?: RequestActions) =>
    async (params: PrintPDFData<T>, onPrintDialogClose?: () => void) => {
      try {
        actions?.start?.();
        const blob = request<Blob>(`${REPORT_API}/export/report/${params.reportName}/type/PDF`, {
          method: 'POST',
          responseType: 'blob',
          data: params.data,
        });
        const v = await blob;
        blobToBase64(v, (base64) => {
          printJS({
            base64: true,
            printable: base64,
            type: 'pdf',
            onPrintDialogClose: onPrintDialogClose,
          });
        });
      } catch (e: any) {
        actions?.end?.('FAILED');
      } finally {
        actions?.end?.('SUCCESS');
      }
    };

export const downloadUploadFile =
  (actions?: RequestActions) => async (fileId: string, fileName: string) => {
    try {
      actions?.start?.();
      const blob = request<Blob>(`${getServiceUrl('WORK_FLOW')}/uploader/files/${fileId}`, {
        responseType: 'blob',
      });
      const v = await blob;
      const element = document.createElement('a');
      element.href = URL.createObjectURL(v);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      actions?.end?.('SUCCESS');
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  };

export const downloadUploadFileV2 =
  (actions?: RequestActions) => async (fileId: string, fileName: string) => {
    try {
      actions?.start?.();
      const blob = request<Blob>(`${getServiceUrl('FILE')}/file/${fileId}`, {
        responseType: 'blob',
      });
      const v = await blob;
      const element = document.createElement('a');
      element.href = URL.createObjectURL(v);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      actions?.end?.('SUCCESS');
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  };

export const getUploadFileObjectUrl = (actions?: RequestActions) => async (fileId: string) => {
  try {
    actions?.start?.();
    const blob = request<Blob>(`${getServiceUrl('WORK_FLOW')}/uploader/files/${fileId}`, {
      responseType: 'blob',
    }).finally(() => {
      actions?.end?.('SUCCESS');
    });
    //.concat(`${(await blob).type}`)
    return URL.createObjectURL(await blob);
  } catch (error) {
    actions?.end?.('FAILED');
    throw error;
  }
};

export const getUploadFileObjectUrlV2 = (actions?: RequestActions) => async (fileId: string) => {
  try {
    actions?.start?.();
    const blob = request<Blob>(`${getServiceUrl('FILE')}/file/${fileId}`, {
      responseType: 'blob',
    }).finally(() => {
      actions?.end?.('SUCCESS');
    });
    //.concat(`${(await blob).type}`)
    return URL.createObjectURL(await blob);
  } catch (error) {
    actions?.end?.('FAILED');
    throw error;
  }
};

export const downloadReportBlob =
  <T>(actions?: RequestActions) =>
    async (params: DownloadData<T>) => {
      try {
        actions?.start?.();
        const blob = request<Blob>(`/api/export/report/${params.reportName}/type/${params.type}`, {
          method: 'POST',
          data: params.data,
        });
        actions?.end?.('SUCCESS');
        return await blob;
      } catch (error) {
        actions?.end?.('FAILED');
        throw error;
      }
    };

const execData = async <IN, OU>(service: ServiceType, params: IN): Promise<OU> => {
  const srvUrl = getServiceUrl(service.type);
  return request<OU>(`${srvUrl}/name/${service.name}/exec`, {
    method: 'POST',
    data: params,
  });
};

export const commitImportedData =
  <OU extends { id: number }>(key: string, importId: number) =>
    async (actions?: RequestActions) => {
      actions?.start?.();
      try {
        const srvUrl = getServiceUrl('FILE');
        const rs = await request<DataResponse<OU>>(`${srvUrl}/commit`, {
          method: 'POST',
          data: {
            importedKey: key,
            importedId: importId,
          },
        });
        actions?.end?.('SUCCESS');
        return rs;
      } catch (error: any) {
        actions?.end?.('FAILED');
        throw error;
      }
    };

const downloadForm = async (service: ServiceType, params: { instId: string }): Promise<Blob> => {
  const srvUrl = getServiceUrl(service.type);
  return request(`${srvUrl}/data-form/common/download/inst-id/${params.instId}`, {
    responseType: 'blob',
  });
};

const doDownloadReport = async <T>(params: DownloadData<T>): Promise<void> => {
  const blob = request<Blob>(
    `${REPORT_API}/export/report/${params.reportName}/type/${params.type}`,
    {
      method: 'POST',
      responseType: 'blob',
      data: params.data,
    },
  );

  const v = await blob;
  const element = document.createElement('a');
  element.target = '_blank';
  const file = new Blob([v], { type: getReportMimeType(params.type) });
  console.log('new Blob([v]', URL.createObjectURL(file));
  element.href = URL.createObjectURL(file);

  if (params.target) element.target = '_blank';
  if (!params.target)
    element.download = `${params.fileName}-${moment().format("YYYY-MM-DD HH:mm:ss")}.${getReportFileExtension(params.type)}`;
  document.body.appendChild(element);
  element.click();
};

const doDownloadReport1 = async <T>(params: DownloadData<T>): Promise<string> => {
  const blob = request<Blob>(
    `${REPORT_API}/export/report/${params.reportName}/type/${params.type}`,
    {
      method: 'POST',
      responseType: 'blob',
      data: params.data,
    },
  );

  const v = await blob;
  const element = document.createElement('a');
  element.target = '_blank';
  const file = new Blob([v], { type: 'application/pdf' });
  return URL.createObjectURL(file);
};

const findData = async <IN, OU>(service: ServiceType, params: IN): Promise<OU> => {
  const srvUrl = getServiceUrl(service.type);
  return request<OU>(`${srvUrl}/name/${service.name}/find`, {
    method: 'POST',
    data: params,
  });
};

const findAllData = async <IN, OU>(service: ServiceType, params?: IN): Promise<OU[]> => {
  const srvUrl = getServiceUrl(service.type);
  return request<OU[]>(`${srvUrl}/name/${service.name}/list`, {
    method: 'POST',
    data: params,
  });
};

const findPagingData = async <IN, OU>(
  service: ServiceType,
  params?: IN,
  pagination?: { page?: number; pageSize?: number },
): Promise<Paging<OU>> => {
  const srvUrl = getServiceUrl(service.type);
  return request<Paging<OU>>(
    `${srvUrl}/name/${service.name}/list-paging/page/${pagination?.page || 0}/size/${pagination?.pageSize || 20
    }`,
    {
      method: 'POST',
      data: params || {},
    },
  );
};

const findMulti = async <IN extends MuitlParams | undefined, OU>(
  service: ServiceType,
  params: IN[],
): Promise<OU> => {
  const srvUrl = getServiceUrl(service.type);
  return request<OU>(`${srvUrl}/list-multi`, {
    method: 'POST',
    data: params,
  });
};

//****New way ****/

export type ServiceApiType<IN> =
  | {
    type: 'FETCH_QUERY';
    actionName: string;
    endpoint: Endpoint;
    responseKey?: string;
    payload?: IN;
  }
  | {
    type: 'LIST_QUERY';
    actionName: string;
    endpoint: Endpoint;
    responseKey?: string;
    payload: IN;
  }
  | {
    type: 'PAGING_QUERY';
    actionName: string;
    endpoint: Endpoint;
    responseKey?: string;
    payload: IN;
    pagination?: Pagination;
    sort?: Record<string, SortOrder>;
  }
  | {
    type: 'EXEC';
    actionName: string;
    endpoint: Endpoint;
    responseKey?: string;
    payload: IN;
  };

export const MultiRequest =
  <OU>(datas: ServiceApiType<any>[]) =>
    async (actions?: RequestActions): Promise<OU> => {
      try {
        actions?.start?.();
        const group = groupBy(datas, (it) => it.endpoint);
        const rs = map(group, async (values, key) => {
          const srvUrl = getServiceUrl(key as Endpoint);
          const params = values.map((it) => ({
            actionName: it.actionName,
            responseKey: it.responseKey,
            type: it.type == 'LIST_QUERY' ? 'List' : 'Single',
            payload: it.payload || {},
          }));
          return await request<OU>(`${srvUrl}/list-multi`, {
            method: 'POST',
            data: params,
          });
        });

        const result = await rs.reduce(async (p, c) => ({ ...(await p), ...(await c) }));
        actions?.end?.('SUCCESS');
        return result;
      } catch (error) {
        actions?.end?.('FAILED');
        throw error;
      }
    };

export const singleRequest =
  <OU>(data: ServiceApiType<any>) =>
    async (actions?: RequestActions): Promise<OU | OU[] | Paging<OU>> => {
      if (data.type == 'PAGING_QUERY') {
        return await findPaging<OU>(data)(actions);
      } else if (data.type == 'FETCH_QUERY') {
        return await find<OU>(data)(actions);
      } else if (data.type == 'LIST_QUERY') {
        return await findAll<OU>(data)(actions);
      } else if (data.type == 'EXEC') {
        return await exec<OU>(data)(actions);
      } else {
        throw Error('Not support');
      }
    };

export const find =
  <OU>(data: ServiceApiType<any>) =>
    async (actions?: RequestActions) => {
      if (data.type == 'FETCH_QUERY') {
        try {
          actions?.start?.();
          const srvUrl = getServiceUrl(data.endpoint);
          const rs = await request<OU>(`${srvUrl}/name/${data.actionName}/find`, {
            method: 'POST',
            data: data.payload,
          });
          actions?.end?.('SUCCESS');
          return rs;
        } catch (error) {
          actions?.end?.('FAILED');
          throw error;
        }
      } else {
        throw TypeError('Fetch record only.');
      }
    };

export const findAll =
  <OU>(data: ServiceApiType<any>) =>
    async (actions?: RequestActions) => {
      if (data.type == 'LIST_QUERY') {
        try {
          actions?.start?.();
          const srvUrl = getServiceUrl(data.endpoint);
          const rs = await request<OU[]>(`${srvUrl}/name/${data.actionName}/list`, {
            method: 'POST',
            data: data.payload,
          });
          actions?.end?.('SUCCESS');
          return rs;
        } catch (error) {
          actions?.end?.('FAILED');
          throw error;
        }
      } else {
        throw TypeError('List record only.');
      }
    };

export const findPaging =
  <OU>(data: ServiceApiType<any>) =>
    async (actions?: RequestActions) => {
      if (data.type == 'PAGING_QUERY') {
        try {
          actions?.start?.();
          const srvUrl = getServiceUrl(data.endpoint);
          const rs = request<Paging<OU>>(
            `${srvUrl}/name/${data.actionName}/list-paging/page/${(data.pagination?.page || 1) - 1
            }/size/${data.pagination?.pageSize || 20}`,
            {
              method: 'POST',
              data: data.payload || {},
            },
          );
          actions?.end?.('SUCCESS');
          return rs;
        } catch (error) {
          actions?.end?.('FAILED');
          throw error;
        }
      } else {
        throw TypeError('Paging record only.');
      }
    };

export const exec =
  <OU>(data: ServiceApiType<any>) =>
    async (actions?: RequestActions) => {
      if (data.type == 'EXEC') {
        try {
          actions?.start?.();
          const srvUrl = getServiceUrl(data.endpoint);
          const rs = await request<OU>(`${srvUrl}/name/${data.actionName}/exec`, {
            method: 'POST',
            data: data.payload,
          });
          actions?.end?.('SUCCESS');
          return rs;
        } catch (error) {
          actions?.end?.('FAILED');
          throw error;
        }
      } else {
        throw TypeError('Save record only.');
      }
    };

/*************************** New try ********************************/

export type ServiceItemParams<T = any> = {
  actionName: string;
  endpoint: Endpoint;
  responseKey?: string;
  payload?: T;
};

export type ServiceListParams<T = any> = {
  actionName: string;
  endpoint: Endpoint;
  responseKey?: string;
  payload?: T;
};

export type ServicePagingParams<T = any> = {
  actionName: string;
  endpoint: Endpoint;
  responseKey?: string;
  payload: T;
  pagination?: Pagination;
  sort?: Record<string, SortOrder>;
};

export type ServiceExecParams<T = any> = {
  actionName: string;
  endpoint: Endpoint;
  responseKey?: string;
  payload?: T;
};

export const fetchDataItemService = <OU = any, IN = any>(data: ServiceItemParams<IN>) => ({
  query: async (actions?: RequestActions) => {
    try {
      actions?.start?.();
      const srvUrl = getServiceUrl(data.endpoint);
      const rs = await request<OU>(`${srvUrl}/name/${data.actionName}/find`, {
        method: 'POST',
        data: data.payload,
      });
      actions?.end?.('SUCCESS');
      return rs;
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  },
  queryParams: {
    type: 'FETCH_QUERY',
    endpoint: data.endpoint,
    actionName: data.actionName,
    responseKey: data.responseKey,
    payload: data.payload,
  },
});

export const fetchDataListService = <OU = any, IN = any>(data: ServiceListParams<IN>) => ({
  query: async (actions?: RequestActions) => {
    try {
      actions?.start?.();
      const srvUrl = getServiceUrl(data.endpoint);
      const rs = await request<OU[]>(`${srvUrl}/name/${data.actionName}/list`, {
        method: 'POST',
        data: data.payload,
      });
      actions?.end?.('SUCCESS');
      return rs;
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  },
  queryParams: {
    type: 'LIST_QUERY',
    endpoint: data.endpoint,
    actionName: data.actionName,
    responseKey: data.responseKey,
    payload: data.payload,
  } as ServiceApiType<OU>,
});

export const fetchDataPagingService = <OU = any, IN = any>(data: ServicePagingParams<IN>) => ({
  query: async (actions?: RequestActions) => {
    // console.log(data);
    try {
      actions?.start?.();
      const srvUrl = getServiceUrl(data.endpoint);
      const rs = request<Paging<OU>>(
        `${srvUrl}/name/${data.actionName}/list-paging/page/${(data.pagination?.page || data.pagination?.current || 1) - 1
        }/size/${data.pagination?.pageSize || 20}`,
        {
          method: 'POST',
          data: data.payload || {},
        },
      );
      actions?.end?.('SUCCESS');
      return rs;
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  },
});
export const fetchDataPagingRefNoService = <OU = any, IN = any>(data: ServicePagingParams<IN>) => ({
  query: async (actions?: RequestActions) => {
    console.log(data);
    try {
      actions?.start?.();
      const srvUrl = getServiceUrl(data.endpoint);
      const rs = request<Paging<OU>>(
        `${srvUrl}/name/${data.actionName}/list-paging-ref-no/ref/${data.pagination?.refNo || '-1'}/page/${(data.pagination?.page || data.pagination?.current || 1) - 1
        }/size/${data.pagination?.pageSize || 20}`,
        {
          method: 'POST',
          data: data.payload || {},
        },
      );
      actions?.end?.('SUCCESS');
      return rs;
    } catch (error) {
      actions?.end?.('FAILED');
      throw error;
    }
  },
});

export const execDataService =
  <OU = any, IN = any>(data: ServiceExecParams<IN>) =>
    async (actions?: RequestActions) => {
      try {
        actions?.start?.();
        const srvUrl = getServiceUrl(data.endpoint);
        const rs = await request<OU>(`${srvUrl}/name/${data.actionName}/exec`, {
          method: 'POST',
          data: data.payload,
        });
        actions?.end?.('SUCCESS');
        return rs;
      } catch (error) {
        actions?.end?.('FAILED');
        throw error;
      }
    };

export const execDataService0 =
  <IN = any>(data: ServiceExecParams<IN>) =>
    async (actions?: RequestActions) => {
      try {
        actions?.start?.();
        const srvUrl = getServiceUrl(data.endpoint);
        const rs = await request<void>(`${srvUrl}/name/${data.actionName}/exec`, {
          method: 'POST',
          data: data.payload,
        });
        actions?.end?.('SUCCESS');
        return rs;
      } catch (error) {
        actions?.end?.('FAILED');
        throw error;
      }
    };



export const queryDataPagingService = <OU = any, IN = any>(data: ServicePagingParams<IN>) => {
  try {
    const srvUrl = getServiceUrl(data.endpoint);
    const rs = request<Paging<OU>>(
      `${srvUrl}/name/${data.actionName}/list-paging/page/${(data.pagination?.page || data.pagination?.current || 1) - 1
      }/size/${data.pagination?.pageSize || 20}`,
      {
        method: 'POST',
        data: data.payload || {},
      },
    );
    return rs;
  } catch (error) {
    throw error;
  }
}

export const queryDataListService = <OU = any, IN = any>(data: ServiceListParams<IN>) => ({
  query: async () => {
    try {
      const srvUrl = getServiceUrl(data.endpoint);
      const rs = await request<OU[]>(`${srvUrl}/name/${data.actionName}/list`, {
        method: 'POST',
        data: data.payload,
      });
      return rs;
    } catch (error) {
      throw error;
    }
  },
  queryParams: {
    type: 'LIST_QUERY',
    endpoint: data.endpoint,
    actionName: data.actionName,
    responseKey: data.responseKey,
    payload: data.payload,
  } as ServiceApiType<OU>,
});
