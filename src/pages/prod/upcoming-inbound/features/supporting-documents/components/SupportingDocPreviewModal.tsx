import React from 'react';
import { Modal, Typography } from 'antd';
import { useEffect } from 'react';

const { Text } = Typography;

interface SupportingDocPreviewModalProps {
  open: boolean;
  fileName?: string;
  previewUrl?: string;
  revokeOnClose?: boolean;
  onClose: () => void;
}

function isImageFile(fileName?: string) {
  const lowerName = fileName?.toLowerCase() || '';
  return (
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.gif') ||
    lowerName.endsWith('.webp') ||
    lowerName.endsWith('.bmp') ||
    lowerName.endsWith('.svg')
  );
}

export function SupportingDocPreviewModal({
  open,
  fileName,
  previewUrl,
  revokeOnClose = false,
  onClose,
}: SupportingDocPreviewModalProps) {
  useEffect(() => {
    return () => {
      if (revokeOnClose && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, revokeOnClose]);

  const handleClose = () => {
    if (revokeOnClose && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title={fileName || 'File Preview'}
      width="80vw"
      style={{ top: 24 }}
      destroyOnClose
    >
      {!previewUrl ? (
        <Text type="secondary">Preview is not available for this file.</Text>
      ) : isImageFile(fileName) ? (
        <div style={{ textAlign: 'center' }}>
          <img
            src={previewUrl}
            alt={fileName || 'Preview'}
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </div>
      ) : (
        <iframe
          src={previewUrl}
          title={fileName || 'File Preview'}
          style={{ width: '100%', height: '70vh', border: 0, borderRadius: 8 }}
        />
      )}
    </Modal>
  );
}
