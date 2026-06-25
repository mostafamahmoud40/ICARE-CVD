import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import {
  PatientAvatarUploadIntentDto,
  SetPatientAvatarDto,
} from '../../assistant/dto/patient-avatar.dto';
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

  @Post('avatar/upload-intent')
  createAvatarUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Body() dto: PatientAvatarUploadIntentDto,
  ) {
    return this.accountService.createAvatarUploadIntent(
      user.sub,
      dto.fileName,
      dto.contentType,
    );
  }

  @Patch('avatar')
  setAvatar(
    @CurrentUser() user: TokenPayload,
    @Body() dto: SetPatientAvatarDto,
  ) {
    return this.accountService.setAvatar(user.sub, dto.s3Key);
  }
}
