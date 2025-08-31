const express = require('express');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const chatgptService = require('../services/chatgptService');
const config = require('../config/config');

const router = express.Router();

// 새 검사 생성
router.post('/create', async (req, res) => {
    try {
        const { userName, location, inspectionItems } = req.body;

        if (!userName || !location || !Array.isArray(inspectionItems) || inspectionItems.length === 0) {
            return res.status(400).json({
                success: false,
                error: '필수 정보가 누락되었습니다. (사용자명, 위치, 점검 항목)'
            });
        }

        const inspectionId = uuidv4();
        const inspectionData = {
            id: inspectionId,
            userName,
            location,
            inspectionDate: new Date().toISOString().split('T')[0],
            totalItems: inspectionItems.length,
            completedItems: 0,
            overallScore: 0,
            status: 'CREATED'
        };

        // 데이터베이스에 검사 정보 저장
        await database.createInspection(inspectionData);

        res.json({
            success: true,
            message: '검사가 성공적으로 생성되었습니다.',
            inspection: {
                id: inspectionId,
                ...inspectionData,
                items: inspectionItems
            }
        });

    } catch (error) {
        console.error('❌ 검사 생성 실패:', error);
        res.status(500).json({
            success: false,
            error: '검사 생성 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 검사 시작 및 이미지 분석
router.post('/:inspectionId/analyze', async (req, res) => {
    try {
        const { inspectionId } = req.params;
        const { imageAnalyses } = req.body;

        if (!Array.isArray(imageAnalyses) || imageAnalyses.length === 0) {
            return res.status(400).json({
                success: false,
                error: '분석할 이미지 정보가 없습니다.'
            });
        }

        // 검사 상태를 IN_PROGRESS로 업데이트
        await database.executeQuery(
            'UPDATE INSPECTIONS SET STATUS = :status WHERE ID = :id',
            { status: 'IN_PROGRESS', id: inspectionId },
            { autoCommit: true }
        );

        // 실시간 진행상황을 위한 응답 설정
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // 초기 응답
        res.write(JSON.stringify({
            success: true,
            message: 'AI 분석을 시작합니다.',
            inspectionId,
            totalItems: imageAnalyses.length,
            progress: 0
        }) + '\n');

        const results = [];
        let completedCount = 0;

        // 각 이미지에 대해 순차적으로 AI 분석 수행
        for (const analysis of imageAnalyses) {
            try {
                // 진행상황 업데이트
                res.write(JSON.stringify({
                    type: 'progress',
                    message: `${analysis.itemName} 분석 중...`,
                    currentItem: analysis.itemName,
                    completedItems: completedCount,
                    totalItems: imageAnalyses.length,
                    progress: Math.round((completedCount / imageAnalyses.length) * 100)
                }) + '\n');

                // ChatGPT Vision API로 이미지 분석
                const analysisResult = await chatgptService.analyzeImage(
                    analysis.imagePath,
                    analysis.prompt,
                    analysis.itemName
                );

                // 결과를 데이터베이스에 저장
                const resultId = uuidv4();
                const resultData = {
                    id: resultId,
                    inspectionId: inspectionId,
                    itemId: analysis.itemId,
                    imagePath: analysis.imagePath,
                    aiAnalysis: analysisResult.aiAnalysis,
                    complianceScore: analysisResult.complianceScore,
                    issuesFound: JSON.stringify(analysisResult.issuesFound),
                    recommendations: JSON.stringify(analysisResult.recommendations)
                };

                await database.createInspectionResult(resultData);

                results.push({
                    itemId: analysis.itemId,
                    itemName: analysis.itemName,
                    ...analysisResult
                });

                completedCount++;

                // 완료된 항목 업데이트
                res.write(JSON.stringify({
                    type: 'item_complete',
                    itemName: analysis.itemName,
                    result: analysisResult,
                    completedItems: completedCount,
                    totalItems: imageAnalyses.length,
                    progress: Math.round((completedCount / imageAnalyses.length) * 100)
                }) + '\n');

            } catch (itemError) {
                console.error(`❌ ${analysis.itemName} 분석 실패:`, itemError);
                
                // 오류 발생 시에도 결과 저장
                const errorResult = {
                    complianceScore: 50,
                    issuesFound: [`${analysis.itemName} 분석 중 오류 발생`],
                    recommendations: ['수동 점검이 필요합니다.'],
                    aiAnalysis: `분석 오류: ${itemError.message}`,
                    analysisTime: new Date().toISOString()
                };

                results.push({
                    itemId: analysis.itemId,
                    itemName: analysis.itemName,
                    ...errorResult,
                    error: true
                });

                completedCount++;

                res.write(JSON.stringify({
                    type: 'item_error',
                    itemName: analysis.itemName,
                    error: itemError.message,
                    completedItems: completedCount,
                    totalItems: imageAnalyses.length,
                    progress: Math.round((completedCount / imageAnalyses.length) * 100)
                }) + '\n');
            }
        }

        // 전체 점수 계산
        const overallScore = Math.round(
            results.reduce((sum, result) => sum + result.complianceScore, 0) / results.length
        );

        // 검사 완료 상태 업데이트
        await database.executeQuery(
            `UPDATE INSPECTIONS SET 
                STATUS = :status, 
                COMPLETED_ITEMS = :completedItems, 
                OVERALL_SCORE = :overallScore 
            WHERE ID = :id`,
            {
                status: 'COMPLETED',
                completedItems: completedCount,
                overallScore,
                id: inspectionId
            },
            { autoCommit: true }
        );

        // 최종 결과 전송
        res.write(JSON.stringify({
            type: 'complete',
            success: true,
            message: 'AI 분석이 완료되었습니다.',
            inspectionId,
            results,
            summary: {
                totalItems: imageAnalyses.length,
                completedItems: completedCount,
                overallScore,
                averageScore: overallScore,
                analysisTime: new Date().toISOString()
            }
        }));

        res.end();

    } catch (error) {
        console.error('❌ 검사 분석 실패:', error);
        
        try {
            res.write(JSON.stringify({
                success: false,
                error: '검사 분석 중 오류가 발생했습니다.',
                details: error.message
            }));
            res.end();
        } catch (writeError) {
            console.error('❌ 응답 전송 실패:', writeError);
        }
    }
});

// 검사 결과 조회
router.get('/:inspectionId', async (req, res) => {
    try {
        const { inspectionId } = req.params;

        // 검사 기본 정보 조회
        const inspectionResult = await database.getInspectionById(inspectionId);
        if (!inspectionResult.rows || inspectionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '검사 정보를 찾을 수 없습니다.'
            });
        }

        const inspection = inspectionResult.rows[0];

        // 검사 결과 상세 조회
        const resultsQuery = await database.getInspectionResults(inspectionId);
        const results = resultsQuery.rows.map(row => ({
            id: row.ID,
            itemId: row.ITEM_ID,
            itemName: row.ITEM_NAME,
            category: row.CATEGORY,
            imagePath: row.IMAGE_PATH,
            complianceScore: row.COMPLIANCE_SCORE,
            issuesFound: JSON.parse(row.ISSUES_FOUND || '[]'),
            recommendations: JSON.parse(row.RECOMMENDATIONS || '[]'),
            aiAnalysis: row.AI_ANALYSIS,
            createdAt: row.CREATED_AT
        }));

        res.json({
            success: true,
            inspection: {
                id: inspection.ID,
                userName: inspection.USER_NAME,
                location: inspection.LOCATION,
                inspectionDate: inspection.INSPECTION_DATE,
                status: inspection.STATUS,
                totalItems: inspection.TOTAL_ITEMS,
                completedItems: inspection.COMPLETED_ITEMS,
                overallScore: inspection.OVERALL_SCORE,
                createdAt: inspection.CREATED_AT,
                results
            }
        });

    } catch (error) {
        console.error('❌ 검사 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '검사 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 검사 목록 조회
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, location } = req.query;
        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM INSPECTIONS WHERE 1=1';
        const binds = {};

        if (status) {
            sql += ' AND STATUS = :status';
            binds.status = status;
        }

        if (location) {
            sql += ' AND UPPER(LOCATION) LIKE UPPER(:location)';
            binds.location = `%${location}%`;
        }

        sql += ' ORDER BY CREATED_AT DESC';

        // 페이징 적용
        const pagedSql = `
            SELECT * FROM (
                SELECT i.*, ROW_NUMBER() OVER (ORDER BY i.CREATED_AT DESC) as rn
                FROM (${sql}) i
            ) WHERE rn > :offset AND rn <= :limit
        `;

        binds.offset = offset;
        binds.limit = offset + parseInt(limit);

        const result = await database.executeQuery(pagedSql, binds);

        const inspections = result.rows.map(row => ({
            id: row.ID,
            userName: row.USER_NAME,
            location: row.LOCATION,
            inspectionDate: row.INSPECTION_DATE,
            status: row.STATUS,
            totalItems: row.TOTAL_ITEMS,
            completedItems: row.COMPLETED_ITEMS,
            overallScore: row.OVERALL_SCORE,
            createdAt: row.CREATED_AT
        }));

        res.json({
            success: true,
            inspections,
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                total: inspections.length
            }
        });

    } catch (error) {
        console.error('❌ 검사 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '검사 목록 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 검사 통계
router.get('/stats/summary', async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const statsResult = await database.getInspectionStats(days);
        const stats = statsResult.rows[0];

        // 추가 통계 계산
        const scoreDistribution = await database.executeQuery(`
            SELECT 
                CASE 
                    WHEN OVERALL_SCORE >= 90 THEN 'EXCELLENT'
                    WHEN OVERALL_SCORE >= 80 THEN 'GOOD'
                    WHEN OVERALL_SCORE >= 70 THEN 'FAIR'
                    ELSE 'POOR'
                END as SCORE_RANGE,
                COUNT(*) as COUNT
            FROM INSPECTIONS 
            WHERE CREATED_AT >= SYSDATE - :days
                AND STATUS = 'COMPLETED'
            GROUP BY 
                CASE 
                    WHEN OVERALL_SCORE >= 90 THEN 'EXCELLENT'
                    WHEN OVERALL_SCORE >= 80 THEN 'GOOD'
                    WHEN OVERALL_SCORE >= 70 THEN 'FAIR'
                    ELSE 'POOR'
                END
        `, { days });

        res.json({
            success: true,
            stats: {
                totalInspections: stats.TOTAL_INSPECTIONS,
                averageScore: Math.round(stats.AVG_SCORE || 0),
                completedInspections: stats.COMPLETED,
                inProgressInspections: stats.IN_PROGRESS,
                scoreDistribution: scoreDistribution.rows.reduce((acc, row) => {
                    acc[row.SCORE_RANGE.toLowerCase()] = row.COUNT;
                    return acc;
                }, {}),
                period: `${days}일간`
            }
        });

    } catch (error) {
        console.error('❌ 통계 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '통계 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 검사 삭제
router.delete('/:inspectionId', async (req, res) => {
    try {
        const { inspectionId } = req.params;

        // 트랜잭션으로 관련 데이터 모두 삭제
        await database.executeTransaction([
            {
                sql: 'DELETE FROM INSPECTION_RESULTS WHERE INSPECTION_ID = :inspectionId',
                binds: { inspectionId }
            },
            {
                sql: 'DELETE FROM INSPECTIONS WHERE ID = :inspectionId',
                binds: { inspectionId }
            }
        ]);

        res.json({
            success: true,
            message: '검사가 성공적으로 삭제되었습니다.',
            inspectionId
        });

    } catch (error) {
        console.error('❌ 검사 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '검사 삭제 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

module.exports = router;