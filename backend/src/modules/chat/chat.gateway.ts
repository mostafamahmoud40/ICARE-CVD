import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { TokenPayload } from '../auth/jwt';
import { AuthJwtService } from '../auth/jwt';
import { ChatService } from './chat.service';

type SocketWithUser = Socket & { data: { user?: TokenPayload } };

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly authJwtService: AuthJwtService,
    private readonly chatService: ChatService,
  ) {}

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

  @SubscribeMessage('chat:joinConversation')
  async joinConversation(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() body: { conversationId: number },
  ) {
    const user = client.data.user;
    if (!user || !body?.conversationId) return { ok: false };

    await this.chatService.ensureConversationAccess(body.conversationId, user);
    await client.join(`conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('chat:sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() body: { conversationId: number; message: string },
  ) {
    const user = client.data.user;
    if (!user || !body?.conversationId || !body?.message) return { ok: false };

    const created = await this.chatService.sendMessage(body.conversationId, user, {
      message: body.message,
    });

    this.server.to(`conversation:${body.conversationId}`).emit('chat:newMessage', created);
    for (const recipientUserId of created.recipientUserIds) {
      this.server.to(`user:${recipientUserId}`).emit('chat:newMessage', created);
    }

    return { ok: true, message: created };
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
