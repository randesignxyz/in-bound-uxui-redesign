import React from 'react';
import { Card, Space, Table, Typography, Tag } from 'antd';
import { AuditOutlined, UserOutlined } from '@ant-design/icons';
import type { SupervisorAdjustmentAudit } from '../../core/type';
const { Text } = Typography;

export function QuantityAdjustments({ adjustments = [] }: { adjustments?: SupervisorAdjustmentAudit[] }) {
  if (!adjustments.length) return null;
  const adjustmentColumns = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      render: (code: string, record: SupervisorAdjustmentAudit) => (
        <div>
          <Text strong>{code}</Text>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{record.itemName}</div>
        </div>
      ),
    },
    {
      title: 'Field',
      dataIndex: 'fieldName',
      key: 'fieldName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Previous',
      dataIndex: 'previousValue',
      key: 'previousValue',
      render: (val: any) => <Text delete type="secondary">{val}</Text>,
    },
    {
      title: 'Adjusted Value',
      dataIndex: 'newValue',
      key: 'newValue',
      render: (val: any) => <Text strong style={{ color: '#52c41a' }}>{val}</Text>,
    },
    {
      title: 'Reason for Adjustment',
      dataIndex: 'reason',
      key: 'reason',
      render: (text: string) => <Text style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: 'Changed By / Time',
      key: 'auditMeta',
      render: (_: any, record: SupervisorAdjustmentAudit) => (
        <div>
          <div><UserOutlined style={{ marginRight: 4 }} />{record.changedBy}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{record.timestamp}</div>
        </div>
      ),
    },
  ];

  return <section className="inbound-activity" aria-label="Quantity adjustments">
      {adjustments && adjustments.length > 0 && (
        <Card
          title={
            <Space>
              <AuditOutlined style={{ color: '#fa8c16' }} />
              <span>Quantity Adjustments ({adjustments.length})</span>
            </Space>
          }
          size="small"
          bordered={false}
          className="inbound-adjustments"
        >
          <Table
            dataSource={adjustments}
            columns={adjustmentColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}
  </section>;
}
