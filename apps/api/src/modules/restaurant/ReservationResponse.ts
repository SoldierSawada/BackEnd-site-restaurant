import { Reservation } from 'restaurant-core';

export function toReservationResponse(reservation: Reservation) {
  return {
    id: reservation.id,
    memberId: reservation.props.memberId,
    tableId: reservation.props.tableId,
    reservationDate: reservation.props.reservationDate,
    startTime: reservation.props.startTime,
    endTime: reservation.props.endTime,
    guestCount: reservation.props.guestCount,
    specialRequest: reservation.props.specialRequest,
    status: reservation.getStatus(),
  };
}
