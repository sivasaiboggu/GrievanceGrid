export type Role = 'CITIZEN' | 'MUNICIPAL_OFFICER' | 'FIELD_WORKER' | 'SENIOR_AUTHORITY';

export type ComplaintStatus = 
  | 'SUBMITTED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'AWAITING_VERIFICATION' 
  | 'RESOLVED' 
  | 'APPEALED';

export type WorkOrderStatus = 
  | 'PENDING' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'OVERDUE' 
  | 'AWAITING_VERIFICATION' 
  | 'VERIFIED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  profile?: any;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  sla_days: number;
}

export interface Jurisdiction {
  id: string;
  name: string;
  code: string;
  city: string;
}

export interface FieldWorker {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department_id?: string;
  department_name?: string;
  skill_set?: string;
  status: string;
}

export interface Attachment {
  id: string;
  complaint_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface StatusHistoryItem {
  id: string;
  complaint_id: string;
  old_status?: string;
  new_status: string;
  changed_by: string;
  changed_by_name: string;
  changed_by_role: string;
  notes?: string;
  created_at: string;
}

export interface WorkOrderEvidence {
  id: string;
  work_order_id: string;
  worker_id: string;
  worker_name?: string;
  order_number?: string;
  file_url: string;
  file_name: string;
  evidence_type: 'BEFORE' | 'IN_PROGRESS' | 'AFTER' | 'SITE_COMPLIANCE';
  remarks?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface WorkOrderUpdate {
  id: string;
  work_order_id: string;
  worker_id: string;
  worker_name?: string;
  status_update: string;
  remarks: string;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  complaint_id: string;
  complaint_tracking_id?: string;
  complaint_title?: string;
  complaint_description?: string;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  complaint_status?: ComplaintStatus;
  order_number: string;
  assigned_to?: string;
  assigned_worker_name?: string;
  assigned_worker_phone?: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  priority: Priority;
  status: WorkOrderStatus;
  instructions?: string;
  deadline?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  verified_at?: string;
  verified_by?: string;
  verified_by_name?: string;
  evidence_count?: number;
}

export interface IssueItem {
  id?: string;
  complaint_id?: string;
  issue_number?: number;
  category: string;
  description: string;
  status?: string;
  coverage_status?: string;
}

export interface Complaint {
  id: string;
  tracking_id: string;
  tracking_number?: string;
  citizen_id: string;
  citizen_name?: string;
  citizen_phone?: string;
  citizen_email?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  priority: Priority;
  status: ComplaintStatus;
  assigned_department?: string;
  department_name?: string;
  department_code?: string;
  jurisdiction?: string;
  jurisdiction_name?: string;
  deadline?: string;
  created_at: string;
  updated_at?: string;
  attachments_count?: number;
  work_orders_count?: number;
  issues?: IssueItem[];
  attachments?: any[];
}

export interface Feedback {
  id: string;
  complaint_id: string;
  citizen_id: string;
  rating: number;
  comments?: string;
  created_at: string;
}

export interface Appeal {
  id: string;
  complaint_id: string;
  citizen_id: string;
  reason: string;
  status: 'PENDING' | 'REOPENED' | 'REJECTED';
  officer_notes?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'ASSIGNMENT' | 'UPDATE' | 'VERIFICATION' | 'DEADLINE' | 'RESOLUTION' | 'APPEAL';
  entity_type?: 'COMPLAINT' | 'WORK_ORDER';
  entity_id?: string;
  is_read: number;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string;
  actor_name: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  created_at: string;
}

export interface DashboardStats {
  newComplaints: number;
  pendingAssignment: number;
  activeWorkOrders: number;
  awaitingFieldUpdate: number;
  awaitingVerification: number;
  overdue: number;
  totalResolved: number;
  totalAppeals: number;
}
