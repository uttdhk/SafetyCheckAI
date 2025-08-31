const oracledb = require('oracledb');

// Oracle DB 연결 설정
const dbConfig = {
    user: process.env.DB_USER || 'safety_admin',
    password: process.env.DB_PASSWORD || 'safety123!@#',
    connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/XE',
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 300,
    autoCommit: false
};

let pool;

class Database {
    constructor() {
        this.pool = null;
    }

    async initialize() {
        try {
            // Oracle DB 클라이언트 초기화 (Thick 모드)
            oracledb.initOracleClient();
            
            // 연결 풀 생성
            this.pool = await oracledb.createPool(dbConfig);
            console.log('📊 Oracle DB 연결 풀이 생성되었습니다.');
            
            return this.pool;
        } catch (error) {
            console.error('❌ 데이터베이스 초기화 실패:', error);
            throw error;
        }
    }

    async getConnection() {
        try {
            if (!this.pool) {
                await this.initialize();
            }
            return await this.pool.getConnection();
        } catch (error) {
            console.error('❌ 데이터베이스 연결 실패:', error);
            throw error;
        }
    }

    async testConnection() {
        let connection;
        try {
            connection = await this.getConnection();
            const result = await connection.execute('SELECT SYSDATE FROM DUAL');
            console.log('✅ 데이터베이스 연결 테스트 성공:', result.rows[0][0]);
            return true;
        } catch (error) {
            console.error('❌ 데이터베이스 연결 테스트 실패:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    async executeQuery(sql, binds = [], options = {}) {
        let connection;
        try {
            connection = await this.getConnection();
            
            const defaultOptions = {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                autoCommit: false
            };
            
            const result = await connection.execute(sql, binds, { ...defaultOptions, ...options });
            
            if (options.autoCommit !== false) {
                await connection.commit();
            }
            
            return result;
        } catch (error) {
            if (connection && options.autoCommit !== false) {
                await connection.rollback();
            }
            console.error('❌ 쿼리 실행 실패:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    async executeTransaction(queries) {
        let connection;
        try {
            connection = await this.getConnection();
            
            for (const query of queries) {
                await connection.execute(
                    query.sql, 
                    query.binds || [], 
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
            }
            
            await connection.commit();
            return { success: true };
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('❌ 트랜잭션 실행 실패:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    // 검사 관련 메서드
    async createInspection(data) {
        const sql = `
            INSERT INTO INSPECTIONS (
                ID, USER_NAME, LOCATION, INSPECTION_DATE, TOTAL_ITEMS, 
                COMPLETED_ITEMS, OVERALL_SCORE, STATUS, CREATED_AT
            ) VALUES (
                :id, :userName, :location, :inspectionDate, :totalItems,
                :completedItems, :overallScore, :status, SYSDATE
            )
        `;
        
        return await this.executeQuery(sql, data, { autoCommit: true });
    }

    async getInspections(limit = 50, offset = 0) {
        const sql = `
            SELECT * FROM (
                SELECT i.*, ROW_NUMBER() OVER (ORDER BY i.CREATED_AT DESC) as rn
                FROM INSPECTIONS i
            ) WHERE rn > :offset AND rn <= :limit
        `;
        
        return await this.executeQuery(sql, { offset, limit: offset + limit });
    }

    async getInspectionById(id) {
        const sql = 'SELECT * FROM INSPECTIONS WHERE ID = :id';
        return await this.executeQuery(sql, { id });
    }

    // 점검 항목 관련 메서드
    async createInspectionItem(data) {
        const sql = `
            INSERT INTO INSPECTION_ITEMS (
                ID, NAME, PROMPT, CATEGORY, IS_ACTIVE, CREATED_AT
            ) VALUES (
                :id, :name, :prompt, :category, :isActive, SYSDATE
            )
        `;
        
        return await this.executeQuery(sql, data, { autoCommit: true });
    }

    async getInspectionItems(category = null) {
        let sql = 'SELECT * FROM INSPECTION_ITEMS WHERE IS_ACTIVE = 1';
        let binds = {};
        
        if (category) {
            sql += ' AND CATEGORY = :category';
            binds.category = category;
        }
        
        sql += ' ORDER BY NAME';
        return await this.executeQuery(sql, binds);
    }

    // 검사 결과 관련 메서드
    async createInspectionResult(data) {
        const sql = `
            INSERT INTO INSPECTION_RESULTS (
                ID, INSPECTION_ID, ITEM_ID, IMAGE_PATH, AI_ANALYSIS,
                COMPLIANCE_SCORE, ISSUES_FOUND, RECOMMENDATIONS, CREATED_AT
            ) VALUES (
                :id, :inspectionId, :itemId, :imagePath, :aiAnalysis,
                :complianceScore, :issuesFound, :recommendations, SYSDATE
            )
        `;
        
        return await this.executeQuery(sql, data, { autoCommit: true });
    }

    async getInspectionResults(inspectionId) {
        const sql = `
            SELECT ir.*, ii.NAME as ITEM_NAME, ii.CATEGORY 
            FROM INSPECTION_RESULTS ir
            JOIN INSPECTION_ITEMS ii ON ir.ITEM_ID = ii.ID
            WHERE ir.INSPECTION_ID = :inspectionId
            ORDER BY ir.CREATED_AT
        `;
        
        return await this.executeQuery(sql, { inspectionId });
    }

    // 통계 관련 메서드
    async getInspectionStats(days = 30) {
        const sql = `
            SELECT 
                COUNT(*) as TOTAL_INSPECTIONS,
                AVG(OVERALL_SCORE) as AVG_SCORE,
                COUNT(CASE WHEN STATUS = 'COMPLETED' THEN 1 END) as COMPLETED,
                COUNT(CASE WHEN STATUS = 'IN_PROGRESS' THEN 1 END) as IN_PROGRESS
            FROM INSPECTIONS 
            WHERE CREATED_AT >= SYSDATE - :days
        `;
        
        return await this.executeQuery(sql, { days });
    }

    async close() {
        try {
            if (this.pool) {
                await this.pool.close(10);
                console.log('📊 데이터베이스 연결 풀이 종료되었습니다.');
            }
        } catch (error) {
            console.error('❌ 데이터베이스 종료 실패:', error);
        }
    }
}

// 싱글톤 인스턴스
const database = new Database();

module.exports = database;