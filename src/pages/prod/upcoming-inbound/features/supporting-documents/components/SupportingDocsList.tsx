import React, { useState } from 'react';

import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Button, List, Space, Tag, Typography } from 'antd';
import type { UploadFile } from 'antd';
import {
  downloadSupportingDoc,
  getSupportingDocPreview,
  getSupportingUploadFilePreview,
  getUploadFileSource,
} from '../utils/supportingDocs';
import {
  getSupportingDocSourceColor,
  supportingDocSourceLabel,
  type SupportingDocReference,
  type SupportingDocSource,
} from '../../../core/workflow';

import { SupportingDocPreviewModal } from './SupportingDocPreviewModal';

const { Link, Text } = Typography;
const GRID_ACTION_BASE_COLOR = '#8c8c8c';
const MAX_FILE_NAME_LENGTH = 16;

type GridActionKind = 'view' | 'download' | 'delete';

interface SupportingDocsListProps {
  docs?: SupportingDocReference[];
  files?: UploadFile[];
  emptyText?: string;
  fallbackSource?: SupportingDocSource;
  onRemoveFile?: (uid: string) => void;
  displayMode?: 'list' | 'grid';
  collapsedLimit?: number;
  fitCountInRow?: number;
}

function formatDisplayFileName(fileName: string) {
  if (fileName.length <= MAX_FILE_NAME_LENGTH) {
    return fileName;
  }

  return `${fileName.slice(0, MAX_FILE_NAME_LENGTH)}...`;
}

function getDocumentIcon(fileName: string) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 22 }} />;
  }
  if (lowerName.endsWith('.pdf')) {
    return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 22 }} />;
  }
  if (
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.webp')
  ) {
    return <FileImageOutlined style={{ color: '#1677ff', fontSize: 22 }} />;
  }
  return <FileTextOutlined style={{ color: '#8c8c8c', fontSize: 22 }} />;
}

export function SupportingDocsList({
  docs,
  files,
  emptyText = 'No supporting documents attached.',
  fallbackSource,
  onRemoveFile,
  displayMode = 'list',
  collapsedLimit = 4,
  fitCountInRow,
}: SupportingDocsListProps) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<{
    fileName?: string;
    url?: string;
    revokeOnClose?: boolean;
  } | null>(null);
  const items = files
    ? files.map((file) => ({
        key: file.uid,
        fileName: file.name,
        fileId: typeof file.response === 'string' ? file.response : null,
        source: getUploadFileSource(file, fallbackSource) ?? undefined,
        isPending: !!file.originFileObj,
        isLegacy: !file.originFileObj && typeof file.response !== 'string',
        onView: async () => {
          const preview = await getSupportingUploadFilePreview(file);
          if (preview) {
            setPreviewState({
              fileName: file.name,
              url: preview.url,
              revokeOnClose: preview.revokeOnClose,
            });
          }
        },
        onRemove: onRemoveFile ? () => onRemoveFile(file.uid) : undefined,
      }))
    : (docs ?? []).map((doc, index) => ({
        key: `${doc.fileId ?? 'legacy'}-${index}-${doc.fileName}`,
        fileName: doc.fileName,
        fileId: doc.fileId ?? null,
        source: doc.source ?? undefined,
        isPending: false,
        isLegacy: !doc.fileId,
        onView: async () => {
          const preview = await getSupportingDocPreview(doc);
          if (preview) {
            setPreviewState({
              fileName: doc.fileName,
              url: preview.url,
              revokeOnClose: preview.revokeOnClose,
            });
          }
        },
        onRemove: undefined,
      }));

  const getGridActionColor = (action: GridActionKind, itemKey: string) => {
    const actionKey = `${itemKey}-${action}`;
    if (activeAction === actionKey) {
      if (action === 'delete') {
        return '#cf1322';
      }
      if (action === 'download') {
        return '#389e0d';
      }
      return '#0958d9';
    }
    if (hoveredAction === actionKey) {
      if (action === 'delete') {
        return '#ff4d4f';
      }
      if (action === 'download') {
        return '#52c41a';
      }
      return '#1677ff';
    }
    return GRID_ACTION_BASE_COLOR;
  };

  const bindGridActionState = (action: GridActionKind, itemKey: string) => {
    const actionKey = `${itemKey}-${action}`;
    return {
      onMouseEnter: () => setHoveredAction(actionKey),
      onMouseLeave: () => {
        setHoveredAction((current) => (current === actionKey ? null : current));
        setActiveAction((current) => (current === actionKey ? null : current));
      },
      onMouseDown: () => setActiveAction(actionKey),
      onMouseUp: () => setActiveAction((current) => (current === actionKey ? null : current)),
      onBlur: () => {
        setHoveredAction((current) => (current === actionKey ? null : current));
        setActiveAction((current) => (current === actionKey ? null : current));
      },
    };
  };

  if (displayMode === 'grid') {
    if (items.length === 0) {
      return (
        <Text type="secondary" style={{ lineHeight: '32px' }}>
          {emptyText}
        </Text>
      );
    }

    const visibleItems = expanded ? items : items.slice(0, collapsedLimit);
    const remainingItems = items.length - collapsedLimit;
    const shouldFitItemsInRow = Boolean(fitCountInRow && visibleItems.length >= fitCountInRow);
    const fittedItemWidth = fitCountInRow ? `calc((100% - ${(fitCountInRow - 1) * 8}px) / ${fitCountInRow})` : undefined;

    return (
      <>
        <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.key}
            style={{
              minWidth: 0,
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '9px 10px',
              background: 'linear-gradient(180deg, #ffffff 0%, #fafcff 100%)',
              minHeight: 46,
              width: shouldFitItemsInRow ? fittedItemWidth : 'min(100%, 260px)',
              maxWidth: shouldFitItemsInRow ? fittedItemWidth : 260,
              flex: shouldFitItemsInRow ? `0 1 ${fittedItemWidth}` : '0 1 260px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    width: 24,
                    height: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: '#f3f6fb',
                    flexShrink: 0,
                  }}
                >
                  {getDocumentIcon(item.fileName)}
                </span>
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {item.isLegacy ? (
                    <Text
                      title={item.fileName}
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: '24px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {formatDisplayFileName(item.fileName)}
                    </Text>
                  ) : (
                    <Link
                      onClick={() => void item.onView()}
                      title={item.fileName}
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: '24px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {formatDisplayFileName(item.fileName)}
                    </Link>
                  )}
                  {item.source && (
                    <Tag style={{ marginInlineEnd: 0, lineHeight: '18px', paddingInline: 6, flexShrink: 0 }} color={getSupportingDocSourceColor(item.source)}>
                      {supportingDocSourceLabel[item.source]}
                    </Tag>
                  )}
                  {item.isLegacy && (
                    <Tag style={{ marginInlineEnd: 0, lineHeight: '18px', paddingInline: 6, flexShrink: 0 }} color="default">
                      Legacy
                    </Tag>
                  )}
                </div>
              </div>
              <Space size={0}>
                <Button
                  size="small"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => void item.onView()}
                  disabled={item.isLegacy}
                  style={{ color: getGridActionColor('view', item.key) }}
                  {...bindGridActionState('view', item.key)}
                />
                {item.fileId && (
                  <Button
                    size="small"
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      void downloadSupportingDoc({
                        fileId: item.fileId,
                        fileName: item.fileName,
                        source: item.source,
                      })
                    }
                    style={{ color: getGridActionColor('download', item.key) }}
                    {...bindGridActionState('download', item.key)}
                  />
                )}
                {item.onRemove && (
                  <Button
                    size="small"
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={item.onRemove}
                    style={{ color: getGridActionColor('delete', item.key) }}
                    {...bindGridActionState('delete', item.key)}
                  />
                )}
              </Space>
            </div>
          </div>
        ))}
        {remainingItems > 0 && !expanded && (
          <Button
            type="link"
            style={{
              paddingInline: 0,
              height: 'auto',
            }}
            onClick={() => setExpanded(true)}
          >
            See {remainingItems} more
          </Button>
        )}
        {expanded && items.length > collapsedLimit && (
          <Button
            type="link"
            style={{
              paddingInline: 0,
              height: 'auto',
            }}
            onClick={() => setExpanded(false)}
          >
            See less
          </Button>
        )}
        </div>
        <SupportingDocPreviewModal
          open={Boolean(previewState)}
          fileName={previewState?.fileName}
          previewUrl={previewState?.url}
          revokeOnClose={previewState?.revokeOnClose}
          onClose={() => setPreviewState(null)}
        />
      </>
    );
  }

  if (items.length === 0) {
    return <Text type="secondary">{emptyText}</Text>;
  }

  return (
    <>
      <List
      bordered
      size="small"
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Button
              key={`view-${item.key}`}
              type="link"
              icon={<EyeOutlined />}
              onClick={() => void item.onView()}
              disabled={item.isLegacy}
            >
              View
            </Button>,
            ...(item.fileId
              ? [
                  <Button
                    key={`download-${item.key}`}
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      void downloadSupportingDoc({
                        fileId: item.fileId,
                        fileName: item.fileName,
                        source: item.source,
                      })
                    }
                  >
                    Download
                  </Button>,
                ]
              : []),
            ...(item.onRemove
              ? [
                  <Button
                    key={`remove-${item.key}`}
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={item.onRemove}
                  >
                    Remove
                  </Button>,
                ]
              : []),
          ]}
        >
          <div
            style={{
              width: '100%',
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {getDocumentIcon(item.fileName)}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  flex: 1,
                  minWidth: 0,
                  minHeight: 24,
                }}
              >
                {item.isLegacy ? (
                  <Text title={item.fileName} style={{ lineHeight: 1.5 }}>
                    {formatDisplayFileName(item.fileName)}
                  </Text>
                ) : (
                  <Link onClick={() => void item.onView()} title={item.fileName} style={{ lineHeight: 1.5 }}>
                    {formatDisplayFileName(item.fileName)}
                  </Link>
                )}
                {item.source && (
                  <Tag color={getSupportingDocSourceColor(item.source)}>
                    {supportingDocSourceLabel[item.source]}
                  </Tag>
                )}
              </div>
            </div>
            {(item.isPending || item.isLegacy) && (
              <div style={{ paddingLeft: 30, marginTop: 4 }}>
                <Space size={8} wrap>
                  {item.isLegacy && <Text type="secondary">Legacy attachment</Text>}
                </Space>
              </div>
            )}
          </div>
        </List.Item>
      )}
      />
      <SupportingDocPreviewModal
        open={Boolean(previewState)}
        fileName={previewState?.fileName}
        previewUrl={previewState?.url}
        revokeOnClose={previewState?.revokeOnClose}
        onClose={() => setPreviewState(null)}
      />
    </>
  );
}
