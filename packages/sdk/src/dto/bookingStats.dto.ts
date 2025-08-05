/**
 * DTO for user booking statistics
 */
export interface UserBookingStatsDTO {
  userId: string
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  declinedBookings: number
  upcomingBookings: number
  totalSpent: number
  lastBookingDate?: string
  lastBookingId?: string
  lastBookingGymId?: string
  lastBookingStatus?: string
}

/**
 * DTO for booking statistics summary
 */
export interface BookingStatsSummaryDTO {
  completionRate: number
  cancellationRate: number
  declinedRate: number
  averageSpent: number
}
