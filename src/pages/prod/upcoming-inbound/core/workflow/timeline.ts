import type {
  GoodsReceipt,
  GRActivity,
  InboundProcessState,
} from '../type';
import { workflowPath, officialStateLabel } from '../constants';
import { getReceiptDisplayStatus } from './goods-receipt';

function getActivityText(activity?: Pick<GRActivity, 'title' | 'description'>) {
  return `${activity?.title || ''} ${activity?.description || ''}`.trim();
}

function getActivitySecondaryText(performedBy?: string) {
  const normalizedActor = performedBy?.trim();
  return normalizedActor ? `by ${normalizedActor}` : undefined;
}

function shouldUsePassBranchTimeline(receipt: GoodsReceipt) {
  if (!receipt.qcResult?.trim().toLowerCase().includes('pass')) {
    return false;
  }

  return [
    'PENDING_SUPERVISOR_REVIEW',
    'SUPERVISOR_APPROVED',
    'SAP_SYNCED',
    'SAP_STAGED',
  ].includes(receipt.processState);
}

function isRejectedBranchActivity(activity: GRActivity) {
  const activityText = getActivityText(activity).toLowerCase();

  return (
    activity.processState === 'CORRECTION_REQUIRED' ||
    activity.processState === 'MISMATCH_EXCEPTION' ||
    activityText.includes('qc rejected') ||
    activityText.includes('rejected during qc') ||
    activityText.includes('returned for correction') ||
    activityText.includes('correction required')
  );
}

function isCorrectionCycleActivity(activity: GRActivity) {
  const activityText = getActivityText(activity).toLowerCase();

  return (
    activity.processState === 'CORRECTION_REQUIRED' ||
    activity.processState === 'MISMATCH_EXCEPTION' ||
    activityText.includes('qc rejected') ||
    activityText.includes('supervisor rejected') ||
    activityText.includes('rejected during qc') ||
    activityText.includes('correction required')
  );
}

function isSkipQcActivityText(activityText: string) {
  const normalizedText = activityText.toLowerCase();
  return normalizedText.includes('skip qc') || normalizedText.includes('skipped qc');
}

function isMergeActivityText(activityText: string) {
  const normalizedText = activityText.toLowerCase();
  return normalizedText.includes('merge') || normalizedText.includes('merged');
}

function removeStaleSkipQcAfterCorrection(activities: GRActivity[]) {
  let latestCorrectionIndex = -1;

  activities.forEach((activity, index) => {
    if (isCorrectionCycleActivity(activity)) {
      latestCorrectionIndex = index;
    }
  });

  if (latestCorrectionIndex < 0) {
    return activities;
  }

  let hasNonSkipSupervisorReviewAfterCorrection = false;

  return activities.filter((activity, index) => {
    if (index <= latestCorrectionIndex) {
      return true;
    }

    const activityText = getActivityText(activity);
    const isSupervisorReviewActivity = activity.processState === 'PENDING_SUPERVISOR_REVIEW';
    const isSkipOrMergeActivity =
      isSkipQcActivityText(activityText) || isMergeActivityText(activityText);

    if (isSupervisorReviewActivity && isSkipOrMergeActivity) {
      return !hasNonSkipSupervisorReviewAfterCorrection;
    }

    if (isSupervisorReviewActivity) {
      hasNonSkipSupervisorReviewAfterCorrection = true;
    }

    return true;
  });
}

function collapseDuplicateResubmissionActivities(activities: GRActivity[]) {
  const seenResubmissionStates = new Set<InboundProcessState>();
  const normalizedActivities: GRActivity[] = [];

  activities.forEach((activity) => {
    if (isCorrectionCycleActivity(activity)) {
      seenResubmissionStates.clear();
    }

    if (
      activity.processState === 'GRPO_DRAFT' ||
      activity.processState === 'QC_PENDING'
    ) {
      if (seenResubmissionStates.has(activity.processState)) {
        return;
      }
      seenResubmissionStates.add(activity.processState);
    }

    normalizedActivities.push(activity);
  });

  return normalizedActivities;
}

function getTimelineSourceActivities(receipt: GoodsReceipt) {
  const normalizeActivities = (activities: GRActivity[]) =>
    collapseDuplicateResubmissionActivities(removeStaleSkipQcAfterCorrection(activities));

  if (receipt.activities.some(isCorrectionCycleActivity)) {
    return normalizeActivities(receipt.activities);
  }

  if (!shouldUsePassBranchTimeline(receipt)) {
    return normalizeActivities(receipt.activities);
  }

  return normalizeActivities(receipt.activities.filter((activity) => !isRejectedBranchActivity(activity)));
}

function resolveHistoricalTimelineTitle(
  processState: InboundProcessState,
  description: string,
) {
  const normalizedDescription = description.toLowerCase();

  if (processState === 'CORRECTION_REQUIRED') {
    if (normalizedDescription.includes('supervisor rejected')) {
      return 'Supervisor Rejected';
    }

    if (
      normalizedDescription.includes('qc rejected') ||
      normalizedDescription.includes('rejected during qc')
    ) {
      return 'QC Rejected';
    }
  }

  return officialStateLabel[processState];
}

export function getGoodsReceiptWorkflowProgress(receipt: GoodsReceipt) {
  const workflowProgressByState: Partial<Record<InboundProcessState, number>> = {
    GRPO_DRAFT: 25,
    QC_PENDING: 50,
    CORRECTION_REQUIRED: 50,
    MISMATCH_EXCEPTION: 50,
    QC_PASSED: 75,
    PENDING_SUPERVISOR_REVIEW: 75,
    MERGED_TO_SUPERVISOR_REVIEW: 75,
    SUPERVISOR_APPROVED: 100,
    SAP_SYNCED: 100,
    TRANSFERRED_TO_PM_RM_WH: 100,
    FIN_SUBMITTED: 100,
    DAILY_CLOSED: 100,
    MONTHLY_SUMMARY_READY: 100,
  };

  return workflowProgressByState[receipt.processState] ?? 0;
}

function getVisibleWorkflowState(processState: InboundProcessState): InboundProcessState {
  switch (processState) {
    case 'SAP_SYNCED':
    case 'TRANSFERRED_TO_PM_RM_WH':
    case 'FIN_SUBMITTED':
    case 'DAILY_CLOSED':
    case 'MONTHLY_SUMMARY_READY':
      return 'SUPERVISOR_APPROVED';
    case 'MERGED_TO_SUPERVISOR_REVIEW':
      return 'PENDING_SUPERVISOR_REVIEW';
    default:
      return processState;
  }
}

export function buildActivities(
  processState: InboundProcessState,
  createdDate: string,
  stepTitle: string,
  displayStatus?: string,
): GRActivity[] {
  const currentDisplayStatus = displayStatus?.trim() || officialStateLabel[getVisibleWorkflowState(processState)];

  if (processState === 'MISMATCH_EXCEPTION') {
    return [
      {
        title: officialStateLabel.GRPO_DRAFT,
        description: officialStateLabel.GRPO_DRAFT,
        timestamp: createdDate,
        state: 'done',
        processState: 'GRPO_DRAFT',
      },
      {
        title: currentDisplayStatus,
        description: stepTitle,
        timestamp: createdDate,
        state: 'active',
        processState: 'MISMATCH_EXCEPTION',
      },
      {
        title: officialStateLabel.QC_PENDING,
        description: 'Blocked until corrected',
        timestamp: '',
        state: 'locked',
        processState: 'QC_PENDING',
      },
      {
        title: officialStateLabel.PENDING_SUPERVISOR_REVIEW,
        description: 'Blocked until QC is completed',
        timestamp: '',
        state: 'locked',
        processState: 'PENDING_SUPERVISOR_REVIEW',
      },
    ];
  }

  if (processState === 'CORRECTION_REQUIRED') {
    return [
      {
        title: officialStateLabel.QC_PENDING,
        description: 'Submitted to QC',
        timestamp: createdDate,
        state: 'done',
        processState: 'QC_PENDING',
      },
      {
        title: currentDisplayStatus,
        description: stepTitle,
        timestamp: createdDate,
        state: 'active',
        processState: 'CORRECTION_REQUIRED',
      },
      {
        title: officialStateLabel.QC_PENDING,
        description: 'Waiting for resubmission',
        timestamp: '',
        state: 'locked',
        processState: 'QC_PENDING',
      },
      {
        title: officialStateLabel.PENDING_SUPERVISOR_REVIEW,
        description: 'Pending QC pass',
        timestamp: '',
        state: 'locked',
        processState: 'PENDING_SUPERVISOR_REVIEW',
      },
    ];
  }

  const visibleState = getVisibleWorkflowState(processState);
  const currentIndex = workflowPath.indexOf(visibleState);
  const lastIndex = workflowPath.length - 1;
  const currentDescription = visibleState === processState ? stepTitle : officialStateLabel[visibleState];

  return workflowPath.map((state, index) => ({
    title: index === currentIndex ? currentDisplayStatus : officialStateLabel[state],
    description: index === currentIndex ? currentDescription : officialStateLabel[state],
    timestamp: index <= currentIndex ? createdDate : '',
    processState: state,
    state:
      index < currentIndex || (currentIndex === lastIndex && index === currentIndex)
        ? 'done'
        : index === currentIndex
          ? 'active'
          : 'locked',
  }));
}

function mapActivityProcessStateToTimelineStates(
  processState: InboundProcessState | undefined,
): InboundProcessState[] {
  if (!processState) return [];

  switch (processState) {
    case 'PENDING_SUPERVISOR_REVIEW':
      return ['QC_PASSED', 'PENDING_SUPERVISOR_REVIEW'];
    case 'MERGED_TO_SUPERVISOR_REVIEW':
      return ['QC_PASSED', 'PENDING_SUPERVISOR_REVIEW'];
    case 'MISMATCH_EXCEPTION':
      return ['CORRECTION_REQUIRED'];
    case 'TRANSFERRED_TO_PM_RM_WH':
    case 'SAP_SYNCED':
    case 'FIN_SUBMITTED':
    case 'DAILY_CLOSED':
    case 'MONTHLY_SUMMARY_READY':
      return ['SUPERVISOR_APPROVED'];
    default:
      return [processState];
  }
}

type TimelineState = {
  processState: InboundProcessState;
  title: string;
  description: string;
  performedBy?: string;
  timestamp: string;
};

function appendTimelineState(
  items: TimelineState[],
  processState: InboundProcessState,
  title: string,
  description: string,
  timestamp: string,
  replacePrevious = true,
) {
  const previous = items[items.length - 1];
  if (replacePrevious && previous?.processState === processState) {
    items[items.length - 1] = {
      processState,
      title,
      description,
      timestamp: timestamp || previous.timestamp,
    };
    return;
  }

  items.push({ processState, title, description, timestamp });
}

function appendSkipQcTimelineStates(items: TimelineState[], activity: GRActivity) {
  appendTimelineState(
    items,
    'PENDING_SUPERVISOR_REVIEW',
    activity.title || 'Skip QC',
    activity.description || activity.title || 'Skip QC',
    activity.timestamp,
    false,
  );

  const skipQcActivity = items[items.length - 1];
  if (skipQcActivity?.processState === 'PENDING_SUPERVISOR_REVIEW') {
    skipQcActivity.performedBy = activity.performedBy;
  }

  appendTimelineState(
    items,
    'PENDING_SUPERVISOR_REVIEW',
    'Supervisor Pending',
    officialStateLabel.PENDING_SUPERVISOR_REVIEW,
    activity.timestamp,
    false,
  );
}

function timelineEndsWithStates(
  items: TimelineState[],
  states: InboundProcessState[],
): boolean {
  if (states.length === 0 || items.length < states.length) return false;

  const offset = items.length - states.length;
  return states.every((state, index) => items[offset + index]?.processState === state);
}

export function buildReceiptTimelineActivities(receipt: GoodsReceipt): GRActivity[] {
  if (!receipt.activities?.length) {
    return buildActivities(
      receipt.processState,
      receipt.createdDate,
      receipt.scenario.stepTitle || officialStateLabel[getVisibleWorkflowState(receipt.processState)],
      getReceiptDisplayStatus(receipt),
    );
  }

  const timelineSourceActivities = getTimelineSourceActivities(receipt);
  const timelineStates: TimelineState[] = [];

  for (const baseState of ['RECEIVED_CHECKING', 'RECEIPT_CONFIRMED', 'STORED_ON_HOLD'] as InboundProcessState[]) {
    appendTimelineState(
      timelineStates,
      baseState,
      officialStateLabel[baseState],
      officialStateLabel[baseState],
      receipt.createdDate,
    );
  }

  timelineSourceActivities.forEach((activity) => {
    const activityText = getActivityText(activity);
    const isSkipQcActivity =
      activity.processState === 'PENDING_SUPERVISOR_REVIEW' && isSkipQcActivityText(activityText);
    if (isSkipQcActivity) {
      appendSkipQcTimelineStates(timelineStates, activity);
      return;
    }

    const expandedStates = mapActivityProcessStateToTimelineStates(activity.processState);
    if (!expandedStates.length) return;

    expandedStates.forEach((state, index) => {
      const isDerivedQcPassed =
        state === 'QC_PASSED' && activity.processState === 'PENDING_SUPERVISOR_REVIEW' && index === 0;
      const shouldUseActivityTextForTimelineState =
        state === 'PENDING_SUPERVISOR_REVIEW' && isSkipQcActivityText(activityText);
      const title = shouldUseActivityTextForTimelineState
        ? activity.title || officialStateLabel[state]
        : isDerivedQcPassed
        ? isSkipQcActivity
          ? activity.title || 'Skip QC'
          : officialStateLabel.QC_PASSED
        : resolveHistoricalTimelineTitle(state, activityText);
      const description = shouldUseActivityTextForTimelineState
        ? activity.description || activity.title || officialStateLabel[state]
        : isDerivedQcPassed
        ? isSkipQcActivity
          ? activity.description || activity.title || 'Skip QC'
          : officialStateLabel.QC_PASSED
        : activity.description || activity.title;

      appendTimelineState(
        timelineStates,
        state,
        title,
        description,
        activity.timestamp,
      );

      const latestTimelineState = timelineStates[timelineStates.length - 1];
      if (latestTimelineState?.processState === state) {
        latestTimelineState.performedBy = activity.performedBy;
      }
    });
  });

  const hasSkipQcHistory = timelineSourceActivities.some((activity) => {
    const activityText = getActivityText(activity);
    return (
      activity.processState === 'PENDING_SUPERVISOR_REVIEW' &&
      isSkipQcActivityText(activityText)
    );
  });
  const currentTimelineStates =
    receipt.processState === 'PENDING_SUPERVISOR_REVIEW' && hasSkipQcHistory
      ? (['PENDING_SUPERVISOR_REVIEW'] as InboundProcessState[])
      : mapActivityProcessStateToTimelineStates(receipt.processState);
  const currentVisibleState =
    currentTimelineStates[currentTimelineStates.length - 1] || getVisibleWorkflowState(receipt.processState);

  const currentStateAlreadyRepresented = timelineEndsWithStates(timelineStates, currentTimelineStates);

  if (!currentStateAlreadyRepresented) {
    currentTimelineStates.forEach((state) => {
      appendTimelineState(
        timelineStates,
        state,
        state === currentVisibleState
          ? getReceiptDisplayStatus(receipt)
          : officialStateLabel[state],
        state === currentVisibleState
          ? receipt.scenario.stepTitle || officialStateLabel[state]
          : officialStateLabel[state],
        receipt.createdDate,
      );
    });
  }

  const futureStates =
    currentVisibleState === 'CORRECTION_REQUIRED'
      ? (['GRPO_DRAFT', 'QC_PENDING', 'QC_PASSED', 'PENDING_SUPERVISOR_REVIEW', 'SUPERVISOR_APPROVED'] as InboundProcessState[])
      : workflowPath.slice(Math.max(workflowPath.indexOf(currentVisibleState) + 1, 0));

  futureStates.forEach((state) => {
    appendTimelineState(
      timelineStates,
      state,
      officialStateLabel[state],
      officialStateLabel[state],
      '',
    );
  });

  let activeIndex = -1;
  for (let index = timelineStates.length - 1; index >= 0; index -= 1) {
    if (timelineStates[index].processState === currentVisibleState) {
      activeIndex = index;
      break;
    }
  }
  const finalWorkflowState = workflowPath[workflowPath.length - 1];

  return timelineStates.map((item, index) => ({
    title:
      index === activeIndex
        ? item.title &&
          item.title !== officialStateLabel[item.processState] &&
          item.title !== getReceiptDisplayStatus(receipt)
          ? item.title
          : getReceiptDisplayStatus(receipt)
        : item.title || resolveHistoricalTimelineTitle(item.processState, item.description || ''),
    description: item.description || officialStateLabel[item.processState],
    performedBy: item.performedBy,
    secondaryText: getActivitySecondaryText(item.performedBy),
    timestamp: item.timestamp,
    processState: item.processState,
    state:
      index < activeIndex || (item.processState === finalWorkflowState && currentVisibleState === finalWorkflowState)
        ? 'done'
        : index === activeIndex
          ? 'active'
          : 'locked',
  }));
}
