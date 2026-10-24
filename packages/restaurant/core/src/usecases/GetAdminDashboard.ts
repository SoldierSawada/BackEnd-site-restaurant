import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { MemberRepository } from '../repositories/MemberRepository';
import { ReservationRepository } from '../repositories/ReservationRepository';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { TableRepository } from '../repositories/TableRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';
import { computeAverageRating } from './ReviewStatistics';

export interface AdminDashboard {
  todayReservations: number;
  upcomingReservations: number;
  memberCount: number;
  openTables: number;
  totalTables: number;
  review: {
    average: number | null;
    count: number;
  };
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@injectable()
export class GetAdminDashboard implements Usecase<void, AdminDashboard> {
  constructor(
    @inject(BookingIdentifiers.reservationRepository)
    private readonly reservationRepository: ReservationRepository,

    @inject(BookingIdentifiers.tableRepository)
    private readonly tableRepository: TableRepository,

    @inject(BookingIdentifiers.memberRepository)
    private readonly memberRepository: MemberRepository,

    @inject(BookingIdentifiers.reviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(): Promise<AdminDashboard> {
    const now = new Date();
    const todayKey = dayKey(now);

    const allReservations = await this.reservationRepository.findAll();
    const reservations = allReservations.filter(
      (reservation) => reservation.getStatus() === 'CONFIRMED',
    );
    const members = await this.memberRepository.findAll();
    const tables = await this.tableRepository.findAll();
    const reviewStats = await this.reviewRepository.getStats();

    const todayReservations = reservations.filter(
      (reservation) => dayKey(reservation.props.reservationDate) === todayKey,
    ).length;
    const upcomingReservations = reservations.filter(
      (reservation) => reservation.props.startTime.getTime() > now.getTime(),
    ).length;

    const clients = members.filter(
      (member) => member.getRole() === 'MEMBER' && member.isActive(),
    );

    return {
      todayReservations,
      upcomingReservations,
      memberCount: clients.length,
      openTables: tables.filter((table) => table.getIsActive()).length,
      totalTables: tables.length,
      review: {
        average: computeAverageRating(reviewStats),
        count: reviewStats.count,
      },
    };
  }
}
