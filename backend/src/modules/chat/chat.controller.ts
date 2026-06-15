import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import {
  ChatUploadIntentDto,
  SendMessageDto,
} from './dto/send-message.dto';

@Controller('chat')
@UseGuards(AccessTokenGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: TokenPayload) {
    return this.chatService.listConversations(user);
  }

  @Get('directory')
  listDirectory(@CurrentUser() user: TokenPayload) {
    return this.chatService.listDirectory(user);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(user, dto);
  }

  @Get('conversations/:conversationId/messages')
  listMessages(
    @CurrentUser() user: TokenPayload,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.chatService.listMessages(conversationId, user);
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @CurrentUser() user: TokenPayload,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, user, dto);
  }

  @Delete('conversations/:conversationId/messages/:messageId')
  deleteMessage(
    @CurrentUser() user: TokenPayload,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.chatService.deleteMessage(conversationId, messageId, user);
  }

  @Post('conversations/:conversationId/attachments/upload-intent')
  createAttachmentUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() dto: ChatUploadIntentDto,
  ) {
    return this.chatService.createAttachmentUploadIntent(
      conversationId,
      user,
      dto,
    );
  }

  @Get('attachments/:attachmentId/file')
  getAttachmentFile(
    @CurrentUser() user: TokenPayload,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.chatService.streamAttachmentFile(attachmentId, user);
  }
}
