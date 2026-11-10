import React from 'react';
import { Tag } from 'antd';
import type {
  InboundDeliveryPlanStatus,
  QCResultStatus,
  SapPostingStatus,
  IESPlanningStatus,
  SAPPOStatus,
} from '../../core/type';

export interface StatusBadgeProps {
  type: 'deliveryPlan' | 'qc' | 'supervisor' | 'sap' | 'planning' | 'po' | 'queue';
  value?: string;
  className?: string;
  color?: string;
}

export const InboundStatusBadge: React.FC<StatusBadgeProps> = ({ type, value, color, className }) => {
  if (!value) return <Tag style={{ borderRadius: 100, padding: '2px 10px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>N/A</Tag>;

  const baseStyle: React.CSSProperties = {
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    padding: '2px 10px',
    fontWeight: 600,
    fontSize: 12,
    lineHeight: '18px',
  };

  if (type === 'queue') return <Tag className={className} color={color} style={baseStyle}>{value}</Tag>;

  if (type === 'planning') {
    switch (value as IESPlanningStatus) {
      case 'NOT_PLANNED':
        return (
          <Tag
            style={{
              ...baseStyle,
              color: '#334155',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
            }}
          >
            Not Planned
          </Tag>
        );
      case 'PARTIALLY_PLANNED':
        return (
          <Tag
            style={{
              ...baseStyle,
              color: '#7c2d12',
              background: '#ffedd5',
              border: '1px solid #fed7aa',
            }}
          >
            Partially
          </Tag>
        );
      case 'FULLY_PLANNED':
        return (
          <Tag
            style={{
              ...baseStyle,
              color: '#14532d',
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
            }}
          >
            Fully
          </Tag>
        );
      default:
        return <Tag style={{ ...baseStyle, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}>{value}</Tag>;
    }
  }

  if (type === 'po') {
    switch (value as SAPPOStatus) {
      case 'Open':
        return (
          <Tag
            style={{ ...baseStyle, color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            Open
          </Tag>
        );
      case 'Closed':
        return (
          <Tag
            style={{ ...baseStyle, color: '#334155', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
          >
            Closed
          </Tag>
        );
      default:
        return <Tag style={baseStyle}>{value}</Tag>;
    }
  }

  if (type === 'deliveryPlan') {
    switch (value as string) {
      case 'Pending':
        return (
          <Tag
            style={{ ...baseStyle, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a' }}
          >
            Pending
          </Tag>
        );
      case 'In Progress':
        return (
          <Tag
            style={{ ...baseStyle, color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            In Progress
          </Tag>
        );
      case 'Completed':
      case 'Posted':
      case 'Confirmed':
        return (
          <Tag
            style={{ ...baseStyle, color: '#14532d', background: '#dcfce7', border: '1px solid #bbf7d0' }}
          >
            Completed
          </Tag>
        );
      case 'To Receive':
        return (
          <Tag
            style={{ ...baseStyle, color: '#115e59', background: '#f0fdfa', border: '1px solid #99f6e4' }}
          >
            To Receive
          </Tag>
        );
      case 'Partially Received':
        return (
          <Tag
            style={{ ...baseStyle, color: '#9a3412', background: '#ffedd5', border: '1px solid #fed7aa' }}
          >
            Partially Received
          </Tag>
        );
      case 'Received':
        return (
          <Tag
            style={{ ...baseStyle, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0' }}
          >
            Received
          </Tag>
        );
      case 'Waiting for QC':
        return (
          <Tag
            style={{ ...baseStyle, color: '#6b21a8', background: '#faf5ff', border: '1px solid #e9d5ff' }}
          >
            Waiting for QC
          </Tag>
        );
      case 'QC Completed':
        return (
          <Tag
            style={{ ...baseStyle, color: '#3f6212', background: '#f7fee7', border: '1px solid #d9f99d' }}
          >
            QC Completed
          </Tag>
        );
      case 'Pending Supervisor':
        return (
          <Tag
            style={{ ...baseStyle, color: '#854d0e', background: '#fefce8', border: '1px solid #fef08a' }}
          >
            Pending Supervisor
          </Tag>
        );
      case 'Rejected':
        return (
          <Tag
            style={{ ...baseStyle, color: '#991b1b', background: '#fee2e2', border: '1px solid #fecaca' }}
          >
            Rejected
          </Tag>
        );
      default:
        return (
          <Tag
            style={{ ...baseStyle, color: '#14532d', background: '#dcfce7', border: '1px solid #bbf7d0' }}
          >
            {value}
          </Tag>
        );
    }
  }

  if (type === 'qc') {
    switch (value as string) {
      case 'Passed':
      case 'Pass':
        return (
          <Tag
            style={{ ...baseStyle, color: '#14532d', background: '#dcfce7', border: '1px solid #bbf7d0' }}
          >
            Passed
          </Tag>
        );
      case 'Partial Reject':
        return (
          <Tag
            style={{ ...baseStyle, color: '#9a3412', background: '#ffedd5', border: '1px solid #fed7aa' }}
          >
            Partial Reject
          </Tag>
        );
      case 'Fail':
      case 'Rejected':
      case 'Reject':
        return (
          <Tag
            style={{ ...baseStyle, color: '#991b1b', background: '#fee2e2', border: '1px solid #fecaca' }}
          >
            Rejected
          </Tag>
        );
      case 'Conditional Pass':
      case 'On Hold':
        return (
          <Tag
            style={{ ...baseStyle, color: '#854d0e', background: '#fefce8', border: '1px solid #fef08a' }}
          >
            On Hold
          </Tag>
        );
      default:
        return (
          <Tag
            style={{ ...baseStyle, color: '#6b21a8', background: '#faf5ff', border: '1px solid #e9d5ff' }}
          >
            {value}
          </Tag>
        );
    }
  }

  if (type === 'sap') {
    switch (value as SapPostingStatus) {
      case 'Ready to Post':
        return (
          <Tag
            style={{ ...baseStyle, color: '#115e59', background: '#f0fdfa', border: '1px solid #99f6e4' }}
          >
            Ready to Post
          </Tag>
        );
      case 'Posting':
        return (
          <Tag
            style={{ ...baseStyle, color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            Posting to SAP...
          </Tag>
        );
      case 'Posted':
        return (
          <Tag
            style={{ ...baseStyle, color: '#14532d', background: '#dcfce7', border: '1px solid #bbf7d0' }}
          >
            Posted to SAP
          </Tag>
        );
      case 'Posting Failed':
        return (
          <Tag
            style={{ ...baseStyle, color: '#991b1b', background: '#fee2e2', border: '1px solid #fecaca' }}
          >
            Posting Failed
          </Tag>
        );
      default:
        return <Tag style={baseStyle}>{value}</Tag>;
    }
  }

  return <Tag style={baseStyle}>{value}</Tag>;
};
