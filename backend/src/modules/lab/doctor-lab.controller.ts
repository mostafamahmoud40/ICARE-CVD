import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { LabService } from './lab.service';
import {
  CreateLabOrderDto,
  CreateLabResultDto,
  UpdateLabOrderDto,
} from './dto/lab.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorLabController {
  constructor(private readonly labService: LabService) {}

  @Get(':patientId/lab-orders')
  listLabOrders(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.labService.listLabOrders(user.sub, patientId);
  }

  @Get(':patientId/lab-orders/:orderId')
  getLabOrder(
    @CurrentUser() user: TokenPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.labService.getLabOrder(user.sub, orderId);
  }

  @Post(':patientId/lab-orders')
  createLabOrder(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreateLabOrderDto,
  ) {
    return this.labService.createLabOrder(user.sub, patientId, dto);
  }

  @Patch(':patientId/lab-orders/:orderId')
  updateLabOrder(
    @CurrentUser() user: TokenPayload,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateLabOrderDto,
  ) {
    return this.labService.updateLabOrder(user.sub, orderId, dto);
  }

  @Delete(':patientId/lab-orders/:orderId/cancel')
  cancelLabOrder(
    @CurrentUser() user: TokenPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.labService.cancelLabOrder(user.sub, orderId);
  }

  @Get(':patientId/lab-results')
  listLabResults(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.labService.listLabResults(user.sub, patientId);
  }

  @Post(':patientId/lab-results')
  createLabResult(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreateLabResultDto,
  ) {
    return this.labService.createLabResult(user.sub, patientId, dto);
  }
}
