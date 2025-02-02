import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Yeni ödeme oluştur' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(@Body() event: any) {
    return this.paymentService.handleWebhook(event);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Kullanıcının ödeme geçmişi' })
  async getPaymentHistory(@Param('userId') userId: string) {
    return this.paymentService.getPaymentHistory(userId);
  }

  @Get('invoices/:userId')
  @ApiOperation({ summary: 'Kullanıcının faturaları' })
  async getInvoices(@Param('userId') userId: string) {
    return this.paymentService.getInvoices(userId);
  }
} 