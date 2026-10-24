import { IncomingMessage, Server } from 'http';
import { inject, injectable } from 'inversify';
import { WebSocket, WebSocketServer } from 'ws';
import { BookingIdentifiers, SessionRepository } from 'restaurant-core';
import { NotificationMessage } from './NotificationMessage';

const wsPath = '/restaurant/ws';
const unauthorizedCloseCode = 4001;

@injectable()
export class NotificationHub {
  private readonly connections = new Map<string, Set<WebSocket>>();

  constructor(
    @inject(BookingIdentifiers.sessionRepository)
    private readonly sessionRepository: SessionRepository,
  ) {}

  attach(server: Server): void {
    const wss = new WebSocketServer({ server, path: wsPath });

    wss.on('connection', (socket, request) => {
      void this.handleConnection(socket, request);
    });
  }

  sendToMember(memberId: string, notification: NotificationMessage): void {
    const sockets = this.connections.get(memberId);
    if (!sockets) {
      return;
    }

    const payload = JSON.stringify(notification);
    sockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    });
  }

  broadcast(notification: NotificationMessage): void {
    const payload = JSON.stringify(notification);
    this.connections.forEach((sockets) => {
      sockets.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(payload);
        }
      });
    });
  }

  private async handleConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
    const token = new URL(request.url ?? '', 'http://localhost').searchParams.get('token');
    const session = token ? await this.sessionRepository.findByToken(token) : null;

    if (!session) {
      socket.close(unauthorizedCloseCode, 'Session invalide');
      return;
    }

    const memberId = session.memberId;
    const sockets = this.connections.get(memberId) ?? new Set<WebSocket>();
    sockets.add(socket);
    this.connections.set(memberId, sockets);

    socket.on('close', () => {
      sockets.delete(socket);
      if (sockets.size === 0) {
        this.connections.delete(memberId);
      }
    });
  }
}
