const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

const router = express.Router();

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: config.upload.maxFiles
    },
    fileFilter: (req, file, cb) => {
        if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`지원하지 않는 파일 형식입니다. 허용된 형식: ${config.upload.allowedMimeTypes.join(', ')}`), false);
        }
    }
});

// 단일 파일 업로드
router.post('/single', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '업로드할 파일이 없습니다.'
            });
        }

        const fileId = uuidv4();
        const filename = `${fileId}.jpg`;
        const filepath = path.join(uploadDir, filename);

        // Sharp를 사용하여 이미지 최적화
        await sharp(req.file.buffer)
            .resize(1920, 1080, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .jpeg({ 
                quality: 85,
                progressive: true 
            })
            .toFile(filepath);

        const fileInfo = {
            id: fileId,
            originalName: req.file.originalname,
            filename: filename,
            path: filepath,
            relativePath: `/uploads/${filename}`,
            size: fs.statSync(filepath).size,
            mimeType: 'image/jpeg',
            uploadedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            message: '파일이 성공적으로 업로드되었습니다.',
            file: fileInfo
        });

    } catch (error) {
        console.error('❌ 파일 업로드 실패:', error);
        res.status(500).json({
            success: false,
            error: '파일 업로드 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 다중 파일 업로드
router.post('/multiple', upload.array('images', config.upload.maxFiles), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: '업로드할 파일이 없습니다.'
            });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            const fileId = uuidv4();
            const filename = `${fileId}.jpg`;
            const filepath = path.join(uploadDir, filename);

            // Sharp를 사용하여 이미지 최적화
            await sharp(file.buffer)
                .resize(1920, 1080, { 
                    fit: 'inside',
                    withoutEnlargement: true 
                })
                .jpeg({ 
                    quality: 85,
                    progressive: true 
                })
                .toFile(filepath);

            const fileInfo = {
                id: fileId,
                originalName: file.originalname,
                filename: filename,
                path: filepath,
                relativePath: `/uploads/${filename}`,
                size: fs.statSync(filepath).size,
                mimeType: 'image/jpeg',
                uploadedAt: new Date().toISOString()
            };

            uploadedFiles.push(fileInfo);
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length}개 파일이 성공적으로 업로드되었습니다.`,
            files: uploadedFiles,
            count: uploadedFiles.length
        });

    } catch (error) {
        console.error('❌ 다중 파일 업로드 실패:', error);
        res.status(500).json({
            success: false,
            error: '파일 업로드 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// Base64 이미지 업로드
router.post('/base64', async (req, res) => {
    try {
        const { imageData, filename } = req.body;

        if (!imageData) {
            return res.status(400).json({
                success: false,
                error: '이미지 데이터가 없습니다.'
            });
        }

        // Base64 데이터 파싱
        const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({
                success: false,
                error: '유효하지 않은 Base64 이미지 데이터입니다.'
            });
        }

        const imageType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        const fileId = uuidv4();
        const finalFilename = `${fileId}.jpg`;
        const filepath = path.join(uploadDir, finalFilename);

        // Sharp를 사용하여 이미지 처리
        await sharp(buffer)
            .resize(1920, 1080, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .jpeg({ 
                quality: 85,
                progressive: true 
            })
            .toFile(filepath);

        const fileInfo = {
            id: fileId,
            originalName: filename || `image.${imageType}`,
            filename: finalFilename,
            path: filepath,
            relativePath: `/uploads/${finalFilename}`,
            size: fs.statSync(filepath).size,
            mimeType: 'image/jpeg',
            uploadedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Base64 이미지가 성공적으로 업로드되었습니다.',
            file: fileInfo
        });

    } catch (error) {
        console.error('❌ Base64 업로드 실패:', error);
        res.status(500).json({
            success: false,
            error: 'Base64 이미지 업로드 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 파일 삭제
router.delete('/:fileId', (req, res) => {
    try {
        const { fileId } = req.params;
        const filename = `${fileId}.jpg`;
        const filepath = path.join(uploadDir, filename);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            res.json({
                success: true,
                message: '파일이 성공적으로 삭제되었습니다.',
                fileId
            });
        } else {
            res.status(404).json({
                success: false,
                error: '파일을 찾을 수 없습니다.'
            });
        }

    } catch (error) {
        console.error('❌ 파일 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '파일 삭제 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 파일 정보 조회
router.get('/:fileId', (req, res) => {
    try {
        const { fileId } = req.params;
        const filename = `${fileId}.jpg`;
        const filepath = path.join(uploadDir, filename);

        if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            
            res.json({
                success: true,
                file: {
                    id: fileId,
                    filename: filename,
                    relativePath: `/uploads/${filename}`,
                    size: stats.size,
                    uploadedAt: stats.birthtime.toISOString(),
                    modifiedAt: stats.mtime.toISOString()
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: '파일을 찾을 수 없습니다.'
            });
        }

    } catch (error) {
        console.error('❌ 파일 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '파일 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 업로드된 파일 목록 조회
router.get('/', (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir)
            .filter(filename => filename.endsWith('.jpg'))
            .map(filename => {
                const filepath = path.join(uploadDir, filename);
                const stats = fs.statSync(filepath);
                const fileId = path.basename(filename, '.jpg');

                return {
                    id: fileId,
                    filename: filename,
                    relativePath: `/uploads/${filename}`,
                    size: stats.size,
                    uploadedAt: stats.birthtime.toISOString(),
                    modifiedAt: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        res.json({
            success: true,
            files: files,
            count: files.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0)
        });

    } catch (error) {
        console.error('❌ 파일 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '파일 목록 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 에러 핸들러
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: `파일 크기가 너무 큽니다. 최대 크기: ${config.upload.maxFileSize / (1024 * 1024)}MB`
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: `파일 개수가 너무 많습니다. 최대 개수: ${config.upload.maxFiles}개`
            });
        }
    }

    res.status(500).json({
        success: false,
        error: '파일 업로드 중 오류가 발생했습니다.',
        details: error.message
    });
});

module.exports = router;