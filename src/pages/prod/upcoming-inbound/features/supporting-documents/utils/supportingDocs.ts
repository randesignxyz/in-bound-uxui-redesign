import { getServiceUrl } from '@/services/ApiUrl';
import { downloadUploadFileV2, getUploadFileObjectUrlV2 } from '@/services/apiGateway';
import type { UploadFile } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { SupportingDocReference, SupportingDocSource } from '../../../core/workflow';


type UploadedSupportingDocResponse = SupportingDocReference & { fileId: string };
export type SupportingUploadFile = UploadFile & {
  supportingDocSource?: SupportingDocSource | null;
  poNumber?: string | null;
};
export type SupportingDocPreviewPayload = {
  url: string;
  revokeOnClose?: boolean;
};

export const APP_PROD_SUPPORTING_DOC_UPLOAD_ACTION = `${getServiceUrl('PROD')}/inbound/supporting-docs/upload`;

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function supportingDocsToUploadFiles(docs: SupportingDocReference[]): SupportingUploadFile[] {
  return docs.map((doc, index) => ({
    uid: doc.fileId ? `file-${doc.fileId}` : `legacy-${index}-${doc.fileName}`,
    name: doc.fileName,
    status: 'done',
    response: doc.fileId ?? undefined,
    supportingDocSource: doc.source ?? undefined,
    poNumber: doc.poNumber ?? undefined,
  }));
}

export function getUploadFileSource(
  file: UploadFile,
  fallbackSource?: SupportingDocSource,
): SupportingDocSource | null | undefined {
  return (file as SupportingUploadFile).supportingDocSource ?? fallbackSource;
}

export function getUploadFilePoNumber(file: UploadFile): string | null | undefined {
  return (file as SupportingUploadFile).poNumber;
}

export async function getSupportingUploadFilePreview(
  file: UploadFile,
): Promise<SupportingDocPreviewPayload | null> {
  if (file.originFileObj) {
    return {
      url: URL.createObjectURL(file.originFileObj as Blob),
      revokeOnClose: true,
    };
  }

  if (typeof file.response === 'string') {
    return {
      url: await getUploadFileObjectUrlV2()(file.response),
    };
  }

  return null;
}

export async function getSupportingDocPreview(
  doc: SupportingDocReference,
): Promise<SupportingDocPreviewPayload | null> {
  if (!doc.fileId) {
    return null;
  }

  return {
    url: await getUploadFileObjectUrlV2()(doc.fileId),
  };
}

export function normalizeUploadFileList(
  files: UploadFile[],
  maxCount = 10,
  fallbackSource?: SupportingDocSource,
): SupportingUploadFile[] {
  return files.slice(-maxCount).map((file) => ({
    ...file,
    status: file.status === 'error' ? 'error' : 'done',
    supportingDocSource: getUploadFileSource(file, fallbackSource),
    poNumber: getUploadFilePoNumber(file),
  }));
}

export function uploadFilesToSupportingDocs(
  files: UploadFile[],
  fallbackSource?: SupportingDocSource,
): SupportingDocReference[] {
  return files.map((file) => ({
    fileId: typeof file.response === 'string' ? file.response : null,
    fileName: file.name,
    source: getUploadFileSource(file, fallbackSource) ?? undefined,
    poNumber: getUploadFilePoNumber(file) ?? undefined,
  }));
}

export function hasIncompleteAppFilesUpload(files: UploadFile[]): boolean {
  return files.some((file) => file.status === 'error');
}

export const stageSupportingDocBeforeUpload: UploadProps['beforeUpload'] = () => false;

export async function uploadPendingSupportingDocs(
  files: UploadFile[],
  fallbackSource?: SupportingDocSource,
): Promise<SupportingDocReference[]> {
  const pendingFiles = files.filter(
    (file) =>
      !!file.originFileObj &&
      !(typeof file.response === 'string' && !file.originFileObj),
  );

  if (pendingFiles.length === 0) {
    return uploadFilesToSupportingDocs(files, fallbackSource);
  }

  const formData = new FormData();
  pendingFiles.forEach((file) => {
    formData.append('files', file.originFileObj as RcFile, file.name);
  });

  const response = await fetch(APP_PROD_SUPPORTING_DOC_UPLOAD_ACTION, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload supporting documents.');
  }

  const uploadedDocs = (await response.json()) as UploadedSupportingDocResponse[];
  let uploadedIndex = 0;

  return files.map((file) => {
    const source = getUploadFileSource(file, fallbackSource) ?? undefined;
    if (!file.originFileObj && typeof file.response === 'string') {
      return {
        fileId: file.response,
        fileName: file.name,
        source,
        poNumber: getUploadFilePoNumber(file) ?? undefined,
      };
    }
    if (!file.originFileObj) {
      return {
        fileId: null,
        fileName: file.name,
        source,
        poNumber: getUploadFilePoNumber(file) ?? undefined,
      };
    }

    const uploaded = uploadedDocs[uploadedIndex++];
    if (!uploaded) {
      throw new Error('Supporting document upload response is incomplete.');
    }
    return {
      ...uploaded,
      source,
      poNumber: getUploadFilePoNumber(file) ?? undefined,
    };
  });
}

export function applyUploadedSupportingDocs(
  files: UploadFile[],
  docs: SupportingDocReference[],
): SupportingUploadFile[] {
  return files.map((file, index) => ({
    ...file,
    status: 'done',
    response: docs[index]?.fileId ?? undefined,
    originFileObj: undefined,
    supportingDocSource: docs[index]?.source ?? getUploadFileSource(file),
    poNumber: docs[index]?.poNumber ?? getUploadFilePoNumber(file),
  }));
}

export async function previewSupportingUploadFile(file: UploadFile): Promise<boolean> {
  const preview = await getSupportingUploadFilePreview(file);
  return Boolean(preview?.url);
}

export async function openSupportingDoc(doc: SupportingDocReference): Promise<boolean> {
  const preview = await getSupportingDocPreview(doc);
  return Boolean(preview?.url);
}

export async function downloadSupportingDoc(doc: SupportingDocReference): Promise<boolean> {
  if (!doc.fileId) {
    return false;
  }
  await downloadUploadFileV2()(doc.fileId, doc.fileName);
  return true;
}
