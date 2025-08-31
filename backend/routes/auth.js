const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

const router = express.Router();

// 임시 사용자 데이터 (실제 환경에서는 데이터베이스 사용)
const users = new Map();

// 기본 관리자 계정 생성
const adminUser = {
    id: uuidv4(),
    username: 'admin',
    email: 'admin@safety.com',
    password: '$2b$10$rQkMLvKW8m8EYuS4r5lzuO9kFvVqPQZhKT2mKG8YQKqQh5lzuO9kF', // 'admin123'
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString()
};

users.set('admin', adminUser);

// JWT 토큰 생성 함수
function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };
    
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
}

// JWT 토큰 검증 미들웨어
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: '액세스 토큰이 필요합니다.'
        });
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: '유효하지 않은 토큰입니다.'
            });
        }
        req.user = user;
        next();
    });
}

// 로그인
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: '사용자명과 비밀번호를 입력해주세요.'
            });
        }

        // 사용자 조회
        const user = users.get(username);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: '사용자명 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // 비밀번호 검증
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: '사용자명 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // JWT 토큰 생성
        const token = generateToken(user);

        res.json({
            success: true,
            message: '로그인이 성공적으로 완료되었습니다.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ 로그인 실패:', error);
        res.status(500).json({
            success: false,
            error: '로그인 처리 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 회원가입
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role = 'USER' } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: '모든 필드를 입력해주세요.'
            });
        }

        // 사용자명 중복 검사
        if (users.has(username)) {
            return res.status(400).json({
                success: false,
                error: '이미 사용 중인 사용자명입니다.'
            });
        }

        // 이메일 중복 검사
        const emailExists = Array.from(users.values()).some(user => user.email === email);
        if (emailExists) {
            return res.status(400).json({
                success: false,
                error: '이미 사용 중인 이메일입니다.'
            });
        }

        // 비밀번호 해싱
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 새 사용자 생성
        const newUser = {
            id: uuidv4(),
            username,
            email,
            password: hashedPassword,
            role: role.toUpperCase(),
            isActive: true,
            createdAt: new Date().toISOString()
        };

        users.set(username, newUser);

        // JWT 토큰 생성
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: '회원가입이 성공적으로 완료되었습니다.',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('❌ 회원가입 실패:', error);
        res.status(500).json({
            success: false,
            error: '회원가입 처리 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 토큰 검증
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: '토큰이 유효합니다.',
        user: req.user
    });
});

// 사용자 정보 조회
router.get('/profile', authenticateToken, (req, res) => {
    const user = users.get(req.user.username);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            error: '사용자를 찾을 수 없습니다.'
        });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        }
    });
});

// 비밀번호 변경
router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: '현재 비밀번호와 새 비밀번호를 입력해주세요.'
            });
        }

        const user = users.get(req.user.username);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다.'
            });
        }

        // 현재 비밀번호 검증
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                error: '현재 비밀번호가 올바르지 않습니다.'
            });
        }

        // 새 비밀번호 해싱 및 저장
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedNewPassword;

        users.set(req.user.username, user);

        res.json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        });

    } catch (error) {
        console.error('❌ 비밀번호 변경 실패:', error);
        res.status(500).json({
            success: false,
            error: '비밀번호 변경 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 로그아웃 (클라이언트에서 토큰 삭제)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: '로그아웃되었습니다.'
    });
});

// 사용자 목록 조회 (관리자만)
router.get('/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: '관리자 권한이 필요합니다.'
        });
    }

    const userList = Array.from(users.values()).map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
    }));

    res.json({
        success: true,
        users: userList,
        count: userList.length
    });
});

// 사용자 활성화/비활성화 (관리자만)
router.put('/users/:userId/status', authenticateToken, (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: '관리자 권한이 필요합니다.'
        });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            error: '사용자를 찾을 수 없습니다.'
        });
    }

    user.isActive = isActive;
    users.set(user.username, user);

    res.json({
        success: true,
        message: `사용자가 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        }
    });
});

// 데모 계정 정보
router.get('/demo', (req, res) => {
    res.json({
        success: true,
        message: '데모 계정 정보',
        accounts: [
            {
                username: 'admin',
                password: 'admin123',
                role: 'ADMIN',
                description: '시스템 관리자 계정'
            }
        ],
        note: '데모 환경에서만 사용 가능한 계정입니다.'
    });
});

module.exports = { router, authenticateToken };