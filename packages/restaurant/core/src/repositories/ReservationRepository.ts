import { Reservation } from '../aggregates/Reservation';

export interface ReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findById(id: string): Promise<Reservation | null>;
  findByMemberId(memberId: string): Promise<Reservation[]>;
  findAll(): Promise<Reservation[]>;
}
