import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { TokenPayload } from '../auth/jwt';
import { AuthJwtService } from '../auth/jwt';
import { NotificationsService } from './notifications.service';

type SocketWithUser = Socket & { data: { user?: TokenPayload } };

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayInit
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly authJwtService: AuthJwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    this.notificationsService.attachSocketServer(server);
  }

  async handleConnection(client: SocketWithUser) {
    try {
      const token = this.extractToken(client);
      const user = await this.authJwtService.verifyAccessToken(token);
      client.data.user = user;
      await client.join(`user:${user.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  private extractToken(client: SocketWithUser) {
    const fromAuth = client.handshake.auth?.token;
    const fromHeader = client.handshake.headers.authorization;
    const raw = fromAuth ?? fromHeader;
    if (!raw || typeof raw !== 'string') {
      throw new Error('Missing token');
    }
    return raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim();
  }
}
