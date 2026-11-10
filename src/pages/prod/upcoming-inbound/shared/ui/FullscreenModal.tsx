import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography } from 'antd';
import React from 'react';
import type { ReactNode } from 'react';


const { Title } = Typography;

interface FullscreenModalProps {
  open?: boolean;
  title?: ReactNode;
  onCancel?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  destroyOnClose?: boolean;
}

export function FullscreenModal({
  open,
  title,
  onCancel,
  children,
}: FullscreenModalProps) {
  if (!open) return null;

  return (
    <Card
      style={{ marginTop: 16 }}
      bodyStyle={{ padding: 0 }}
      bordered
      title={
        <Space size={12}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onCancel}>
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
        </Space>
      }
      headStyle={{ padding: '12px 16px' }}
    >
      <div style={{ minHeight: 'calc(100vh - 260px)', background: '#fff' }}>{children}</div>
    </Card>
  );
}
