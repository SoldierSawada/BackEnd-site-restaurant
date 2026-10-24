import { inject, injectable } from 'inversify';
import { Usecase } from 'ddd';

import { ReservationRepository } from '../repositories/ReservationRepository';
import { BookingIdentifiers } from '../BookingIdentifiers';

export interface GetReservationStatsRequest {
  days: number;
}

export interface ReservationDayStat {
  date: string;
  reservations: number;
}

const oneDayMs = 24 * 60 * 60 * 1000;

// Nombre de réservations confirmées par jour, à partir d'aujourd'hui (dates UTC, format AAAA-MM-JJ).
@injectable()
export class GetReservationStats implements Usecase<GetReservationStatsRequest, ReservationDayStat[]> {
  constructor(
    @inject(BookingIdentifiers.reservationRepository)
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async execute(request: GetReservationStatsRequest): Promise<ReservationDayStat[]> {
    const today = new Date();
    const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    const counts = new Map<string, number>();
    for (let index = 0; index < request.days; index++) {
      counts.set(dayKey(new Date(todayStart + index * oneDayMs)), 0);
    }

    const reservations = await this.reservationRepository.findAll();
    for (const reservation of reservations) {
      const key = dayKey(reservation.props.reservationDate);
      if (reservation.getStatus() === 'CONFIRMED' && counts.has(key)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return [...counts.entries()].map(([date, reservationCount]) => ({
      date,
      reservations: reservationCount,
    }));
  }
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
