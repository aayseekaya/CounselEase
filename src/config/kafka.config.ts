import { registerAs } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';

export default registerAs('kafka', () => ({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'counselease',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    },
    consumer: {
      groupId: 'counselease-consumer-group',
    },
  } as KafkaOptions,
}));

export const KAFKA_TOPICS = {
  NOTIFICATION: 'notifications',
  PAYMENT: 'payments',
  APPOINTMENT: 'appointments',
}; 