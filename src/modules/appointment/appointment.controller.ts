import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto, CreateExpertScheduleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Yeni randevu oluştur' })
  async createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.createAppointment(createAppointmentDto);
  }

  @Post('schedule/expert')
  @ApiOperation({ summary: 'Uzman müsaitlik programı oluştur' })
  async createExpertSchedule(@Body() createScheduleDto: CreateExpertScheduleDto) {
    return this.appointmentService.createExpertSchedule(createScheduleDto);
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Randevu durumunu güncelle' })
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentService.updateAppointmentStatus(id, updateStatusDto);
  }

  @Get('expert/:expertId')
  @ApiOperation({ summary: 'Uzmanın randevularını getir' })
  async getExpertAppointments(@Param('expertId') expertId: string) {
    return this.appointmentService.getExpertAppointments(expertId);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Danışanın randevularını getir' })
  async getClientAppointments(@Param('clientId') clientId: string) {
    return this.appointmentService.getClientAppointments(clientId);
  }
} 