/**
 * Domain model for user booking statistics
 */
export interface UserBookingStatsDomain {
  userId: string
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  declinedBookings: number
  upcomingBookings: number
  totalSpent: number
  lastBookingDate?: Date
  lastBookingId?: string
  lastBookingGymId?: string
  lastBookingStatus?: string
}

/**
 * Domain model for booking statistics summary
 */
export interface BookingStatsSummaryDomain {
  completionRate: number
  cancellationRate: number
  declinedRate: number
  averageSpent: number
}
