-- 산업안전 점검 시스템 샘플 데이터 삽입 스크립트

-- 기본 점검 항목 삽입
INSERT INTO INSPECTION_ITEMS (ID, NAME, PROMPT, CATEGORY, IS_ACTIVE, CREATED_AT) VALUES (
    'item-ppe-001',
    '개인보호구 착용 점검',
    '다음 산업 현장 이미지를 분석하여 개인보호구(PPE) 착용 상태를 평가해주세요:

1. 안전모 착용 상태 및 올바른 착용 여부
2. 보호안경 착용 상태
3. 작업용 장갑 착용 상태
4. 안전화 착용 상태
5. 안전복/조끼 착용 상태
6. 기타 작업별 필수 보호구

다음 형식으로 응답해주세요:
- 준수 점수: 0-100점
- 발견된 문제점: 구체적으로 나열
- 개선 권고사항: 실행 가능한 방안 제시',
    'PPE',
    1,
    CURRENT_TIMESTAMP
);

INSERT INTO INSPECTION_ITEMS (ID, NAME, PROMPT, CATEGORY, IS_ACTIVE, CREATED_AT) VALUES (
    'item-env-001',
    '작업 환경 안전성 점검',
    '다음 작업 환경 이미지를 분석하여 안전성을 평가해주세요:

1. 통로 및 비상구 확보 상태
2. 조명 및 가시성 적정성
3. 바닥 상태 (미끄럼, 장애물, 오염 등)
4. 화재 안전 시설 (소화기, 스프링클러 등)
5. 환기 및 공기 질 상태
6. 정리정돈 상태 (5S 활동)
7. 작업 공간의 충분성

응답 형식:
- 환경 안전 점수: 0-100점
- 위험 요소: 구체적 위치 및 내용
- 개선 방안: 우선순위별 조치사항',
    'ENVIRONMENT',
    1,
    CURRENT_TIMESTAMP
);

INSERT INTO INSPECTION_ITEMS (ID, NAME, PROMPT, CATEGORY, IS_ACTIVE, CREATED_AT) VALUES (
    'item-equip-001',
    '장비 및 도구 안전 상태 점검',
    '다음 장비/도구 이미지를 분석하여 안전 상태를 평가해주세요:

1. 장비의 물리적 상태 (손상, 마모, 부식 등)
2. 안전 장치 작동 여부 및 상태
3. 정기 점검 스티커 및 표시 확인
4. 보호 커버 및 가드 설치 상태
5. 전기 안전 (접지, 절연, 배선 등)
6. 유지보수 상태 및 청결도
7. 작업 도구의 적정 보관

응답 형식:
- 안전 점수: 0-100점
- 문제점: 세부 내용
- 권고사항: 즉시/단기/장기 조치사항',
    'EQUIPMENT',
    1,
    CURRENT_TIMESTAMP
);

INSERT INTO INSPECTION_ITEMS (ID, NAME, PROMPT, CATEGORY, IS_ACTIVE, CREATED_AT) VALUES (
    'item-sign-001',
    '안전 표지판 및 경고 표시 점검',
    '다음 이미지에서 안전 표지판 및 경고 표시를 분석해주세요:

1. 안전 표지판의 가시성 및 적절한 위치 설치
2. 경고 표시의 명확성 및 이해하기 쉬운 디자인
3. 비상 상황 안내 표시의 적정성
4. 금지 및 주의 표시의 효과성
5. 안전 구역 및 위험 구역 표시
6. 표지판의 물리적 상태 (손상, 오염 등)
7. 다국어 표시 필요성

응답 형식:
- 표시 완성도: 0-100점
- 부족한 표시: 구체적으로 나열
- 개선 권고: 추가 또는 교체 필요 표시',
    'SIGNAGE',
    1,
    CURRENT_TIMESTAMP
);

INSERT INTO INSPECTION_ITEMS (ID, NAME, PROMPT, CATEGORY, IS_ACTIVE, CREATED_AT) VALUES (
    'item-fire-001',
    '화재 안전 시설 점검',
    '다음 이미지에서 화재 안전 시설을 분석해주세요:

1. 소화기 설치 위치 및 접근성
2. 소화기 상태 점검 (압력, 유효기간 등)
3. 비상구 표시 및 접근 경로의 확보
4. 화재 감지기 설치 상태
5. 스프링클러 시설 점검
6. 화재 대피 경로 표시 및 안내
7. 가연성 물질 저장 및 관리 상태

응답 형식:
- 화재 안전 점수: 0-100점
- 문제점: 세부 내용
- 권고사항: 즉시 조치 필요 사항',
    'FIRE_SAFETY',
    1,
    CURRENT_TIMESTAMP
);

INSERT INTO INSPECTION_ITEMS (ID, NAME, PROMPT, CATEGORY, IS_ACTIVE, CREATED_AT) VALUES (
    'item-elec-001',
    '전기 안전 점검',
    '다음 이미지에서 전기 안전 상태를 분석해주세요:

1. 전기 패널 및 배전함 상태
2. 전기 배선의 안전성 (노출, 손상 등)
3. 접지 상태 및 누전차단기 설치
4. 전기 기기의 절연 상태
5. 임시 전원 사용 및 연장선 관리
6. 전기 작업 시 안전 조치
7. 전기실 및 전기 설비 주변 정리상태

응답 형식:
- 전기 안전 점수: 0-100점
- 위험 요소: 긴급 조치 필요 사항
- 개선 방안: 단계별 조치 계획',
    'ELECTRICAL',
    1,
    CURRENT_TIMESTAMP
);

-- 시스템 기본 설정 삽입
INSERT INTO SYSTEM_SETTINGS (ID, SETTING_KEY, SETTING_VALUE, SETTING_TYPE, DESCRIPTION, IS_ACTIVE) VALUES (
    'sys-001', 'MAX_FILE_SIZE', '10485760', 'NUMBER', '최대 파일 업로드 크기 (바이트)', 1
);

INSERT INTO SYSTEM_SETTINGS (ID, SETTING_KEY, SETTING_VALUE, SETTING_TYPE, DESCRIPTION, IS_ACTIVE) VALUES (
    'sys-002', 'MAX_FILES_PER_INSPECTION', '10', 'NUMBER', '검사당 최대 업로드 파일 수', 1
);

INSERT INTO SYSTEM_SETTINGS (ID, SETTING_KEY, SETTING_VALUE, SETTING_TYPE, DESCRIPTION, IS_ACTIVE) VALUES (
    'sys-003', 'ALLOWED_FILE_TYPES', '["image/jpeg", "image/jpg", "image/png", "image/webp"]', 'JSON', '허용되는 파일 타입 목록', 1
);

INSERT INTO SYSTEM_SETTINGS (ID, SETTING_KEY, SETTING_VALUE, SETTING_TYPE, DESCRIPTION, IS_ACTIVE) VALUES (
    'sys-004', 'AI_ANALYSIS_TIMEOUT', '30000', 'NUMBER', 'AI 분석 타임아웃 (밀리초)', 1
);

INSERT INTO SYSTEM_SETTINGS (ID, SETTING_KEY, SETTING_VALUE, SETTING_TYPE, DESCRIPTION, IS_ACTIVE) VALUES (
    'sys-005', 'COMPANY_NAME', '산업안전 점검 시스템', 'STRING', '회사/시스템 이름', 1
);

INSERT INTO SYSTEM_SETTINGS (ID, SETTING_KEY, SETTING_VALUE, SETTING_TYPE, DESCRIPTION, IS_ACTIVE) VALUES (
    'sys-006', 'DEFAULT_LANGUAGE', 'ko', 'STRING', '기본 언어 설정', 1
);

INSERT INTO SYSTEM_SETTINGS (ID, SETTING_KEY, SETTING_VALUE, SETTING_TYPE, DESCRIPTION, IS_ACTIVE) VALUES (
    'sys-007', 'ENABLE_EMAIL_NOTIFICATIONS', 'true', 'BOOLEAN', '이메일 알림 활성화', 1
);

-- 샘플 사용자 데이터 (테스트용)
INSERT INTO USERS (ID, USERNAME, EMAIL, PASSWORD_HASH, FULL_NAME, ROLE, IS_ACTIVE) VALUES (
    'user-admin-001',
    'admin',
    'admin@safety.com',
    '$2b$10$rQkMLvKW8m8EYuS4r5lzuO9kFvVqPQZhKT2mKG8YQKqQh5lzuO9kF', -- 'admin123'
    '시스템 관리자',
    'ADMIN',
    1
);

INSERT INTO USERS (ID, USERNAME, EMAIL, PASSWORD_HASH, FULL_NAME, ROLE, IS_ACTIVE) VALUES (
    'user-inspector-001',
    'inspector',
    'inspector@safety.com',
    '$2b$10$rQkMLvKW8m8EYuS4r5lzuO9kFvVqPQZhKT2mKG8YQKqQh5lzuO9kF', -- 'admin123'
    '안전 점검관',
    'USER',
    1
);

-- 샘플 검사 데이터 (데모용)
INSERT INTO INSPECTIONS (ID, USER_NAME, LOCATION, INSPECTION_DATE, TOTAL_ITEMS, COMPLETED_ITEMS, OVERALL_SCORE, STATUS) VALUES (
    'insp-sample-001',
    '김안전',
    '제1공장 생산라인 A',
    SYSDATE - 7,
    5,
    5,
    85,
    'COMPLETED'
);

INSERT INTO INSPECTIONS (ID, USER_NAME, LOCATION, INSPECTION_DATE, TOTAL_ITEMS, COMPLETED_ITEMS, OVERALL_SCORE, STATUS) VALUES (
    'insp-sample-002',
    '박점검',
    '제2공장 조립라인 B',
    SYSDATE - 3,
    4,
    4,
    78,
    'COMPLETED'
);

INSERT INTO INSPECTIONS (ID, USER_NAME, LOCATION, INSPECTION_DATE, TOTAL_ITEMS, COMPLETED_ITEMS, OVERALL_SCORE, STATUS) VALUES (
    'insp-sample-003',
    '이안전',
    '창고 및 보관시설',
    SYSDATE - 1,
    6,
    6,
    92,
    'COMPLETED'
);

-- 샘플 검사 결과 데이터
INSERT INTO INSPECTION_RESULTS (ID, INSPECTION_ID, ITEM_ID, IMAGE_PATH, AI_ANALYSIS, COMPLIANCE_SCORE, ISSUES_FOUND, RECOMMENDATIONS) VALUES (
    'result-001',
    'insp-sample-001',
    'item-ppe-001',
    '/uploads/sample-ppe-001.jpg',
    '[데모 데이터] 개인보호구 착용 상태 분석 결과: 전반적으로 양호한 상태이나 일부 개선사항이 발견되었습니다.',
    85,
    '["일부 작업자의 안전모 미착용", "보호 장갑 착용률 개선 필요"]',
    '["모든 작업자의 안전모 착용 의무화", "정기적인 보호구 점검 실시", "안전교육 강화 필요"]'
);

INSERT INTO INSPECTION_RESULTS (ID, INSPECTION_ID, ITEM_ID, IMAGE_PATH, AI_ANALYSIS, COMPLIANCE_SCORE, ISSUES_FOUND, RECOMMENDATIONS) VALUES (
    'result-002',
    'insp-sample-002',
    'item-env-001',
    '/uploads/sample-env-001.jpg',
    '[데모 데이터] 작업 환경 안전성 분석 결과: 대부분의 안전 기준을 준수하고 있으나 정리정돈 측면에서 개선이 필요합니다.',
    78,
    '["통로에 임시 저장된 자재", "비상구 주변 정리 미흡", "바닥 청결 상태 개선 필요"]',
    '["작업 구역 정리정돈 실시", "비상구 접근로 확보", "정기적인 환경 점검 시행"]'
);

INSERT INTO INSPECTION_RESULTS (ID, INSPECTION_ID, ITEM_ID, IMAGE_PATH, AI_ANALYSIS, COMPLIANCE_SCORE, ISSUES_FOUND, RECOMMENDATIONS) VALUES (
    'result-003',
    'insp-sample-003',
    'item-fire-001',
    '/uploads/sample-fire-001.jpg',
    '[데모 데이터] 화재 안전 시설 분석 결과: 우수한 화재 안전 시설 관리 상태를 보여주고 있습니다.',
    92,
    '["소화기 점검 스티커 일부 기한 만료"]',
    '["만료된 점검 스티커 교체", "정기적인 소화기 점검 일정 관리"]'
);

-- 데이터 삽입 완료 확인
COMMIT;

SELECT 'Sample data inserted successfully!' AS MESSAGE,
       (SELECT COUNT(*) FROM INSPECTION_ITEMS) AS ITEMS_COUNT,
       (SELECT COUNT(*) FROM USERS) AS USERS_COUNT,
       (SELECT COUNT(*) FROM INSPECTIONS) AS INSPECTIONS_COUNT,
       (SELECT COUNT(*) FROM INSPECTION_RESULTS) AS RESULTS_COUNT,
       (SELECT COUNT(*) FROM SYSTEM_SETTINGS) AS SETTINGS_COUNT
FROM DUAL;