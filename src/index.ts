import { ApiGateway } from './gateway/ApiGateway';
import dotenv from 'dotenv';

// Çevresel değişkenleri yükle
dotenv.config();

// Gateway'i başlat
const gateway = new ApiGateway();
gateway.start(3000); 