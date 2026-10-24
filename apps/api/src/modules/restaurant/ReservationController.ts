import {
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Post,
  QueryParams,
  Req,
  UseBefore,
} from 'routing-controllers';
import { inject, injectable } from 'inversify';
import {
  CancelReservation,
  CreateReservation,
  ListAvailableTables,
  ListTables,
  RecordActivity,
} from 'restaurant-core';
import {
  AvailableTablesQuery,
  CreateReservationCommand,
  GuestReservationCommand,
} from './command/ReservationCommand';
import { AuthenticationMiddleware } from '../../middlewares/AuthenticationMiddleware';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import { NotificationHub } from '../notification/NotificationHub';

@injectable()
@JsonController()
export class ReservationController {
  constructor(
    @inject(CreateReservation)
    private readonly createReservation: CreateReservation,

    @inject(CancelReservation)
    private readonly cancelReservation: CancelReservation,

    @inject(ListAvailableTables)
    private readonly listAvailableTables: ListAvailableTables,

    @inject(ListTables)
    private readonly listTables: ListTables,

    @inject(NotificationHub)
    private readonly notificationHub: NotificationHub,

    @inject(RecordActivity)
    private readonly recordActivity: RecordActivity,
  ) {}

  @Get('/tables')
  async tables() {
    const tables = await this.listTables.execute();

    return tables.map((table) => ({
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      location: table.location,
      active: table.getIsActive(),
    }));
  }

  @Get('/tables/available')
  async availableTables(@QueryParams() query: AvailableTablesQuery) {
    const tables = await this.listAvailableTables.execute({
      reservationDate: new Date(query.reservationDate),
      startTime: new Date(query.startTime),
      endTime: new Date(query.endTime),
      guestCount: Number(query.guestCount),
    });

    return tables.map((table) => ({
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      location: table.location,
      active: table.getIsActive(),
    }));
  }

  @Post('/reservations')
  @UseBefore(AuthenticationMiddleware)
  async create(
    @Body() command: CreateReservationCommand,
    @Req() request: AuthenticatedRequest,
  ) {
    const reservationId = await this.createReservation.execute({
      memberId: request.identity.memberId,
      reservationDate: new Date(command.reservationDate),
      startTime: new Date(command.startTime),
      endTime: new Date(command.endTime),
      guestCount: Number(command.guestCount),
      specialRequest: command.specialRequest,
    });

    await this.recordActivity.execute({
      action: 'RESERVATION_CREATED',
      memberId: request.identity.memberId,
      details: reservationId,
    });

    this.notificationHub.sendToMember(request.identity.memberId, {
      type: 'RESERVATION_CONFIRMED',
      title: 'Réservation confirmée',
      message: `Votre table est réservée pour le ${command.reservationDate}.`,
      createdAt: new Date().toISOString(),
    });

    return { id: reservationId };
  }

  // Réservation sans compte : accessible à tous, sans authentification.
  @Post('/reservations/guest')
  async createGuest(@Body() command: GuestReservationCommand) {
    const reservationId = await this.createReservation.execute({
      memberId: null,
      reservationDate: new Date(command.reservationDate),
      startTime: new Date(command.startTime),
      endTime: new Date(command.endTime),
      guestCount: Number(command.guestCount),
      specialRequest: command.specialRequest,
      guestName: command.guestName,
      guestEmail: command.guestEmail,
      guestPhone: command.guestPhone,
    });

    return { id: reservationId };
  }

  @Delete('/reservations/:id')
  @UseBefore(AuthenticationMiddleware)
  async cancel(@Param('id') reservationId: string, @Req() request: AuthenticatedRequest) {
    const memberId = request.identity.memberId;

    await this.cancelReservation.execute({ reservationId, memberId });

    await this.recordActivity.execute({
      action: 'RESERVATION_CANCELLED',
      memberId,
      details: reservationId,
    });

    this.notificationHub.sendToMember(memberId, {
      type: 'RESERVATION_ANNULEE',
      title: 'Réservation annulée',
      message: 'Votre réservation a bien été annulée.',
      createdAt: new Date().toISOString(),
    });

    return { cancelled: true };
  }
}
