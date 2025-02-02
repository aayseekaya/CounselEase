import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsString()
  expertId: string;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

  @ApiProperty({ enum: AppointmentType })
  @IsEnum(AppointmentType)
  type: AppointmentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancelReason?: string;
}

export class ScheduleDto {
  @ApiProperty()
  @IsNumber()
  dayOfWeek: number;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

  @ApiProperty()
  @IsBoolean()
  isAvailable: boolean;
}

export class CreateExpertScheduleDto {
  @ApiProperty()
  @IsString()
  expertId: string;

  @ApiProperty({ type: [ScheduleDto] })
  @IsArray()
  schedules: ScheduleDto[];
} 