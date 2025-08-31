require('dotenv').config();

module.exports = {
    // 서버 설정
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        environment: process.env.NODE_ENV || 'development'
    },

    // 데이터베이스 설정
    database: {
        user: process.env.DB_USER || 'safety_admin',
        password: process.env.DB_PASSWORD || 'safety123!@#',
        connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/XE',
        poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
        poolMax: parseInt(process.env.DB_POOL_MAX) || 10
    },

    // OpenAI 설정
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4-vision-preview',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.1
    },

    // 파일 업로드 설정
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/webp'
        ],
        uploadPath: process.env.UPLOAD_PATH || './uploads',
        maxFiles: parseInt(process.env.MAX_FILES) || 10
    },

    // CORS 설정
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://3001-i2sd0826iolazsi3i9bs0.e2b.dev']
            : ['http://localhost:3001', 'https://3001-i2sd0826iolazsi3i9bs0.e2b.dev'],
        credentials: true
    },

    // JWT 설정
    jwt: {
        secret: process.env.JWT_SECRET || 'safety-inspection-secret-key-2024',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    // Rate Limiting 설정
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15분
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // 최대 요청 수
    },

    // 로깅 설정
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined'
    },

    // AI 분석 설정
    analysis: {
        defaultPrompts: {
            safety: `다음 산업 현장 이미지를 분석하여 안전 규정 준수 여부를 평가해주세요:

1. 개인보호구(PPE) 착용 상태
2. 작업 환경의 안전성
3. 장비 및 도구의 상태
4. 안전 표지판 및 경고 표시
5. 작업자의 안전한 작업 자세

다음 형식으로 응답해주세요:
- 준수 점수: 0-100점
- 발견된 문제점: 구체적으로 나열
- 개선 권고사항: 실행 가능한 방안 제시`,

            equipment: `다음 장비/도구 이미지를 분석하여 안전 상태를 평가해주세요:

1. 장비의 물리적 상태 (손상, 마모, 부식 등)
2. 안전 장치 작동 여부
3. 정기 점검 스티커 및 표시
4. 보호 커버 및 가드 설치 상태
5. 전기 안전 (접지, 절연 등)

응답 형식:
- 안전 점수: 0-100점
- 문제점: 세부 내용
- 권고사항: 즉시/단기/장기 조치사항`,

            environment: `다음 작업 환경 이미지를 분석하여 안전성을 평가해주세요:

1. 통로 및 비상구 확보 상태
2. 조명 및 가시성
3. 바닥 상태 (미끄럼, 장애물 등)
4. 화재 안전 (소화기, 스프링클러 등)
5. 환기 및 공기 질
6. 정리정돈 상태

응답 형식:
- 환경 안전 점수: 0-100점
- 위험 요소: 구체적 위치 및 내용
- 개선 방안: 우선순위별 조치사항`
        },
        
        timeouts: {
            analysis: 30000, // 30초
            upload: 60000 // 60초
        }
    }
};