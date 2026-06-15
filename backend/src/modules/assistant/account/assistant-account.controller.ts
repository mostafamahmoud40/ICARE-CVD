import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import { AssistantGuard } from '../assistant.guard';
import { AssistantAccountService } from './assistant-account.service';
import { UpdateAssistantAccountDto } from './dto/update-assistant-account.dto';

@Controller('assistant/account')
@UseGuards(AccessTokenGuard, AssistantGuard)
export class AssistantAccountController {
  constructor(private readonly accountService: AssistantAccountService) {}

  @Get()
  getAccount(@CurrentUser() user: TokenPayload) {
    return this.accountService.getAccount(user.sub);
  }

  @Patch()
  updateAccount(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateAssistantAccountDto,
  ) {
    return this.accountService.updateAccount(user.sub, dto);
  }
}
