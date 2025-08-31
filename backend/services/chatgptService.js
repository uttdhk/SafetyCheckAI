const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class ChatGPTService {
    constructor() {
        if (!config.openai.apiKey) {
            console.warn('⚠️  OpenAI API 키가 설정되지 않았습니다. 데모 모드로 실행됩니다.');
            this.client = null;
            this.demoMode = true;
        } else {
            this.client = new OpenAI({
                apiKey: config.openai.apiKey
            });
            this.demoMode = false;
        }
    }

    async analyzeImage(imagePath, prompt, itemName = '안전 점검') {
        try {
            if (this.demoMode) {
                return this.getDemoAnalysis(itemName);
            }

            // 이미지 파일을 base64로 인코딩
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = this.getMimeType(imagePath);

            const response = await this.client.chat.completions.create({
                model: config.openai.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ],
                max_tokens: config.openai.maxTokens,
                temperature: config.openai.temperature
            });

            const analysis = response.choices[0].message.content;
            
            // 분석 결과 파싱
            return this.parseAnalysis(analysis, itemName);

        } catch (error) {
            console.error('❌ ChatGPT 이미지 분석 실패:', error);
            
            // 오류 발생 시 기본 분석 결과 반환
            return {
                complianceScore: 50,
                issuesFound: ['이미지 분석 중 오류가 발생했습니다.'],
                recommendations: ['이미지를 다시 업로드하거나 관리자에게 문의해주세요.'],
                aiAnalysis: `분석 오류: ${error.message}`,
                analysisTime: new Date().toISOString()
            };
        }
    }

    parseAnalysis(analysisText, itemName) {
        try {
            // 점수 추출 (0-100)
            const scoreMatch = analysisText.match(/점수[:\s]*(\d+)/i) || 
                             analysisText.match(/(\d+)점/i) ||
                             analysisText.match(/score[:\s]*(\d+)/i);
            const complianceScore = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 75;

            // 문제점 추출
            const issuesSection = this.extractSection(analysisText, ['문제점', '문제', 'issues', '위험']);
            const issuesFound = this.parseListItems(issuesSection);

            // 권고사항 추출
            const recommendationsSection = this.extractSection(analysisText, ['권고', '개선', '조치', 'recommendations', '방안']);
            const recommendations = this.parseListItems(recommendationsSection);

            return {
                complianceScore,
                issuesFound: issuesFound.length > 0 ? issuesFound : ['특별한 문제점이 발견되지 않았습니다.'],
                recommendations: recommendations.length > 0 ? recommendations : ['현재 상태를 유지하시기 바랍니다.'],
                aiAnalysis: analysisText,
                analysisTime: new Date().toISOString(),
                itemAnalyzed: itemName
            };

        } catch (error) {
            console.error('❌ 분석 결과 파싱 실패:', error);
            return {
                complianceScore: 70,
                issuesFound: ['분석 결과 처리 중 오류가 발생했습니다.'],
                recommendations: ['수동으로 점검해주세요.'],
                aiAnalysis: analysisText,
                analysisTime: new Date().toISOString(),
                itemAnalyzed: itemName
            };
        }
    }

    extractSection(text, keywords) {
        for (const keyword of keywords) {
            const regex = new RegExp(`${keyword}[:\\s]*(.*?)(?=\\n\\n|\\n[가-힣A-Za-z]+:|$)`, 'is');
            const match = text.match(regex);
            if (match) return match[1].trim();
        }
        return '';
    }

    parseListItems(text) {
        if (!text) return [];
        
        // 다양한 리스트 형태 파싱
        const items = [];
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            const trimmed = line.trim();
            // 불릿 포인트나 숫자로 시작하는 항목들
            if (/^[-*•·\d]+[\.\)\s]/.test(trimmed)) {
                const item = trimmed.replace(/^[-*•·\d]+[\.\)\s]*/, '').trim();
                if (item.length > 0) items.push(item);
            } else if (trimmed.length > 0 && !trimmed.includes(':')) {
                items.push(trimmed);
            }
        }
        
        return items.length > 0 ? items : [text.trim()];
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    getDemoAnalysis(itemName) {
        const demoAnalyses = {
            '개인보호구 착용': {
                complianceScore: 85,
                issuesFound: [
                    '일부 작업자의 안전모 미착용',
                    '보호 장갑 착용률 개선 필요'
                ],
                recommendations: [
                    '모든 작업자의 안전모 착용 의무화',
                    '정기적인 보호구 점검 실시',
                    '안전교육 강화 필요'
                ]
            },
            '작업 환경 안전성': {
                complianceScore: 78,
                issuesFound: [
                    '통로에 장애물 발견',
                    '비상구 표시 불명확'
                ],
                recommendations: [
                    '작업 구역 정리정돈 실시',
                    '비상구 표시 개선',
                    '정기적인 환경 점검 필요'
                ]
            },
            '장비 및 도구 상태': {
                complianceScore: 92,
                issuesFound: [
                    '일부 도구의 정기 점검 스티커 만료'
                ],
                recommendations: [
                    '정기 점검 일정 관리 개선',
                    '도구 상태 모니터링 강화'
                ]
            }
        };

        const defaultAnalysis = {
            complianceScore: 80,
            issuesFound: [
                '전반적으로 양호한 상태',
                '경미한 개선사항 존재'
            ],
            recommendations: [
                '현재 상태 유지',
                '정기적인 점검 지속',
                '안전 의식 향상 교육'
            ]
        };

        const analysis = demoAnalyses[itemName] || defaultAnalysis;
        
        return {
            ...analysis,
            aiAnalysis: `[데모 모드] ${itemName} 분석 결과:\n\n점수: ${analysis.complianceScore}점\n\n문제점:\n${analysis.issuesFound.map(item => `- ${item}`).join('\n')}\n\n권고사항:\n${analysis.recommendations.map(item => `- ${item}`).join('\n')}`,
            analysisTime: new Date().toISOString(),
            itemAnalyzed: itemName,
            demoMode: true
        };
    }

    async batchAnalyzeImages(imageAnalyses) {
        const results = [];
        
        for (const analysis of imageAnalyses) {
            try {
                console.log(`🔍 분석 중: ${analysis.itemName}`);
                
                const result = await this.analyzeImage(
                    analysis.imagePath,
                    analysis.prompt,
                    analysis.itemName
                );
                
                results.push({
                    itemId: analysis.itemId,
                    itemName: analysis.itemName,
                    imagePath: analysis.imagePath,
                    ...result
                });
                
                // API 호출 간격 조정 (Rate Limit 방지)
                if (!this.demoMode) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`❌ ${analysis.itemName} 분석 실패:`, error);
                results.push({
                    itemId: analysis.itemId,
                    itemName: analysis.itemName,
                    imagePath: analysis.imagePath,
                    complianceScore: 50,
                    issuesFound: [`${analysis.itemName} 분석 중 오류 발생`],
                    recommendations: ['수동 점검 필요'],
                    aiAnalysis: `분석 오류: ${error.message}`,
                    analysisTime: new Date().toISOString()
                });
            }
        }
        
        return results;
    }
}

module.exports = new ChatGPTService();