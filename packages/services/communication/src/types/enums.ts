export enum CommunicationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum CommunicationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

export enum NotificationType {
  SESSION_INVITATION = 'session_invitation',
  SESSION_CANCELLED = 'session_cancelled',
  SESSION_REMINDER = 'session_reminder',
  WAITING_LIST = 'waiting_list',
  INDUCTION_REQUEST = 'induction_request',
  INDUCTION_STATUS = 'induction_status',
  REVIEW_REQUEST = 'review_request',
  GENERAL = 'general',
}

export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum TemplateCategory {
  SESSION = 'session',
  INDUCTION = 'induction',
  PROFESSIONAL = 'professional',
  ADMIN = 'admin',
  SYSTEM = 'system',
}
