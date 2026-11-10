import { QuantityAdjustments } from './QuantityAdjustments';
import React from 'react';
import { getReceiptIrNumber } from '../../core/workflow/goods-receipt';
import { Timeline, Card, Typography, Empty } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { GRActivity, SupervisorAdjustmentAudit, GoodsReceipt } from '../../core/type';

const { Text } = Typography;

interface AuditTrailTimelineProps {
  activities?: GRActivity[];
  adjustments?: SupervisorAdjustmentAudit[];
  currentStep?: number;
  receipt?: GoodsReceipt;
}

export const AuditTrailTimeline: React.FC<AuditTrailTimelineProps> = ({
  activities = [],
  adjustments = [],
  receipt,
}) => {
  const nextOwner = !receipt ? undefined
    : receipt.processState === 'SAP_POSTED' || receipt.sapPostingStatus === 'Posted' ? 'Complete'
    : receipt.processState === 'SAP_POSTING_FAILED' || receipt.sapPostingStatus === 'Posting Failed' ? 'Supervisor — retry SAP posting'
    : receipt.processState === 'PENDING_SUPERVISOR_REVIEW' || receipt.deliveryPlanStatus === 'Pending Supervisor' ? 'Supervisor — review'
    : receipt.deliveryPlanStatus === 'Waiting for QC' || receipt.sendBackTarget === 'QC' ? 'QC Lab — inspect'
    : 'Warehouse — receive or correct';
  const sortedActivities = [...activities].sort((a, b) => {
    const first = Date.parse(a.timestamp), second = Date.parse(b.timestamp);
    return Number.isNaN(first) || Number.isNaN(second) ? 0 : second - first;
  });
  const getTimelineIcon = (state: string) => {
    switch (state) {
      case 'done':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
      case 'active':
        return <ClockCircleOutlined style={{ color: '#1677ff', fontSize: 16 }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />;
    }
  };


  return (
    <section className="inbound-activity" aria-label="Activity" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Activity" size="small">
        {receipt && <div className="inbound-activity-context">
          <Text strong>{getReceiptIrNumber(receipt)}</Text>
          <Text type="secondary">PO: {receipt.poNumber || '—'} · IR Schedule: {receipt.irPlanNumber || '—'}{receipt.sapDocNum ? ` · SAP GR: ${receipt.sapDocNum}` : ''}</Text>
          <Text>Current status: {receipt.displayStatus || receipt.deliveryPlanStatus || 'To Receive'}</Text>
          <Text>Next: {nextOwner}</Text>
        </div>}
        {activities.length === 0 ? (
          <Empty description="No activity records yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Timeline
            style={{ marginTop: 12 }}
            items={sortedActivities.map((activity) => ({
              dot: getTimelineIcon(activity.state),
              children: (
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 13 }}>{activity.title}</Text>
                    <span style={{ fontSize: 11, color: '#8c8c8c' }}>{activity.timestamp}</span>
                  </div>
                  <div style={{ color: '#595959', fontSize: 12, marginTop: 2 }}>{activity.description}</div>
                  {activity.performedBy && (
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                      <UserOutlined style={{ marginRight: 4 }} />
                      {activity.performedBy}
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Card>

      <QuantityAdjustments adjustments={adjustments} />
    </section>
  );
};
