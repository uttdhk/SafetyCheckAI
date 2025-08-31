const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// 라우트 임포트
const uploadRoutes = require('./routes/upload');
const inspectionRoutes = require('./routes/inspection');
const itemRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');

// 설정 파일
const config = require('./config/config');
const database = require('./config/database');

const app = express();

// 업로드 디렉토리 확인
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 보안 미들웨어
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

// CORS 설정
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://3001-i2sd0826iolazsi3i9bs0.e2b.dev']
        : ['http://localhost:3001', 'https://3001-i2sd0826iolazsi3i9bs0.e2b.dev'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 속도 제한
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100 요청
    message: {
        error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
});
app.use('/api/', limiter);

// 로깅
app.use(morgan('combined'));

// 바디 파서
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 정적 파일 서빙 (업로드된 이미지)
app.use('/uploads', express.static(uploadDir));

// API 라우트
app.use('/api/upload', uploadRoutes);
app.use('/api/inspection', inspectionRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);

// 헬스 체크
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 기본 라우트
app.get('/', (req, res) => {
    res.json({
        message: '🏗️ 산업안전 점검 시스템 API 서버',
        version: '1.0.0',
        description: 'AI 기반 스마트 안전 점검 솔루션',
        endpoints: {
            health: '/api/health',
            upload: '/api/upload',
            inspection: '/api/inspection',
            items: '/api/items'
        }
    });
});

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'API 엔드포인트를 찾을 수 없습니다.',
        path: req.originalUrl
    });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
    console.error('서버 에러:', err);
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? '서버 내부 오류가 발생했습니다.' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// 데이터베이스 연결 및 서버 시작
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // 데이터베이스 연결 테스트
        await database.testConnection();
        console.log('✅ 데이터베이스 연결 성공');
        
        // 서버 시작
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
            console.log(`🌐 서버 URL: http://0.0.0.0:${PORT}`);
            console.log(`📋 API 문서: http://0.0.0.0:${PORT}/api/health`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
            server.close(() => {
                database.close();
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
            server.close(() => {
                database.close();
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ 서버 시작 실패:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;