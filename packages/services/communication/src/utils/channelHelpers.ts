import {
  CommunicationChannel,
  type CommunicationChannelType,
} from '@pika/types'

/**
 * Channel delivery status interface
 */
export interface ChannelStatus {
  sent: number
  failed: number
}

/**
 * Normalizes channel names to standard enum format
 * @param channels - Array of channel names (case insensitive)
 * @returns Array of normalized channel types
 */
function normalizeChannels(channels: string[]): CommunicationChannelType[] {
  const normalized: CommunicationChannelType[] = []

  for (const channel of channels) {
    const lowerChannel = channel.toLowerCase()

    if (lowerChannel === 'inapp' || lowerChannel === 'in_app') {
      normalized.push(CommunicationChannel.IN_APP)
    } else if (lowerChannel === 'email') {
      normalized.push(CommunicationChannel.EMAIL)
    } else if (lowerChannel === 'push') {
      normalized.push(CommunicationChannel.PUSH)
    } else if (lowerChannel === 'sms') {
      normalized.push(CommunicationChannel.SMS)
    }
  }

  return normalized
}

/**
 * Creates a safe channel results object to avoid object injection
 * @param channels - Array of channels (accepts both formats)
 * @param recipientCount - Number of recipients
 * @returns Safe channel results object
 */
export function createChannelResults(
  channels: (CommunicationChannelType | string)[] = [
    CommunicationChannel.IN_APP,
  ],
  recipientCount: number = 0,
): Record<CommunicationChannelType, ChannelStatus> {
  const results = {} as Record<CommunicationChannelType, ChannelStatus>

  // Normalize channels to standard format
  const normalizedChannels = normalizeChannels(channels as string[])

  // Use explicit checks to avoid object injection
  for (const channel of normalizedChannels) {
    if (channel === CommunicationChannel.IN_APP) {
      results[CommunicationChannel.IN_APP] = { sent: recipientCount, failed: 0 }
    } else if (channel === CommunicationChannel.EMAIL) {
      results[CommunicationChannel.EMAIL] = { sent: recipientCount, failed: 0 }
    } else if (channel === CommunicationChannel.PUSH) {
      results[CommunicationChannel.PUSH] = { sent: recipientCount, failed: 0 }
    } else if (channel === CommunicationChannel.SMS) {
      results[CommunicationChannel.SMS] = { sent: recipientCount, failed: 0 }
    }
  }

  return results
}
