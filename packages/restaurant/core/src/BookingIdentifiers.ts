export class BookingIdentifiers {
  static readonly reservationRepository = Symbol.for('ReservationRepository');
  static readonly tableRepository = Symbol.for('TableRepository');
  static readonly memberRepository = Symbol.for('MemberRepository');
  static readonly sessionRepository = Symbol.for('SessionRepository');
  static readonly passwordHasher = Symbol.for('PasswordHasher');
  static readonly activityLogRepository = Symbol.for('ActivityLogRepository');
  static readonly reviewRepository = Symbol.for('ReviewRepository');
  static readonly blogArticleRepository = Symbol.for('BlogArticleRepository');
  static readonly menuItemRepository = Symbol.for('MenuItemRepository');
}
