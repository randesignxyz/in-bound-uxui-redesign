import { SHOW_GLOBAL_AUDIT_TRAIL } from '../core/workspaceFeatures';
import React, { useState } from 'react';
import {
  Typography,
  Button,
  Tag,
  Space,
} from 'antd';
import {
  ShoppingCartOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  FileDoneOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  ExportOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  InfoCircleOutlined,
  CompassOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import './UserFlowWorkspace.less';

const { Title, Text } = Typography;

export interface UserFlowWorkspaceProps {
  onNavigateToRole?: (role: 'PROCUREMENT' | 'WAREHOUSE' | 'QC' | 'SUPERVISOR' | 'AUDIT_TIMELINE') => void;
}

export const UserFlowWorkspace: React.FC<UserFlowWorkspaceProps> = ({ onNavigateToRole }) => {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(0);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number>(0);

  const rolePipeline = [
    {
      roleKey: 'PROCUREMENT' as const,
      stepNumber: '01',
      roleLabel: 'Procurement',
      actionTitle: 'Order Intake & IR Scheduling',
      icon: <ShoppingCartOutlined />,
      calloutStage: 'Stage 1: Procurement',
      calloutTitle: 'Order Intake & IR Scheduling',
      calloutDesc: 'Converts open SAP Purchase Orders into physical IR Schedules (IR Plans) with split dates.',
      btnLabel: 'Open Live Procurement Workspace',
      prerequisites: [
        'Open SAP Purchase Orders (#26000977, #26000980)',
        'Vendor Delivery Commitments & Schedules',
        'Warehouse Receiving Bay Capacity Constraints',
      ],
      actions: [
        'Review Open & In-Progress POs and identify incoming loads',
        'Click "Create IR Plan" to schedule multi-date split quantities',
        'Assign truck license plates, driver details, and planned dates',
        'Dispatch confirmed IR Schedule (IR0001) to Warehouse',
      ],
      outputs: [
        'IR Schedule generation (IR0001 - IR0006)',
        'Live PO Planning Status flags ("Fully" or "Partially")',
      ],
      businessRules: 'Scheduled quantities cannot exceed remaining PO balance. Split dates enable flexible multi-truck vendor arrivals.',
    },
    {
      roleKey: 'WAREHOUSE' as const,
      stepNumber: '02',
      roleLabel: 'Warehouse Dock',
      actionTitle: 'Dock Intake & Multi-Batch LOTs',
      icon: <InboxOutlined />,
      calloutStage: 'Stage 2: Warehouse Dock',
      calloutTitle: 'Dock Intake & Multi-Batch LOTs',
      calloutDesc: 'Receives physical shipments, validates against delivery notes, records multi-batch lot tracking, and dispatches to QC.',
      btnLabel: 'Open Live Warehouse Workspace',
      prerequisites: [
        'Active IR Schedule (IR0001 - IR0006)',
        'Vendor Physical Delivery Note (e.g. DN-HX-88910)',
        'Physical Truck Arrival at Receiving Bay',
      ],
      actions: [
        'Match incoming truck license plate and delivery note against open IR plan',
        'Inspect outer packaging and count physical pallets/boxes',
        'Log multi-batch LOT tracking entries (LOT number, Production date, Expiry date, Intake Qty)',
        'Record discrepancy remarks if physical count differs from planned',
        'Complete intake and dispatch Goods Receipt (GR) to Quality Control',
      ],
      outputs: [
        'Generated Goods Receipt Record (GR000124 - GR000128)',
        'Warehouse Receipt Status update to "Waiting for QC"',
      ],
      businessRules: 'Every received item line must have at least one valid LOT batch number assigned before submission.',
    },
    {
      roleKey: 'QC' as const,
      stepNumber: '03',
      roleLabel: 'Quality Control',
      actionTitle: 'Inspection & Partitioning',
      icon: <SafetyCertificateOutlined />,
      calloutStage: 'Stage 3: Quality Control',
      calloutTitle: 'Inspection & Partitioning',
      calloutDesc: 'Performs standard inspection checklist testing and partitions received quantities into Accepted, Rejected, or On-Hold.',
      btnLabel: 'Open Live QC Workspace',
      prerequisites: [
        'Dispatched Goods Receipt in "Waiting for QC" status',
        'Standard Quality Inspection Checklist & Specification Protocol',
      ],
      actions: [
        'Retrieve sample units and execute physical, visual, and chemical tests',
        'Partition total quantity into: Accepted Qty, Rejected Qty, and On-Hold Qty',
        'Enter mandatory rejection reasons and upload test certificates if defects found',
        'Submit QC decision (Pass, Fail, Conditional Pass) to forward to Supervisor',
      ],
      outputs: [
        'Immutable QC Inspection Partition Audit Record',
        'Goods Receipt Status transition to "Pending Supervisor"',
      ],
      businessRules: 'Sum of Accepted + Rejected + On Hold quantities must exactly equal total received quantity.',
    },
    {
      roleKey: 'SUPERVISOR' as const,
      stepNumber: '04',
      roleLabel: 'Supervisor & ERP',
      actionTitle: 'Approval & SAP Posting',
      icon: <FileDoneOutlined />,
      calloutStage: 'Stage 4: Supervisor & ERP',
      calloutTitle: 'Approval & SAP Posting',
      calloutDesc: 'Audits physical vs QC quantities, performs line adjustments with mandatory audit reasons, and executes direct SAP posting.',
      btnLabel: 'Open Live Supervisor Workspace',
      prerequisites: [
        'Completed QC Inspection Partition Report',
        'Warehouse intake discrepancy logs & receiving notes',
      ],
      actions: [
        'Review overall shipment timeline, batch partitions, and variance notes',
        'Perform supervisor quantity adjustments if necessary (with mandatory audit reason)',
        'Click "Approve & Post to SAP" to trigger automated direct ERP posting',
        'Verify SAP Goods Receipt PO (GRPO) document creation and PO balance deduction',
      ],
      outputs: [
        'Generated SAP Business One GRPO Document (e.g. SAP-GRPO-88910)',
        'Purchase Order Status update (Closed if fully received, In-Progress if partial)',
      ],
      businessRules: 'All supervisor adjustments require a mandatory justification reason and are permanently preserved in compliance logs.',
    },
    {
      roleKey: 'AUDIT_TIMELINE' as const,
      stepNumber: '05',
      roleLabel: 'Compliance Audit',
      actionTitle: 'Lifecycle Traceability',
      icon: <HistoryOutlined />,
      calloutStage: 'Stage 5: Compliance Audit',
      calloutTitle: 'Lifecycle Traceability',
      calloutDesc: 'Provides immutable chronological audit trails, supervisor adjustment logs, and complete transaction lifecycle visibility.',
      btnLabel: 'Open Live Audit Trail Workspace',
      prerequisites: [
        'Unified system transaction event stream across all departments',
      ],
      actions: [
        'Search and filter event logs by department, GR #, PO #, user ID, or date range',
        'Inspect supervisor quantity adjustment history with before/after values',
        'View interactive end-to-end visual journey timelines for individual shipments',
        'Export compliance audit reports for external and internal regulatory audits',
      ],
      outputs: [
        'Immutable, tamper-evident transaction compliance logs',
        'Full operational visibility and regulatory traceability',
      ],
      businessRules: 'Audit logs are strictly append-only and cannot be altered, overwritten, or deleted by any system role.',
    },
  ].filter(step => SHOW_GLOBAL_AUDIT_TRAIL || step.roleKey !== 'AUDIT_TIMELINE');

  const scenarios = [
    {
      tabLabel: 'Scenario 1: Standard Happy Path (100% Inbound)',
      summaryText: 'PO #26000977 (2,000 PCS Shrink Sleeves) arrives on schedule. Warehouse performs dock intake across 2 LOT batches (1,000 PCS each). QC confirms 100% acceptance. Supervisor approves and posts directly to SAP Business One, closing the PO.',
      timeline: [
        {
          stepNum: '01',
          roleTag: 'Procurement',
          roleTagColor: '#6366f1',
          roleTagBg: 'rgba(99, 102, 241, 0.07)',
          title: 'Create IR Schedule (IR0001)',
          desc: 'Procurement schedules 2,000 PCS for target date 27-08-2026. IR Schedule IR0001 is dispatched to the Warehouse receiving queue.',
          chips: [
            { text: 'PO #26000977', bg: '#f1f5f9', color: '#334155' },
            { text: 'IR0001', bg: '#f1f5f9', color: '#334155' },
            { text: 'Fully Planned', bg: '#dcfce7', color: '#15803d' },
          ],
        },
        {
          stepNum: '02',
          roleTag: 'Warehouse',
          roleTagColor: '#f59e0b',
          roleTagBg: 'rgba(245, 158, 11, 0.07)',
          title: 'Physical Dock Intake & 2 LOT Batches Entry',
          desc: 'Truck arrives with Delivery Note DN-HX-88910. Operator logs LOT-202608-01 (1,000 PCS) and LOT-202608-02 (1,000 PCS). Dispatches Goods Receipt GR000124 to QC.',
          chips: [
            { text: 'DN-HX-88910', bg: '#f1f5f9', color: '#334155' },
            { text: 'GR000124', bg: '#f1f5f9', color: '#334155' },
            { text: '2 LOT Batches', bg: '#dcfce7', color: '#15803d' },
          ],
        },
        {
          stepNum: '03',
          roleTag: 'Quality Control',
          roleTagColor: '#b49900',
          roleTagBg: 'rgba(180, 153, 0, 0.07)',
          title: 'Inspect Goods & 100% Acceptance Partition',
          desc: 'QC inspector confirms packaging integrity, dimensions, and lot label compliance. Submits QC Pass: 2,000 Accepted, routing shipment to Supervisor.',
          chips: [
            { text: 'Acc: 2,000 PCS', bg: '#dcfce7', color: '#15803d' },
            { text: 'Rej: 0', bg: '#fee2e2', color: '#ef4444' },
            { text: 'QC Passed', bg: '#dcfce7', color: '#15803d' },
          ],
        },
        {
          stepNum: '04',
          roleTag: 'Supervisor & ERP',
          roleTagColor: '#8b5cf6',
          roleTagBg: 'rgba(139, 92, 246, 0.07)',
          title: 'Approve & Execute Direct SAP Posting',
          desc: 'Supervisor reviews QC partition, clicks Approve & Post to SAP. System creates SAP-GRPO-88910 in SAP Business One and marks PO #26000977 as Closed.',
          chips: [
            { text: 'SAP-GRPO-88910', bg: '#dcfce7', color: '#15803d' },
            { text: 'PO Closed', bg: '#fee2e2', color: '#ef4444' },
            { text: 'Audit Logged', bg: '#f1f5f9', color: '#334155' },
          ],
        },
      ],
    },
    {
      tabLabel: 'Scenario 2: Dock Discrepancy & Line Adjustment',
      summaryText: 'PO #26000980 (3,000 PCS) arrives with only 2,500 PCS (500 PCS short-shipped). Warehouse enters discrepancy remark. QC inspects 2,500 PCS. Supervisor reviews and posts 2,500 PCS partial intake to SAP. PO remains In Progress for the remaining balance.',
      timeline: [
        {
          stepNum: '01',
          roleTag: 'Procurement',
          roleTagColor: '#6366f1',
          roleTagBg: 'rgba(99, 102, 241, 0.07)',
          title: 'Create IR Schedule (IR0002)',
          desc: 'Procurement schedules PO #26000980 (3,000 PCS). IR Schedule IR0002 is dispatched to the Warehouse receiving queue.',
          chips: [
            { text: 'PO #26000980', bg: '#f1f5f9', color: '#334155' },
            { text: 'IR0002', bg: '#f1f5f9', color: '#334155' },
            { text: 'Fully Planned', bg: '#dcfce7', color: '#15803d' },
          ],
        },
        {
          stepNum: '02',
          roleTag: 'Warehouse',
          roleTagColor: '#f59e0b',
          roleTagBg: 'rgba(245, 158, 11, 0.07)',
          title: 'Flag -500 Missing Discrepancy on Dock',
          desc: 'Planned 3,000 PCS, Actual 2,500 PCS. Operator enters mandatory remark: "Supplier short-shipped 500 units on truck 1; will arrive next shipment".',
          chips: [
            { text: 'Diff: -500 Missing', bg: '#ffedd5', color: '#c2410c' },
            { text: 'Actual: 2,500 PCS', bg: '#f1f5f9', color: '#334155' },
            { text: 'GR000125', bg: '#f1f5f9', color: '#334155' },
          ],
        },
        {
          stepNum: '03',
          roleTag: 'Quality Control',
          roleTagColor: '#b49900',
          roleTagBg: 'rgba(180, 153, 0, 0.07)',
          title: 'Inspect 2,500 Delivered Units',
          desc: 'QC validates the 2,500 delivered units and approves full acceptance for received quantity.',
          chips: [
            { text: 'Acc: 2,500 PCS', bg: '#dcfce7', color: '#15803d' },
            { text: 'Rej: 0', bg: '#fee2e2', color: '#ef4444' },
            { text: 'QC Passed', bg: '#dcfce7', color: '#15803d' },
          ],
        },
        {
          stepNum: '04',
          roleTag: 'Supervisor & ERP',
          roleTagColor: '#8b5cf6',
          roleTagBg: 'rgba(139, 92, 246, 0.07)',
          title: 'Post Partial Intake to SAP ERP',
          desc: 'Supervisor approves 2,500 PCS to SAP. PO #26000980 increments received balance to 2,500/3,000 and transitions to In Progress tab awaiting remaining delivery.',
          chips: [
            { text: 'SAP-GRPO-88911', bg: '#dcfce7', color: '#15803d' },
            { text: 'PO In Progress (2,500/3,000)', bg: '#eff6ff', color: '#2563eb' },
            { text: 'Audit Logged', bg: '#f1f5f9', color: '#334155' },
          ],
        },
      ],
    },
    {
      tabLabel: 'Scenario 3: QC Rejection & Return Claim',
      summaryText: 'PO #26000984 arrives at dock. During inspection, QC identifies severe packaging damage and moisture contamination. QC issues a full Reject. The transaction routes to the QC Rejected tab in Procurement for vendor return & credit note processing.',
      timeline: [
        {
          stepNum: '01',
          roleTag: 'Procurement',
          roleTagColor: '#6366f1',
          roleTagBg: 'rgba(99, 102, 241, 0.07)',
          title: 'Create IR Schedule (IR0004)',
          desc: 'Procurement schedules PO #26000984 for delivery. IR Schedule IR0004 is dispatched to Warehouse receiving queue.',
          chips: [
            { text: 'PO #26000984', bg: '#f1f5f9', color: '#334155' },
            { text: 'IR0004', bg: '#f1f5f9', color: '#334155' },
            { text: 'Fully Planned', bg: '#dcfce7', color: '#15803d' },
          ],
        },
        {
          stepNum: '02',
          roleTag: 'Warehouse',
          roleTagColor: '#f59e0b',
          roleTagBg: 'rgba(245, 158, 11, 0.07)',
          title: 'Dock Intake & Delivery Note Match',
          desc: 'Receives physical shipment with Delivery Note DN-HX-88915. Generates GR000127 and dispatches to QC.',
          chips: [
            { text: 'DN-HX-88915', bg: '#f1f5f9', color: '#334155' },
            { text: 'GR000127', bg: '#f1f5f9', color: '#334155' },
          ],
        },
        {
          stepNum: '03',
          roleTag: 'Quality Control',
          roleTagColor: '#b49900',
          roleTagBg: 'rgba(180, 153, 0, 0.07)',
          title: 'QC Fails Inspection with Moisture Defect',
          desc: 'Inspector records defect: "Moisture contamination and crushed outer cartons on pallets 1-3". Partitions 100% to Rejected Qty.',
          chips: [
            { text: 'Acc: 0', bg: '#f1f5f9', color: '#334155' },
            { text: 'Rej: 100%', bg: '#fee2e2', color: '#ef4444' },
            { text: 'Moisture Damage', bg: '#fee2e2', color: '#ef4444' },
          ],
        },
        {
          stepNum: '04',
          roleTag: 'Procurement',
          roleTagColor: '#6366f1',
          roleTagBg: 'rgba(99, 102, 241, 0.07)',
          title: 'Vendor Return Claim & Credit Note Trigger',
          desc: 'PO moves to QC Rejected tab. Procurement triggers Vendor Return / Credit Note Claim with supplier.',
          chips: [
            { text: 'PO QC Rejected', bg: '#fee2e2', color: '#ef4444' },
            { text: 'Vendor Claim Triggered', bg: '#fefce8', color: '#854d0e' },
            { text: 'Audit Logged', bg: '#f1f5f9', color: '#334155' },
          ],
        },
      ],
    },
  ];

  const currentRole = rolePipeline[selectedRoleIndex];
  const currentScenario = scenarios[activeScenarioIndex];

  return (
    <div className="figma-inbound-flow-guide">
      {/* 1. Main Header */}
      <div className="main-header-block">
        <div className="title-area">
          <div className="title-badge-group">
            <h1 className="header-title">Interactive Inbound User Flow & Role Guide</h1>
            <div className="live-demo-badge">
              <span>Live Demo Guide</span>
            </div>
          </div>
          <p className="header-subtitle">
            End-to-end operational execution map, team role responsibilities, and interactive walkthrough scenarios.
          </p>
        </div>
      </div>

      {/* 2. Section: Operational Lifecycle Pipeline */}
      <div className="section-pipeline">
        <div className="section-title-row">
          <BranchesOutlined className="title-icon" />
          <span className="title-text">Operational Lifecycle Pipeline</span>
          <span className="title-subtext">Click a stage below to inspect specifications & open workspace</span>
        </div>

        <div className="pipeline-stepper">
          {rolePipeline.map((step, idx) => {
            const isSelected = selectedRoleIndex === idx;
            return (
              <div
                key={step.roleKey}
                className={`step-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedRoleIndex(idx)}
              >
                <div className="step-header">
                  <span className="step-number-text">Step {step.stepNumber}</span>
                  <div className={`icon-container ${isSelected ? 'selected' : ''}`}>
                    {step.icon}
                  </div>
                </div>
                <div className="step-content">
                  <div className="step-role-label">{step.roleLabel}</div>
                  <div className="step-action-title">{step.actionTitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Workspace Callout Banner */}
      <div className="workspace-callout-container">
        <div className="workspace-callout">
          <div className="workspace-left">
            <div className="pulse-badge">
              <PlayCircleOutlined style={{ fontSize: 18, color: '#b49900' }} />
            </div>
            <div className="workspace-text">
              <div className="stage-name-row">
                <span className="stage-bold">{currentRole.calloutStage}</span>
                <span className="stage-sep">—</span>
                <span className="stage-action">{currentRole.calloutTitle}</span>
              </div>
              <p className="stage-desc">{currentRole.calloutDesc}</p>
            </div>
          </div>

          <button
            className="cta-button"
            onClick={() => onNavigateToRole?.(currentRole.roleKey)}
          >
            <ExportOutlined style={{ fontSize: 14 }} />
            <span>{currentRole.btnLabel}</span>
          </button>
        </div>
      </div>

      {/* 4. 3-Column Specifications */}
      <div className="section-columns">
        {/* Col 1: Prerequisites */}
        <div className="col-card">
          <div className="col-header">
            <div className="icon-bg">
              <FileTextOutlined style={{ fontSize: 14, color: '#334155' }} />
            </div>
            <span className="col-title">Inputs & Prerequisites</span>
          </div>
          <div className="col-divider" />
          <div className="list-container">
            {currentRole.prerequisites.map((item, i) => (
              <div key={i} className="list-item">
                <span className="bullet">•</span>
                <span className="item-text">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2: Actions */}
        <div className="col-card">
          <div className="col-header">
            <div className="icon-bg">
              <ThunderboltOutlined style={{ fontSize: 14, color: '#334155' }} />
            </div>
            <span className="col-title">Core Operator Actions</span>
          </div>
          <div className="col-divider" />
          <div className="list-container">
            {currentRole.actions.map((item, i) => (
              <div key={i} className="list-item">
                <span className="bullet">•</span>
                <span className="item-text">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Outputs & Business Rules */}
        <div className="col-card">
          <div className="col-header">
            <div className="icon-bg">
              <LineChartOutlined style={{ fontSize: 14, color: '#334155' }} />
            </div>
            <span className="col-title">Direct System Outputs</span>
          </div>
          <div className="col-divider" />
          <div className="list-container">
            {currentRole.outputs.map((item, i) => (
              <div key={i} className="list-item">
                <span className="bullet">•</span>
                <span className="item-text">{item}</span>
              </div>
            ))}
          </div>

          <div className="business-rules-box">
            <div className="rule-header">
              <InfoCircleOutlined style={{ fontSize: 12, color: '#64748b' }} />
              <span className="rule-title">Business Rules</span>
            </div>
            <p className="rule-text">{currentRole.businessRules}</p>
          </div>
        </div>
      </div>

      {/* 5. Section: Walkthrough Demonstration Scenarios */}
      <div className="section-walkthroughs">
        <div className="section-header">
          <div className="header-row">
            <CompassOutlined style={{ fontSize: 18, color: '#0f172a' }} />
            <span className="header-title-text">Walkthrough Demonstration Scenarios</span>
          </div>
          <p className="header-subtext">Select a business case below to review end-to-end simulated transactions</p>
        </div>

        {/* Scenario Tabs */}
        <div className="scenario-tabs-row">
          {scenarios.map((sc, idx) => {
            const isTabActive = activeScenarioIndex === idx;
            return (
              <div
                key={idx}
                className={`scenario-tab-btn ${isTabActive ? 'active' : ''}`}
                onClick={() => setActiveScenarioIndex(idx)}
              >
                <span>{sc.tabLabel}</span>
              </div>
            );
          })}
        </div>

        {/* Scenario Detail Card */}
        <div className="scenario-detail-card">
          {/* Summary Box */}
          <div className="summary-box">
            <div className="summary-label">Scenario Summary</div>
            <p className="summary-text">
              <span className="flow-bold">Business Flow:</span> {currentScenario.summaryText}
            </p>
          </div>

          {/* Timeline Grid */}
          <div className="timeline-grid">
            {currentScenario.timeline.map((item, idx) => {
              const isLast = idx === currentScenario.timeline.length - 1;
              return (
                <div key={idx} className="timeline-row">
                  <div className="left-rail">
                    <div className="step-circle">
                      <span>{item.stepNum}</span>
                    </div>
                    {!isLast && <div className="vertical-connector-line" />}
                  </div>

                  <div className="content-area">
                    <div className="item-header">
                      <div className="role-tag" style={{ background: item.roleTagBg }}>
                        <span style={{ color: item.roleTagColor }}>{item.roleTag}</span>
                      </div>
                      <span className="item-title-text">{item.title}</span>
                    </div>

                    <p className="item-desc-text">{item.desc}</p>

                    <div className="chips-group">
                      {item.chips.map((chip, cIdx) => (
                        <div key={cIdx} className="chip-box" style={{ background: chip.bg }}>
                          <span style={{ color: chip.color }}>{chip.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
