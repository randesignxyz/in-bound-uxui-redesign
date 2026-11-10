import moment, { Moment } from 'moment';
import { LookupDataItem, MenuItem } from '../data';

export interface BMPNData {
  id: string;
  bpmn20Xml: string;
  processDef?: ProcessInstanceDef;
}

export interface DiagramData {
  id: string;
  bpmn20Xml: string;
  status: string;
  taskList: { taskId: string; taskDefKey: string; isActive: boolean }[];
}

export interface processDefType {
  id: string;
  name: string;
}

export interface LookupData {
  value: string | number;
  display: string;
  description?: string;
}

export interface ProcessInstanceDef extends MenuItem {
  id: string;
  key: string;
  category: string;
  description?: string;
  name: string;
  version: number;
  resource: string;
  deploymentId: string;
  diagram: string;
  suspended: true;
  tenantId: string;
  versionTag: string;
  historyTimeToLive: number;
  startFormKey?: string;
  selectedCompany: CompanyData;
}

export type ProcessDefInfo = {
  id: string;
  shortName?: string;
  description?: string;
  department?: LookupDataItem;
  urlPath?: string;
  bizKeyFormat?: string;
  increment?: number;
  shownInEForms?: boolean;
  startFormInNewPage: boolean;
  liveDate?: Moment;
  announcementDays?: number;
  accessRole?: string;
}

export interface ProcessInstanceDefItem {
  id: string;
  key: string;
  category: string;
  description?: string;
  name: string;
  version: number;
  resource: string;
  deploymentId: string;
  diagram: string;
  suspended: true;
  tenantId: string;
  startFormKey?: string;
  companyList: CompanyData[];
  urlPath?: string;
  shortName?: string;
  departmentList: { name: string }[],
  startFormInNewPage?: boolean,
  liveDate?: Moment,
  announcementDays?: number
}

export interface CompanyData {
  id: number;
  code: string;
  name: string;
}

export interface RequestorData {
  id: string;
  name: string;
  email?: string;
  function: string;
  manager: string;
}

export interface Employee {
  id: number;
  empNo: string;
  firstName: string;
  lastName: string;
  internalName: string;
  department: string;
  subDepartment?: string;
  hod: string;
  jobTitle: string;
  reportTo: string;
  buId: number;
  buName: string;
}

export interface UserResult {
  id: string;
  name: string;
  email: string;
  employeeList?: Employee[];
  employee?: Employee;
}

export interface SaveWorkflowOriginator {
  processDefId: string;
  companyList: number[];
  originators: SaveOriginator[];
  notificationFeedbacks?: string[];
}

export interface DestUser {
  userId: string;
  userName?: string;
  email?: string;
}


export interface Delegation {
  id: number;
  approver: LookupDataItem
  delegateUser?: LookupDataItem
  effectiveDate: Moment
  expiryDate?: Moment
  remarks: string;
}

export interface DelegationSaveParams {
  taskDefId: string;
  approver: string,
  delegateTo: string,
  effectiveDate: Moment
  expiryDate?: Moment
  remarks: string;
}

export interface DestGroup {
  groupId: string;
  groupName?: string;
}

export interface DestinationUsers {
  assignee?: DestUser;
  candidateUsers?: DestUser[];
  candidateGroups?: DestGroup[];
}

export interface SaveDestinationUsers {
  assigneeId: string;
  candidateUsersId: string[];
  candidateGroupsId: string[];
}

export interface TaskDestination {
  userTaskId: string;
  destination: DestinationUsers;
}

export interface OriginatorAuth {
  companyList: number[];
  originatorList: Originator[];
  notificationFeedbacks?: string[];
}

export interface Originator {
  id: string;
  name: string;
  type: 'user' | 'group';
}

export interface SaveFirstLevelCandidateUser {
  includingDeptHead: boolean;
  candidates: DestUser[];
  custom?: CustomCandidateUser[];
}

export interface ApprovalSetup {
  originator: Originator;
  assignee?: DestUser;
  candidateUsers: DestUser[];
  candidateGroups: DestGroup[];
  type: 'assignee' | 'candidateUsers' | 'candidateGroups';
}

export interface CustomAssignee {
  originator: Originator;
  assignee: DestUser;
}

export interface DestDefSelector {
  userId: string;
  selectorType: string;
  operand: string;
  dataType: String;
  selectorValue: string;
  remarks?: string;
}

export interface WorkflowOption {
  id?: number;
  type: string;
  value: string;
}

export interface SaveFirstLevelApproval {
  taskDefId: string;
  taskName?: string;
  assignee: SaveFirstLevelAssignee;
  candidateUser?: SaveFirstLevelCandidateUser;
  candidateGroup?: SaveFirstLevelCandidateGroup;
  mailTemplate?: MailTemplate;
  // notificationFeedbacks?: string[];
  notifications: Notificaton[];
  optionList: WorkflowOption[];
  availableCandidateList: DestUser[];

  // modifyPayload?: boolean;
}

export interface Notificaton {
  id?: number;
  type: string;
  channel: string;
  messageTemplateId: number;
  destSelectorList?: DestDefSelector[]
}

export interface MailTemplate {
  subject: string;
  body: string;
  bcc?: string;
}

export interface SaveFirstLevelAssignee {
  departmentHead: boolean;
  originator: boolean;
  defaultAssignee?: DestUser;
  originator?: boolean;
  custom?: CustomAssignee[];
  destSelectorList?: DestDefSelector[];
  internal?: boolean
}

export interface CustomCandidateUser {
  originator: Originator;
  candidates: DestUser[];
}

export interface SaveFirstLevelCandidateGroup {
  candidates: DestGroup[];
  custom?: CustomCandidateGroup[];
}

export interface CustomCandidateGroup {
  originator: Originator;
  candidates: DestGroup[];
}

export interface ProcessInstance {
  procInstId: string;
  procDefId: string;
  procDefKey: string;
  businessKey: string;
  startUserId: string;
  startUserInfo?: UserResult;
  startTime: number;
  endTime?: number;
  procName: string;
  currTaskKey?: string;
  currTaskName?: string;
  state: string;
  tenant?: string;
  completed: boolean;
}

export interface ProcessInstanceData<T> {
  requestor?: UserResult;
  processInstance?: ProcessInstance;
  task?: UserTask;
  data?: T;
  activities: Activity[];
  attachmentFiles: { fileId: string, activity: string }[];
  subTasks: UserTask[];
}

export interface ProcessInstanceCreatedData {
  processInstanceId: string;
  processDefId: string;
  businessKey: string;
  createdDate: number;
}

interface TakenAction {
  task: UserTask;
  actionName: string;
  actionType: 'manualTask' | 'claim' | 'unClaim' | 'viewDiagram';
}

export interface TaskFilter {
  id: string;
  resourceType: string;
  name: string;
  owner: string;
  query: {
    taskVariables: string[];
    processVariables: string[];
    caseInstanceVariables: string[];
    orQueries: string[];
    properties: string[];
  };
}

export interface UserTask {
  taskId: string;
  id: string;
  taskDefKey: string;
  owner: string;
  assignee: string;
  formKey?: string;
  taskName: string;
  title: string;
  avatar: string;
  cover: string;
  logo: string;
  href: string;
  body?: any;
  updatedAt: number;
  created: moment.Moment;
  ended?: moment.Moment;
  subDescription: string;
  description?: string;
  content: string;
  claimed: boolean;
  completed: boolean;
  actions: ActionDataType[];
  assigneeInfo?: UserResult;
  createSubTask: boolean;
  subTask: boolean;
  subTaskName?: string;
  subTasks?: { id: string, assignee?: string, created: Moment }[];
  instanceInfo: {
    processName: string;
    businessKey: string;
    processInstanceId: string;
    processDefId: string;
    processDefKey: string;
    submittedDate: moment.Moment;
    instanceComment?: string;
    workflowAttrs?: InstanceAttr[];
  }
}

export interface InstanceAttr {
  id: number;
  recordId: number;
  name: string;
  intValue?: number;
  stringValue?: string;
  decimalValue?: number;
}

export interface StartProcessAction {
  requestorId: string;
  buId: number;
  processDefKey: string;
  comment?: string;
  payloadType: string;
  payloadData: any;
  uploadedFiles: string[];
}

export interface AmendProcessAction {
  processInstanceId: string;
  requestorId: string;
  payloadType: string;
  payloadData: any;
  uploadedFiles: string[];
  comment?: string;
}

export interface ActionData {
  taskId: string;
  action: string;
  comment?: string;
  payloadType?: string;
  payloadData?: any;
  uploadedFiles: string[];
  fetchCurrentTask?: boolean;
}

export interface ActionDataType {
  value: string;
  name: string;
  groupName: string;
}

export interface UserDestItem {
  userId: string;
  firstName?: string;
  lastName?: string;
  empNo?: string;
  startedDate: moment.Moment;
  endedDate?: moment.Moment;
}

export interface InstanceSearchParams {
  state: string;
  searchValue?: string;
}

export interface ConfigEndEventParams {
  eventId: string;
  notifications: Notificaton[];
  notifyUsers?: string[];
}

export interface ConfigEndEventRs {
  eventId: string;
  notifications: Notificaton[];
  notifyUsers: DestUser[];
}

interface NotificationFeedback {
  destinations: NotificationDestination[];
  notificationTemplates: NotificationTemplate[];
}

interface NotificationDestination {
  id: number | string;
  userId: string;
  name: string;
  description?: string;
  type: 'user' | 'group';
}

export interface NotificationFeedbackData {
  processDefId: string;
  dest: { refId: string; group: boolean }[];
  templates: NotificationTemplate[];
}

type Source = 'WorkList' | 'Edit' | 'Customer' | 'Contract' | 'settlement' | 'Requisition';

export interface UserDestItem {
  userId: string;
  firstName?: string;
  lastName?: string;
  empNo?: string;
  startedDate: moment.Moment;
  endedDate?: moment.Moment;
}

export interface Activity {
  id: string;
  taskName: string;
  action: string;
  actionBy: string;
  actionDate: moment.Moment;
  comment?: string;
}

export interface AttachmentFile {
  id: string;
  fileName: string;
  fileType: string;
  createdDate: moment.Moment;
}

export interface LookupData {
  value: string | number;
  display: string;
  description?: string;
}

export interface MessageTemplate {
  id: number;
  name: string;
}

export interface ActivityEx {
  id: string;
  taskName: string;
  action: string;
  actionBy: string;
  actionDate: moment.Moment;
  comment?: string;
  instanceId: string;
}

export interface InstanceActivity {
  instanceId: string;
  activities: ActivityEx[];
}
