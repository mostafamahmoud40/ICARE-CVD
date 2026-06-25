import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthJwtService } from '../auth/jwt';
import {
  extractSocketToken,
  getSocketUser,
  type SocketWithUser,
} from '../../shared/socket-auth';
import { ChatService } from './chat.service';
import type { SendMessageDto } from './dto/send-message.dto';

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
      const token = extractSocketToken(client);
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
    const user = getSocketUser(client);
    if (!user || !body?.conversationId) return { ok: false };

    await this.chatService.ensureConversationAccess(body.conversationId, user);
    await client.join(`conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('chat:sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody()
    body: {
      conversationId: number;
      message?: string;
      attachments?: SendMessageDto['attachments'];
    },
  ) {
    const user = getSocketUser(client);
    if (!user || !body?.conversationId) return { ok: false };
    if (!body.message?.trim() && !body.attachments?.length)
      return { ok: false };

    const created = await this.chatService.sendMessage(
      body.conversationId,
      user,
      {
        message: body.message,
        attachments: body.attachments,
      },
    );

    // One emit per participant (user room). Avoid also broadcasting to `conversation:` or clients get duplicate events.
    for (const recipientUserId of created.recipientUserIds) {
      this.server
        .to(`user:${recipientUserId}`)
        .emit('chat:newMessage', created);
    }

    return { ok: true, message: created };
  }

  @SubscribeMessage('chat:deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() body: { conversationId: number; messageId: number },
  ) {
    const user = getSocketUser(client);
    if (!user || !body?.conversationId || !body?.messageId)
      return { ok: false };

    const result = await this.chatService.deleteMessage(
      body.conversationId,
      body.messageId,
      user,
    );

    for (const recipientUserId of result.recipientUserIds) {
      this.server.to(`user:${recipientUserId}`).emit('chat:messageDeleted', {
        conversationId: result.conversationId,
        messageId: result.messageId,
      });
    }

    return { ok: true, ...result };
  }

  @SubscribeMessage('chat:typing')
  async handleTyping(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() body: { conversationId: number; isTyping: boolean },
  ) {
    const user = getSocketUser(client);
    if (!user || !body?.conversationId) return { ok: false };

    await this.chatService.ensureConversationAccess(body.conversationId, user);

    const recipientUserIds = await this.chatService.getOtherParticipantUserIds(
      body.conversationId,
      user.sub,
    );

    for (const recipientUserId of recipientUserIds) {
      this.server.to(`user:${recipientUserId}`).emit('chat:typing', {
        conversationId: body.conversationId,
        isTyping: Boolean(body.isTyping),
        userId: user.sub,
        role: user.role,
      });
    }

    return { ok: true };
  }

  @SubscribeMessage('chat:ringCall')
  async handleRingCall(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() body: { conversationId: number; kind: 'video' | 'voice' },
  ) {
    const user = getSocketUser(client);
    if (!user || !body?.conversationId || !body?.kind) return { ok: false };

    await this.chatService.ensureConversationAccess(body.conversationId, user);

    const callerName = await this.chatService.getUserDisplayName(user.sub);
    const recipientUserIds = await this.chatService.getOtherParticipantUserIds(
      body.conversationId,
      user.sub,
    );

    const payload = {
      conversationId: body.conversationId,
      kind: body.kind,
      callerUserId: user.sub,
      callerName,
      sentAt: new Date().toISOString(),
    };

    for (const recipientUserId of recipientUserIds) {
      this.server
        .to(`user:${recipientUserId}`)
        .emit('chat:incomingCall', payload);
    }

    return { ok: true };
  }

  @SubscribeMessage('chat:callMissed')
  async handleCallMissed(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() body: { conversationId: number; kind: 'video' | 'voice' },
  ) {
    const user = getSocketUser(client);
    if (!user || !body?.conversationId || !body?.kind) return { ok: false };

    await this.chatService.ensureConversationAccess(body.conversationId, user);

    const callerName = await this.chatService.getUserDisplayName(user.sub);
    const recipientUserIds = await this.chatService.getOtherParticipantUserIds(
      body.conversationId,
      user.sub,
    );

    const payload = {
      conversationId: body.conversationId,
      kind: body.kind,
      callerUserId: user.sub,
      callerName,
      sentAt: new Date().toISOString(),
    };

    for (const recipientUserId of recipientUserIds) {
      this.server
        .to(`user:${recipientUserId}`)
        .emit('chat:callMissed', payload);
    }

    return { ok: true };
  }
}
