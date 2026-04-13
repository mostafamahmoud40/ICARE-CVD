import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

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
}
