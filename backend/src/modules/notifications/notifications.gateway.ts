import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthJwtService } from '../auth/jwt';
import {
  extractSocketToken,
  type SocketWithUser,
} from '../../shared/socket-auth';
import { NotificationsService } from './notifications.service';

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
      const token = extractSocketToken(client);
      const user = await this.authJwtService.verifyAccessToken(token);
      client.data.user = user;
      await client.join(`user:${user.sub}`);
    } catch {
      client.disconnect(true);
    }
  }
}
