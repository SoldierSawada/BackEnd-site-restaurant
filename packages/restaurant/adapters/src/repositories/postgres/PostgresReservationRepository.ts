import { inject, injectable } from 'inversify';
import { DataSource, Repository } from 'typeorm';
import { Reservation, ReservationRepository } from 'restaurant-core';

import { DatabaseIdentifiers } from './DatabaseIdentifiers';
import { ReservationEntity } from './entities/ReservationEntity';
import { ReservationMapper } from './mappers/ReservationMapper';

@injectable()
export class PostgresReservationRepository implements ReservationRepository {
  private readonly repository: Repository<ReservationEntity>;

  constructor(@inject(DatabaseIdentifiers.dataSource) dataSource: DataSource) {
    this.repository = dataSource.getRepository(ReservationEntity);
  }

  async save(reservation: Reservation): Promise<void> {
    await this.repository.save(ReservationMapper.toEntity(reservation));
  }

  async findById(id: string): Promise<Reservation | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? ReservationMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Reservation[]> {
    const entities = await this.repository.find({ order: { startTime: 'ASC' } });
    return entities.map((entity) => ReservationMapper.toDomain(entity));
  }

  async findByMemberId(memberId: string): Promise<Reservation[]> {
    const entities = await this.repository.find({
      where: { memberId },
      order: { startTime: 'ASC' },
    });
    return entities.map((entity) => ReservationMapper.toDomain(entity));
  }
}
