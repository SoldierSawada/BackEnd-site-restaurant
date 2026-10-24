import { injectable } from 'inversify';
import { Reservation, ReservationRepository } from 'restaurant-core';

@injectable()
export class InMemoryReservationRepository implements ReservationRepository {
  private readonly items = new Map<string, Reservation>();

  async save(reservation: Reservation): Promise<void> {
    this.items.set(reservation.id, reservation);
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(): Promise<Reservation[]> {
    return [...this.items.values()];
  }

  async findByMemberId(memberId: string): Promise<Reservation[]> {
    return [...this.items.values()]
      .filter((reservation) => reservation.props.memberId === memberId)
      .sort((a, b) => a.props.startTime.getTime() - b.props.startTime.getTime());
  }
}
