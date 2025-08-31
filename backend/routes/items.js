const express = require('express');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const config = require('../config/config');

const router = express.Router();

// 점검 항목 생성
router.post('/', async (req, res) => {
    try {
        const { name, prompt, category = 'GENERAL' } = req.body;

        if (!name || !prompt) {
            return res.status(400).json({
                success: false,
                error: '점검 항목명과 프롬프트는 필수입니다.'
            });
        }

        const itemId = uuidv4();
        const itemData = {
            id: itemId,
            name: name.trim(),
            prompt: prompt.trim(),
            category: category.toUpperCase(),
            isActive: 1
        };

        await database.createInspectionItem(itemData);

        res.json({
            success: true,
            message: '점검 항목이 성공적으로 생성되었습니다.',
            item: {
                id: itemId,
                name: itemData.name,
                prompt: itemData.prompt,
                category: itemData.category,
                isActive: true,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ 점검 항목 생성 실패:', error);
        res.status(500).json({
            success: false,
            error: '점검 항목 생성 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 점검 항목 목록 조회
router.get('/', async (req, res) => {
    try {
        const { category, active = 'true' } = req.query;

        let sql = 'SELECT * FROM INSPECTION_ITEMS WHERE 1=1';
        const binds = {};

        if (active === 'true') {
            sql += ' AND IS_ACTIVE = 1';
        }

        if (category) {
            sql += ' AND CATEGORY = :category';
            binds.category = category.toUpperCase();
        }

        sql += ' ORDER BY CATEGORY, NAME';

        const result = await database.executeQuery(sql, binds);

        const items = result.rows.map(row => ({
            id: row.ID,
            name: row.NAME,
            prompt: row.PROMPT,
            category: row.CATEGORY,
            isActive: row.IS_ACTIVE === 1,
            createdAt: row.CREATED_AT
        }));

        res.json({
            success: true,
            items,
            count: items.length,
            categories: [...new Set(items.map(item => item.category))]
        });

    } catch (error) {
        console.error('❌ 점검 항목 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '점검 항목 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 특정 점검 항목 조회
router.get('/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;

        const result = await database.executeQuery(
            'SELECT * FROM INSPECTION_ITEMS WHERE ID = :id',
            { id: itemId }
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '점검 항목을 찾을 수 없습니다.'
            });
        }

        const row = result.rows[0];
        const item = {
            id: row.ID,
            name: row.NAME,
            prompt: row.PROMPT,
            category: row.CATEGORY,
            isActive: row.IS_ACTIVE === 1,
            createdAt: row.CREATED_AT
        };

        res.json({
            success: true,
            item
        });

    } catch (error) {
        console.error('❌ 점검 항목 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '점검 항목 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 점검 항목 수정
router.put('/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { name, prompt, category, isActive } = req.body;

        // 기존 항목 확인
        const existingItem = await database.executeQuery(
            'SELECT * FROM INSPECTION_ITEMS WHERE ID = :id',
            { id: itemId }
        );

        if (!existingItem.rows || existingItem.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '점검 항목을 찾을 수 없습니다.'
            });
        }

        // 업데이트할 데이터 준비
        const updates = [];
        const binds = { id: itemId };

        if (name !== undefined) {
            updates.push('NAME = :name');
            binds.name = name.trim();
        }

        if (prompt !== undefined) {
            updates.push('PROMPT = :prompt');
            binds.prompt = prompt.trim();
        }

        if (category !== undefined) {
            updates.push('CATEGORY = :category');
            binds.category = category.toUpperCase();
        }

        if (isActive !== undefined) {
            updates.push('IS_ACTIVE = :isActive');
            binds.isActive = isActive ? 1 : 0;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: '업데이트할 정보가 없습니다.'
            });
        }

        const sql = `UPDATE INSPECTION_ITEMS SET ${updates.join(', ')} WHERE ID = :id`;
        await database.executeQuery(sql, binds, { autoCommit: true });

        // 업데이트된 항목 조회
        const updatedResult = await database.executeQuery(
            'SELECT * FROM INSPECTION_ITEMS WHERE ID = :id',
            { id: itemId }
        );

        const row = updatedResult.rows[0];
        const updatedItem = {
            id: row.ID,
            name: row.NAME,
            prompt: row.PROMPT,
            category: row.CATEGORY,
            isActive: row.IS_ACTIVE === 1,
            createdAt: row.CREATED_AT
        };

        res.json({
            success: true,
            message: '점검 항목이 성공적으로 수정되었습니다.',
            item: updatedItem
        });

    } catch (error) {
        console.error('❌ 점검 항목 수정 실패:', error);
        res.status(500).json({
            success: false,
            error: '점검 항목 수정 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 점검 항목 삭제 (비활성화)
router.delete('/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { permanent = false } = req.query;

        if (permanent === 'true') {
            // 영구 삭제 - 관련 검사 결과가 있는지 확인
            const usageCheck = await database.executeQuery(
                'SELECT COUNT(*) as COUNT FROM INSPECTION_RESULTS WHERE ITEM_ID = :itemId',
                { itemId }
            );

            if (usageCheck.rows[0].COUNT > 0) {
                return res.status(400).json({
                    success: false,
                    error: '이 점검 항목을 사용하는 검사 결과가 있어 삭제할 수 없습니다. 비활성화만 가능합니다.'
                });
            }

            // 영구 삭제 실행
            await database.executeQuery(
                'DELETE FROM INSPECTION_ITEMS WHERE ID = :id',
                { id: itemId },
                { autoCommit: true }
            );

            res.json({
                success: true,
                message: '점검 항목이 영구적으로 삭제되었습니다.',
                itemId
            });
        } else {
            // 비활성화
            await database.executeQuery(
                'UPDATE INSPECTION_ITEMS SET IS_ACTIVE = 0 WHERE ID = :id',
                { id: itemId },
                { autoCommit: true }
            );

            res.json({
                success: true,
                message: '점검 항목이 비활성화되었습니다.',
                itemId
            });
        }

    } catch (error) {
        console.error('❌ 점검 항목 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '점검 항목 삭제 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 기본 점검 항목 생성 (시스템 초기화용)
router.post('/initialize', async (req, res) => {
    try {
        const defaultItems = [
            {
                id: uuidv4(),
                name: '개인보호구 착용',
                category: 'PPE',
                prompt: config.analysis.defaultPrompts.safety,
                isActive: 1
            },
            {
                id: uuidv4(),
                name: '작업 환경 안전성',
                category: 'ENVIRONMENT',
                prompt: config.analysis.defaultPrompts.environment,
                isActive: 1
            },
            {
                id: uuidv4(),
                name: '장비 및 도구 상태',
                category: 'EQUIPMENT',
                prompt: config.analysis.defaultPrompts.equipment,
                isActive: 1
            },
            {
                id: uuidv4(),
                name: '안전 표지판 및 경고',
                category: 'SIGNAGE',
                prompt: `다음 이미지에서 안전 표지판 및 경고 표시를 분석해주세요:

1. 안전 표지판의 가시성 및 위치
2. 경고 표시의 명확성
3. 비상 상황 안내 표시
4. 금지 및 주의 표시
5. 안전 구역 표시

응답 형식:
- 표시 완성도: 0-100점
- 부족한 표시: 구체적으로 나열
- 개선 권고: 추가 또는 교체 필요 표시`,
                isActive: 1
            },
            {
                id: uuidv4(),
                name: '화재 안전 시설',
                category: 'FIRE_SAFETY',
                prompt: `다음 이미지에서 화재 안전 시설을 분석해주세요:

1. 소화기 설치 및 상태
2. 비상구 표시 및 접근성
3. 화재 감지기 설치
4. 스프링클러 시설
5. 화재 대피 경로

응답 형식:
- 화재 안전 점수: 0-100점
- 문제점: 세부 내용
- 권고사항: 즉시 조치 필요 사항`,
                isActive: 1
            }
        ];

        // 기존 항목 확인
        const existingItems = await database.executeQuery(
            'SELECT COUNT(*) as COUNT FROM INSPECTION_ITEMS WHERE IS_ACTIVE = 1'
        );

        if (existingItems.rows[0].COUNT > 0) {
            return res.status(400).json({
                success: false,
                error: '이미 점검 항목이 존재합니다. 초기화가 필요한 경우 기존 항목을 먼저 삭제해주세요.'
            });
        }

        // 기본 항목들 생성
        for (const item of defaultItems) {
            await database.createInspectionItem(item);
        }

        res.json({
            success: true,
            message: `${defaultItems.length}개의 기본 점검 항목이 생성되었습니다.`,
            items: defaultItems.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                isActive: true
            }))
        });

    } catch (error) {
        console.error('❌ 기본 항목 생성 실패:', error);
        res.status(500).json({
            success: false,
            error: '기본 점검 항목 생성 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 카테고리별 점검 항목 통계
router.get('/stats/categories', async (req, res) => {
    try {
        const result = await database.executeQuery(`
            SELECT 
                CATEGORY,
                COUNT(*) as TOTAL_ITEMS,
                COUNT(CASE WHEN IS_ACTIVE = 1 THEN 1 END) as ACTIVE_ITEMS,
                COUNT(CASE WHEN IS_ACTIVE = 0 THEN 1 END) as INACTIVE_ITEMS
            FROM INSPECTION_ITEMS
            GROUP BY CATEGORY
            ORDER BY CATEGORY
        `);

        const categoryStats = result.rows.map(row => ({
            category: row.CATEGORY,
            totalItems: row.TOTAL_ITEMS,
            activeItems: row.ACTIVE_ITEMS,
            inactiveItems: row.INACTIVE_ITEMS
        }));

        res.json({
            success: true,
            categoryStats,
            summary: {
                totalCategories: categoryStats.length,
                totalItems: categoryStats.reduce((sum, cat) => sum + cat.totalItems, 0),
                totalActiveItems: categoryStats.reduce((sum, cat) => sum + cat.activeItems, 0)
            }
        });

    } catch (error) {
        console.error('❌ 카테고리 통계 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '카테고리 통계 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 점검 항목 복사
router.post('/:itemId/copy', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { name } = req.body;

        // 원본 항목 조회
        const originalResult = await database.executeQuery(
            'SELECT * FROM INSPECTION_ITEMS WHERE ID = :id',
            { id: itemId }
        );

        if (!originalResult.rows || originalResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '복사할 점검 항목을 찾을 수 없습니다.'
            });
        }

        const original = originalResult.rows[0];
        const newItemId = uuidv4();
        const newName = name || `${original.NAME} (복사본)`;

        const newItemData = {
            id: newItemId,
            name: newName,
            prompt: original.PROMPT,
            category: original.CATEGORY,
            isActive: 1
        };

        await database.createInspectionItem(newItemData);

        res.json({
            success: true,
            message: '점검 항목이 성공적으로 복사되었습니다.',
            item: {
                id: newItemId,
                name: newName,
                prompt: original.PROMPT,
                category: original.CATEGORY,
                isActive: true,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ 점검 항목 복사 실패:', error);
        res.status(500).json({
            success: false,
            error: '점검 항목 복사 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

module.exports = router;