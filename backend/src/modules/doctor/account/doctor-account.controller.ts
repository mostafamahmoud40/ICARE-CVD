import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import { DoctorGuard } from '../doctor.guard';
import { DoctorAccountService } from './doctor-account.service';
import { UpdateDoctorAccountDto } from './dto/update-doctor-account.dto';

@Controller('doctor/account')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorAccountController {
  constructor(private readonly accountService: DoctorAccountService) {}

  @Get()
  getAccount(@CurrentUser() user: TokenPayload) {
    return this.accountService.getAccount(user.sub);
  }

  @Patch()
  updateAccount(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateDoctorAccountDto,
  ) {
    return this.accountService.updateAccount(user.sub, dto);
  }
}
