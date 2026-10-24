export type NotificationType =
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_ANNULEE'
  | 'TABLE_OUVERTE'
  | 'TABLE_FERMEE'
  | 'DATA_UPDATED';

export interface NotificationMessage {
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
}
