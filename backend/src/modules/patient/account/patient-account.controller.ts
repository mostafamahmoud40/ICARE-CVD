import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import { PatientGuard } from '../patient.guard';
import { PatientAccountService } from './patient-account.service';
import { UpdatePatientAccountDto } from './dto/update-patient-account.dto';

@Controller('patient/account')
@UseGuards(AccessTokenGuard, PatientGuard)
export class PatientAccountController {
  constructor(private readonly accountService: PatientAccountService) {}

  @Get()
  getAccount(@CurrentUser() user: TokenPayload) {
    return this.accountService.getAccount(user.sub);
  }

  @Patch()
  updateAccount(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdatePatientAccountDto,
  ) {
    return this.accountService.updateAccount(user.sub, dto);
  }
}
