import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private client: twilio.Twilio;

  constructor(private configService: ConfigService) {
    this.client = twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN')
    );
  }

  async sendSMS(to: string, content: string) {
    await this.client.messages.create({
      body: content,
      to,
      from: this.configService.get('TWILIO_PHONE_NUMBER'),
    });
  }
} 