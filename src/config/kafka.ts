import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'counselease',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'counselease-group' });

// Kafka topic'leri
export const KAFKA_TOPICS = {
  NOTIFICATION: 'notifications',
  PAYMENT: 'payments',
  APPOINTMENT: 'appointments'
};

// Kafka mesaj üretici örneği
export async function publishMessage(topic: string, message: any) {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
}

// Kafka mesaj tüketici örneği
export async function subscribeToTopic(topic: string, handler: (message: any) => Promise<void>) {
  await consumer.connect();
  await consumer.subscribe({ topic });
  
  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value?.toString() || '');
      await handler(data);
    },
  });
} 