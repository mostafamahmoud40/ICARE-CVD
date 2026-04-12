import { Body, Controller, Delete, Get, Param, Patch, Post, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AddStaffDto } from './dto/add-staff.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(AccessTokenGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('staff')
  getStaff() {
    return this.adminService.getStaff();
  }

  @Post('staff')
  addStaff(@Body() dto: AddStaffDto) {
    return this.adminService.addStaff(dto);
  }

  @Patch('staff/:id')
  updateStaff(@Param('id', ParseIntPipe) id: number, @Body() dto: AddStaffDto) {
    return this.adminService.updateStaff(id, dto);
  }

  @Delete('staff/:id')
  deleteStaff(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteStaff(id);
  }
}
