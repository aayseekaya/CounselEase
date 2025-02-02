# CounselEase API Dokümantasyonu

## 🚀 Genel Bilgiler

**Base URL:** `http://localhost:3000`  
**API Versiyonu:** 1.0.0

### Kimlik Doğrulama

API, JWT tabanlı kimlik doğrulama kullanır. Protected endpoint'ler için `Authorization` header'ında Bearer token gönderilmelidir: 

## 📌 Endpoints

### 🔐 Auth Service

#### POST /auth/register
Yeni kullanıcı kaydı oluşturur.

**Request Body:**
```json
{
"email": "string",
"password": "string",
"fullName": "string",
"userType": "CLIENT | DIETITIAN | PSYCHOLOGIST"
}
``` 

#### POST /auth/login
Kullanıcı girişi yapar ve JWT token döner.

**Request Body:**
```json
{
"email": "string",
"password": "string"
}
``` 

### 💳 Subscription Service

#### GET /subscription/plans
Mevcut abonelik planlarını listeler.

#### POST /subscription/subscribe
Kullanıcıyı bir plana abone eder.

**Request Body:**
```json
{
"planId": "string",
"userId": "string"
}
```

### 💰 Payment Service

#### POST /payment/create
Yeni ödeme işlemi başlatır.

**Request Body:**
```json
{
"userId": "string",
"subscriptionId": "string",
"amount": "number",
"currency": "string",
"paymentMethod": "CREDIT_CARD | BANK_TRANSFER"
}
```

### 📅 Appointment Service

#### POST /appointment/create
Yeni randevu oluşturur.

**Request Body:**
```json
{
"clientId": "string",
"expertId": "string",
"startTime": "string (ISO 8601)",
"endTime": "string (ISO 8601)",
"type": "ONLINE | IN_PERSON"
}
```

### 📨 Notification Service

#### POST /notification/send
Bildirim gönderir.

**Request Body:**
```json
{
"userId": "string",
"type": "APPOINTMENT_REMINDER | PAYMENT_SUCCESS | etc",
"channel": "EMAIL | SMS | BOTH",
"title": "string",
"content": "string"
}
```

## 🔄 Status Codes

- `200 OK`: İşlem başarılı
- `201 Created`: Kaynak başarıyla oluşturuldu
- `400 Bad Request`: Geçersiz istek
- `401 Unauthorized`: Kimlik doğrulama gerekli
- `403 Forbidden`: Yetkisiz erişim
- `404 Not Found`: Kaynak bulunamadı
- `500 Internal Server Error`: Sunucu hatası

## 📝 Hata Yanıtları

Tüm hata yanıtları aşağıdaki formatta döner:
```json
{
"success": false,
"error": "Hata mesajı",
"code": "HATA_KODU"
}
```
```

Bu dokümantasyon ve Postman koleksiyonu ile:

1. Tüm API endpoint'leri
2. İstek/yanıt formatları
3. Kimlik doğrulama
4. Hata kodları
5. Örnek kullanımlar

detaylı bir şekilde tanımlanmış oldu. Postman koleksiyonunu import ederek hızlıca API testlerine başlayabilirsiniz.