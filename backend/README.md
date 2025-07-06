# Transcendence Backend - Microservices Architecture

Bu proje **42 School Transcendence** projesi için Fastify ve Node.js kullanarak geliştirilmiş mikroservis mimarisidir.

## 🏗️ Mimari Genel Bakış

```
┌─────────────────┐    ┌──────────────────┐
│   Frontend      │────│   API Gateway    │
│   (React)       │    │   (Port: 3000)   │
└─────────────────┘    └──────────┬───────┘
                                  │
                       ┌──────────┴───────────────────────┐
                       │                                  │
                ┌──────▼──────┐                    ┌─────▼──────┐
                │Auth Service │                    │User Service│
                │(Port: 3001) │                    │(Port: 3002)│
                └─────────────┘                    └────────────┘
                       │                                  │
                ┌──────▼──────┐                    ┌─────▼──────┐
                │Friend Service│                   │Game Service│
                │(Port: 3003) │                    │(Port: 3004)│
                └─────────────┘                    └────────────┘
                                  │
                            ┌─────▼──────┐
                            │   SQLite   │
                            │  Database  │
                            └────────────┘
```

## 📦 Servisler

### 1. **Shared Library** (@transcendence/shared) ✅
- Ortak tipler ve arayüzler
- SQLite veritabanı bağlantısı
- JWT token yönetimi
- Password hashing (bcrypt)
- Joi validation schemas
- Database migrations

### 2. **API Gateway** (Port: 3000) ✅
- Tüm servislere merkezi erişim noktası
- Authentication middleware
- Rate limiting ve CORS
- Service proxy'leri
- Health check endpoint'leri
- Error handling

### 3. **Authentication Service** (Port: 3001) ✅
- Kullanıcı kaydı ve girişi
- JWT token üretimi ve doğrulama
- Refresh token yönetimi
- Online/offline durum güncellemesi
- Password güvenlik kontrolleri

### 4. **User Service** (Port: 3002) ✅ Completed
- Kullanıcı profil yönetimi (görüntüleme, güncelleme, soft delete, restore)
- Avatar yükleme ve işleme (thumbnail, small, medium, large, original boyutları)
- Sharp ile görüntü işleme (JPEG sıkıştırma, boyutlandırma, kırpma)
- Kullanıcı arama işlevselliği (relevance ranking ile)
- Online/offline durum yönetimi
- Oyun verileri ile entegre kullanıcı istatistikleri
- Yüklenen avatarlar için statik dosya sunumu
- Kapsamlı validation ve hata yönetimi
- Kullanıcı listeleri için pagination desteği
- Dosya boyutu ve tipi kontrolü
- Eski dosya temizleme işlevselliği

### 5. **Friendship Service** (Port: 3003) ⏳ Planned
- Arkadaşlık istekleri
- Arkadaş listesi yönetimi
- Online arkadaşlar görüntüleme
- Engelleme sistemi

### 6. **Game Service** (Port: 3004) ⏳ Planned
- Oyun odası oluşturma
- 1v1 maç yönetimi
- Turnuva sistemi
- Match history
- Leaderboard

## 🛠️ Teknik Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: SQLite
- **Authentication**: JWT
- **Password Hashing**: bcrypt
- **Validation**: Joi
- **File Upload**: @fastify/multipart + Sharp
- **Development**: tsx (TypeScript runner)

## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler
```bash
Node.js >= 18.0.0
npm >= 8.0.0
```

### 1. Dependencies Kurulumu
```bash
# Ana klasörde
npm run install:all
```

### 2. Tüm Servisleri Çalıştırma
```bash
# Development mode (tüm servisler)
npm run dev

# Veya tek tek servisler
npm run dev:gateway    # API Gateway
npm run dev:auth       # Auth Service  
npm run dev:user       # User Service
npm run dev:friendship # Friendship Service
npm run dev:game       # Game Service
```

### 3. Production Build
```bash
npm run build
```

## 📋 API Endpoints

### API Gateway (http://localhost:3000)
```
GET    /                     # Service info
GET    /health               # Simple health check
GET    /health/detailed      # Detailed health with services
GET    /ready                # Readiness probe
GET    /live                 # Liveness probe

# Auth Routes (Proxy to Auth Service)
POST   /api/auth/register    # User registration
POST   /api/auth/login       # User login
POST   /api/auth/logout      # User logout (protected)
POST   /api/auth/refresh     # Refresh token
GET    /api/auth/me          # Get current user (protected)

# User Routes (Proxy to User Service) - Protected
GET    /api/users/getAll              # Get all users (with filtering)
GET    /api/users/getAllPaginated     # Get paginated users
GET    /api/users/:id                 # Get user by ID
POST   /api/users/add                 # Create new user (internal)
PUT    /api/users/update              # Update user
DELETE /api/users/soft-delete/:id     # Soft delete user
POST   /api/users/restore/:id         # Restore deleted user
GET    /api/users/profile             # Get own profile
PUT    /api/users/profile             # Update own profile
POST   /api/users/upload-avatar       # Upload avatar (multipart/form-data)
POST   /api/users/online              # Set online status
POST   /api/users/offline             # Set offline status
GET    /api/users/search?q=query      # Search users
GET    /api/users/stats/:id           # Get user statistics
```

### Auth Service (http://localhost:3001)
```
GET    /                     # Service info
POST   /register             # User registration
POST   /login                # User login
POST   /logout               # User logout (protected)
POST   /refresh              # Refresh access token
GET    /me                   # Get current user (protected)
POST   /validate             # Validate token (internal)
GET    /health               # Health check
```

### User Service (http://localhost:3002)
```
GET    /                          # Service info
GET    /health                    # Health check
GET    /ready                     # Readiness probe
GET    /live                      # Liveness probe

# User Management (Protected)
GET    /api/users/getAll          # Get all users (with ?active=true/false filter)
GET    /api/users/getAllPaginated # Get paginated users (?page=1&size=10&sort=field:asc)
GET    /api/users/:id             # Get user by ID
POST   /api/users/add             # Create new user (internal use)
PUT    /api/users/update          # Update user
DELETE /api/users/soft-delete/:id # Soft delete user
POST   /api/users/restore/:id     # Restore deleted user

# Profile Management (Protected)
GET    /api/users/profile         # Get own profile
PUT    /api/users/profile         # Update own profile
POST   /api/users/upload-avatar   # Upload avatar (multipart/form-data, max 5MB)

# Status Management (Protected)
POST   /api/users/online          # Set online status
POST   /api/users/offline         # Set offline status

# Search & Stats (Protected)
GET    /api/users/search          # Search users (?q=query&limit=20)
GET    /api/users/stats/:id       # Get user statistics and recent games

# Static Files
GET    /static/uploads/*          # Serve uploaded avatar files
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  displayName TEXT UNIQUE,
  passwordHash TEXT NOT NULL,
  avatarUrl TEXT,
  isActive BOOLEAN DEFAULT 1,
  isOnline BOOLEAN DEFAULT 0,
  lastSeen DATETIME,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Friendships Table
```sql
CREATE TABLE friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requesterId INTEGER NOT NULL,
  addresseeId INTEGER NOT NULL,
  status TEXT CHECK(status IN ('pending', 'accepted', 'blocked')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requesterId) REFERENCES users(id),
  FOREIGN KEY (addresseeId) REFERENCES users(id)
);
```

### Games Table
```sql
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1Id INTEGER NOT NULL,
  player2Id INTEGER NOT NULL,
  winner INTEGER,
  player1Score INTEGER DEFAULT 0,
  player2Score INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('waiting', 'in_progress', 'finished', 'cancelled')),
  startedAt DATETIME,
  endedAt DATETIME,
  tournamentId INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Authentication

### JWT Token Structure
```typescript
interface JwtPayload {
  userId: number;
  email: string;
  displayName: string;
  iat?: number;
  exp?: number;
}
```

### Protected Endpoints
Korumalı endpoint'ler `Authorization: Bearer <token>` header'ı gerektirir.

## ⚙️ Environment Variables

### Global (.env)
```bash
NODE_ENV=development
JWT_SECRET=transcendence-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

### API Gateway
```bash
PORT=3000
HOST=0.0.0.0
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15 minutes
```

### Auth Service
```bash
PORT=3001
RATE_LIMIT_MAX=20
```

### User Service
```bash
PORT=3002
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_PATH=./uploads
```

## 🧪 Testing

```bash
# API Gateway Health Check
curl http://localhost:3000/health

# User Registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "password": "SecurePass123!",
    "displayName": "johndoe"
  }'

# User Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

## 📊 Monitoring

### Health Checks
- **Simple**: `GET /health` - Basic health status
- **Detailed**: `GET /health/detailed` - Includes service dependencies
- **Ready**: `GET /ready` - Kubernetes readiness probe
- **Live**: `GET /live` - Kubernetes liveness probe

### Logging
- **Development**: Pretty formatted console logs
- **Production**: JSON formatted logs
- Request/Response logging with timing
- Error logging with stack traces

## 🚧 Development Status

### ✅ Completed
- [x] Shared library with database and utilities
- [x] API Gateway with routing and middleware
- [x] Authentication Service with JWT
- [x] User Service with profile management and avatars
- [x] File upload handling with image processing
- [x] Database migrations and schema
- [x] Error handling and validation
- [x] Health checks and monitoring

### 🚧 In Progress
- [ ] Friendship Service (friend requests, lists, blocking)
- [ ] Game Service (matches, tournaments, leaderboard)

### ⏳ Planned
- [ ] Friendship Service
- [ ] Game Service  
- [ ] Tournament system
- [ ] Real-time features (WebSocket)
- [ ] Docker containerization
- [ ] API documentation (Swagger)

## 🤝 Contributing

1. Her servis kendi klasöründe bağımsız olarak geliştirilebilir
2. Shared library değişiklikleri tüm servisleri etkiler
3. TypeScript strict mode kullanılmalıdır
4. API Response format'ı tutarlı olmalıdır

## 📝 API Response Format

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

## 🎯 Next Steps

1. **User Service'i tamamla** - Profile management ve avatar upload
2. **Friendship Service'i oluştur** - Arkadaşlık sistemi
3. **Game Service'i oluştur** - Oyun ve turnuva yönetimi
4. **WebSocket entegrasyonu** - Real-time features
5. **Frontend entegrasyonu** - React app ile bağlantı

---

**Not**: Bu README development sırasında güncellenecektir. Her servis tamamlandıkça yeni özellikler ve endpoint'ler eklenecektir. 

## 🚀 Hızlı Başlangıç

### Otomatik Kurulum
```bash
# Backend dizinine git
cd transcendence-backend

# Kurulum script'ini çalıştır
node setup.js

# Tüm servisleri başlat
npm run dev
```

### Manuel Kurulum

1. **Dependencies yükle:**
```bash
cd transcendence-backend
npm install
npm run install:services
```

2. **Environment dosyasını ayarla:**
```bash
# .env dosyası zaten oluşturulmuş
# İsteğe bağlı olarak .env dosyasını düzenle
```

3. **Tüm servisleri başlat:**
```bash
npm run dev
```

### Tekil Servis Çalıştırma

```bash
# Sadece API Gateway
npm run dev:gateway

# Sadece Auth Service
npm run dev:auth

# Sadece User Service
npm run dev:user

# Sadece Friendship Service
npm run dev:friendship

# Sadece Game Service
npm run dev:game
```

## 📋 Servis Endpoints

### API Gateway (http://localhost:3000)
- `GET /health` - Health check
- `/api/auth/*` - Auth service proxy
- `/api/users/*` - User service proxy
- `/api/friendships/*` - Friendship service proxy
- `/api/games/*` - Game service proxy

### Auth Service (http://localhost:3001)
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `POST /api/auth/logout` - Çıkış
- `POST /api/auth/refresh` - Token yenileme
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### User Service (http://localhost:3002)
- `GET /api/users/profile` - Profil görüntüleme
- `PUT /api/users/profile` - Profil güncelleme
- `POST /api/users/avatar` - Avatar yükleme

### Friendship Service (http://localhost:3003)
- `GET /api/friendships` - Arkadaş listesi
- `POST /api/friendships` - Arkadaşlık isteği gönder
- `PUT /api/friendships/:id` - Arkadaşlık isteğini kabul/reddet

### Game Service (http://localhost:3004)
- `GET /api/games` - Oyun listesi
- `POST /api/games` - Yeni oyun oluştur
- `WS /ws` - Gerçek zamanlı oyun iletişimi

## 🗄️ Veritabanı

Proje SQLite kullanır. Veritabanı dosyası otomatik olarak `shared/data/transcendence.db` konumunda oluşturulur.

### Tablolar:
- `users` - Kullanıcı bilgileri
- `friendships` - Arkadaşlık ilişkileri
- `games` - Oyun kayıtları
- `tournaments` - Turnuva bilgileri
- `tournament_participants` - Turnuva katılımcıları

## 🔧 Geliştirme

### Build
```bash
npm run build
```

### Production
```bash
npm run build
npm start
```

### Environment Variables

Gerekli environment değişkenleri `.env` dosyasında tanımlanmıştır:

- `NODE_ENV` - Uygulama ortamı
- `JWT_SECRET` - JWT şifreleme anahtarı
- `PORT` - Ana port (varsayılan: 3000)
- `FRONTEND_URLS` - İzin verilen frontend URL'leri
- Ve diğerleri...

## 📁 Proje Yapısı

```
transcendence-backend/
├── api-gateway/          # API Gateway servisi
├── auth-service/         # Kimlik doğrulama servisi
├── user-service/         # Kullanıcı yönetimi servisi
├── friendship-service/   # Arkadaşlık servisi
├── game-service/         # Oyun servisi
├── shared/              # Ortak utilities ve types
│   ├── src/
│   │   ├── database/    # Veritabanı connection ve migrations
│   │   │   └── index.ts
│   │   ├── types/       # TypeScript type definitions
│   │   └── utils/       # JWT, password, validation utilities
│   │   └── index.ts
│   ├── .env                 # Environment değişkenleri
│   └── package.json         # Ana package.json
```

## 🧪 Test

Health check endpoint'leri test et:
```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

## 🔒 Güvenlik

- JWT token tabanlı kimlik doğrulama
- Rate limiting
- CORS koruması
- Helmet güvenlik middleware'i
- Bcrypt ile şifre hashleme

## 🐛 Sorun Giderme

### Port zaten kullanımda hatası
```bash
# Port'u kontrol et
netstat -an | findstr :3000

# Process'i sonlandır (Windows)
taskkill /F /PID <PID>
```

### Database connection hatası
- `shared/data/` klasörünün var olduğundan emin ol
- Veritabanı dosyasının yazma izinleri olduğunu kontrol et

### Service bağlantı hatası
- Tüm servislerin ayakta olduğunu kontrol et
- Port çakışması olup olmadığını kontrol et

## 📝 Notlar

- Proje development mode'da çalışacak şekilde konfigüre edilmiştir
- Production için JWT_SECRET'ı değiştirin
- Database migrations otomatik olarak çalışır
- Tüm servisler TypeScript ile yazılmıştır 