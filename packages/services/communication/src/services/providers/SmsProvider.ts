export interface SmsProvider {
  sendSms(params: SmsParams): Promise<SmsResult>
  sendBulkSms(params: BulkSmsParams): Promise<BulkSmsResult>
  getProviderName(): string
  isAvailable(): Promise<boolean>
}

export interface SmsParams {
  to: string // Phone number in E.164 format
  from?: string // Sender ID or phone number
  message: string
  metadata?: Record<string, any>
}

export interface BulkSmsParams {
  recipients: Array<{
    to: string
    message?: string // Optional per-recipient message
    metadata?: Record<string, any>
  }>
  from?: string
  defaultMessage?: string
}

export interface SmsResult {
  messageId: string
  provider: string
  status: 'sent' | 'queued' | 'failed'
  metadata?: any
}

export interface BulkSmsResult {
  successful: SmsResult[]
  failed: Array<{
    recipient: string
    error: string
  }>
  provider: string
}
