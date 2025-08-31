import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 페이지 컴포넌트
import HomePage from './pages/HomePage';
import InspectionPage from './pages/InspectionPage';
import ResultsPage from './pages/ResultsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

// 공통 컴포넌트
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import Toast from './components/Toast';

// 서비스
import { authService } from './services/authService';

// 훅
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';

// 테마 설정
const theme = {
  colors: {
    primary: '#1976d2',
    primaryDark: '#115293',
    primaryLight: '#42a5f5',
    secondary: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#bdbdbd'
    },
    border: '#e0e0e0',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1200px'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  borderRadius: '8px',
  transition: '0.3s ease',
  shadows: {
    light: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
    heavy: '0 8px 16px rgba(0, 0, 0, 0.2)'
  }
};

// 글로벌 스타일
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: ${props => props.theme.colors.text.primary};
    background-color: ${props => props.theme.colors.background};
    overflow-x: hidden;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  .react-query-devtools-panel {
    z-index: 9999 !important;
  }
`;

// 스타일 컴포넌트
const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: ${props => props.sidebarOpen ? '280px' : '0px'};
  transition: margin-left ${props => props.theme.transition};

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    margin-left: 0;
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: ${props => props.theme.spacing.lg};
  overflow-y: auto;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.md};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${props => props.theme.colors.surface};
`;

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분
    },
    mutations: {
      retry: 1,
    }
  }
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user, login, logout, isAuthenticated } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    // 앱 초기화
    const initializeApp = async () => {
      try {
        // 저장된 토큰으로 자동 로그인 시도
        const token = localStorage.getItem('authToken');
        if (token) {
          await authService.verifyToken();
        }
      } catch (error) {
        console.error('자동 로그인 실패:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // 반응형 사이드바 처리
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <LoadingContainer>
          <LoadingSpinner size="large" />
        </LoadingContainer>
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <Router>
          <AppContainer>
            {isAuthenticated ? (
              <>
                <Sidebar 
                  open={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  user={user}
                  onLogout={logout}
                />
                
                <ContentContainer sidebarOpen={sidebarOpen}>
                  <Header 
                    onMenuClick={toggleSidebar}
                    user={user}
                    onLogout={logout}
                  />
                  
                  <MainContent>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/inspection" element={<InspectionPage />} />
                      <Route path="/results" element={<ResultsPage />} />
                      <Route path="/results/:inspectionId" element={<ResultsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </MainContent>
                </ContentContainer>
              </>
            ) : (
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    <LoginPage 
                      onLogin={login} 
                      onError={(message) => addToast(message, 'error')}
                    />
                  } 
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            )}

            {/* 토스트 알림 */}
            {toasts.map(toast => (
              <Toast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
              />
            ))}
          </AppContainer>
        </Router>
        
        {/* React Query 개발 도구 */}
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;