import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// 컴포넌트
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';

// 서비스
import { inspectionService } from '../services/inspectionService';

// 아이콘 (간단한 SVG 아이콘)
const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const InspectionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

const ResultsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
  </svg>
);

// 스타일 컴포넌트
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeSection = styled.section`
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const WelcomeCard = styled(Card)`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.primaryDark} 100%);
  color: white;
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    font-size: 2rem;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    font-size: 1rem;
  }
`;

const StatsSection = styled.section`
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.text.primary};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const QuickActionsSection = styled.section`
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const ActionCard = styled(Card)`
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  transition: all ${props => props.theme.transition};
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.heavy};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ActionIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto ${props => props.theme.spacing.md};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.primaryLight});
  border-radius: 50%;
  color: white;
  font-size: 24px;
`;

const ActionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
`;

const ActionDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.5;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const ErrorMessage = styled.div`
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.error}10;
  color: ${props => props.theme.colors.error};
  border-radius: ${props => props.theme.borderRadius};
  text-align: center;
`;

function HomePage() {
  const navigate = useNavigate();

  // 통계 데이터 조회
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['inspection-stats'],
    queryFn: () => inspectionService.getStats(),
    refetchInterval: 30000, // 30초마다 갱신
  });

  const quickActions = [
    {
      id: 'new-inspection',
      title: '새 안전 점검 시작',
      description: '현장 사진을 업로드하고 AI 기반 안전 점검을 시작하세요',
      icon: <InspectionIcon />,
      action: () => navigate('/inspection')
    },
    {
      id: 'view-results',
      title: '점검 결과 보기',
      description: '과거 점검 결과와 통계를 확인하고 분석하세요',
      icon: <ResultsIcon />,
      action: () => navigate('/results')
    },
    {
      id: 'settings',
      title: '점검 항목 설정',
      description: '맞춤형 점검 항목과 AI 분석 프롬프트를 관리하세요',
      icon: <SettingsIcon />,
      action: () => navigate('/settings')
    }
  ];

  return (
    <Container>
      {/* 환영 섹션 */}
      <WelcomeSection>
        <WelcomeCard>
          <WelcomeTitle>🏗️ 산업안전 점검 시스템</WelcomeTitle>
          <WelcomeSubtitle>
            AI 기반 스마트 안전 점검으로 현장의 안전을 지키세요
          </WelcomeSubtitle>
          <Button 
            variant="outline" 
            size="large"
            onClick={() => navigate('/inspection')}
            style={{ color: 'white', borderColor: 'white' }}
          >
            지금 점검 시작하기
          </Button>
        </WelcomeCard>
      </WelcomeSection>

      {/* 통계 섹션 */}
      <StatsSection>
        <SectionTitle>📊 최근 30일 통계</SectionTitle>
        {isLoading ? (
          <LoadingContainer>
            <LoadingSpinner />
          </LoadingContainer>
        ) : error ? (
          <ErrorMessage>
            통계 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
          </ErrorMessage>
        ) : stats && (
          <StatsGrid>
            <StatCard
              title="총 점검 횟수"
              value={stats.totalInspections || 0}
              icon="📋"
              color={props => props.theme.colors.primary}
            />
            <StatCard
              title="평균 안전 점수"
              value={`${stats.averageScore || 0}점`}
              icon="⭐"
              color={props => props.theme.colors.success}
            />
            <StatCard
              title="완료된 점검"
              value={stats.completedInspections || 0}
              icon="✅"
              color={props => props.theme.colors.info}
            />
            <StatCard
              title="진행 중인 점검"
              value={stats.inProgressInspections || 0}
              icon="🔄"
              color={props => props.theme.colors.warning}
            />
          </StatsGrid>
        )}
      </StatsSection>

      {/* 빠른 실행 섹션 */}
      <QuickActionsSection>
        <SectionTitle>🚀 빠른 실행</SectionTitle>
        <ActionsGrid>
          {quickActions.map(action => (
            <ActionCard key={action.id} onClick={action.action}>
              <ActionIcon>
                {action.icon}
              </ActionIcon>
              <ActionTitle>{action.title}</ActionTitle>
              <ActionDescription>{action.description}</ActionDescription>
            </ActionCard>
          ))}
        </ActionsGrid>
      </QuickActionsSection>
    </Container>
  );
}

export default HomePage;