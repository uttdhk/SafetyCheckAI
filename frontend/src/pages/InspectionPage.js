import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';

// 컴포넌트
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import FileUpload from '../components/FileUpload';
import InspectionProgress from '../components/InspectionProgress';
import ItemSelector from '../components/ItemSelector';
import LoadingSpinner from '../components/LoadingSpinner';

// 서비스
import { inspectionService } from '../services/inspectionService';
import { uploadService } from '../services/uploadService';
import { itemService } from '../services/itemService';

// 훅
import { useToast } from '../hooks/useToast';

// 스타일 컴포넌트
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const StepContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StepNumber = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  color: ${props => props.active ? 'white' : props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: ${props => props.theme.spacing.md};
`;

const StepTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${props => props.theme.spacing.xl};
  padding-top: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
  }
`;

const SelectedItemsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SelectedItemCard = styled(Card)`
  padding: ${props => props.theme.spacing.md};
  position: relative;
`;

const ItemName = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
`;

const ItemCategory = styled.span`
  display: inline-block;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius};
  font-size: 0.75rem;
  font-weight: 500;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.sm};
  right: ${props => props.theme.spacing.sm};
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.error};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  
  &:hover {
    background-color: ${props => props.theme.colors.error}dd;
  }
`;

const ImagePreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ImageCard = styled.div`
  position: relative;
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.light};
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
`;

const ImageInfo = styled.div`
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.surface};
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
`;

function InspectionPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    userName: '',
    location: ''
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({
    currentItem: '',
    completedItems: 0,
    totalItems: 0,
    progress: 0
  });

  // 점검 항목 조회
  const { data: inspectionItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['inspection-items'],
    queryFn: () => itemService.getItems()
  });

  // 검사 생성 및 분석 뮤테이션
  const createInspectionMutation = useMutation({
    mutationFn: inspectionService.createInspection,
    onSuccess: (data) => {
      startAnalysis(data.inspection.id);
    },
    onError: (error) => {
      addToast('검사 생성 실패: ' + error.message, 'error');
    }
  });

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (files) => {
    try {
      const uploadPromises = Array.from(files).map(file => 
        uploadService.uploadSingle(file)
      );
      
      const results = await Promise.all(uploadPromises);
      const newFiles = results.map(result => result.file);
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      addToast(`${newFiles.length}개 파일이 업로드되었습니다.`, 'success');
    } catch (error) {
      addToast('파일 업로드 실패: ' + error.message, 'error');
    }
  }, [addToast]);

  // 파일 삭제
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // 점검 항목 선택
  const handleItemSelect = (item) => {
    if (!selectedItems.find(selected => selected.id === item.id)) {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  // 점검 항목 제거
  const removeSelectedItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // 검사 시작
  const startInspection = () => {
    if (!formData.userName || !formData.location) {
      addToast('사용자명과 위치를 입력해주세요.', 'error');
      return;
    }

    if (selectedItems.length === 0) {
      addToast('최소 하나의 점검 항목을 선택해주세요.', 'error');
      return;
    }

    if (uploadedFiles.length === 0) {
      addToast('최소 하나의 이미지를 업로드해주세요.', 'error');
      return;
    }

    createInspectionMutation.mutate({
      userName: formData.userName,
      location: formData.location,
      inspectionItems: selectedItems.map(item => ({
        id: item.id,
        name: item.name
      }))
    });
  };

  // AI 분석 시작
  const startAnalysis = async (inspectionId) => {
    setIsAnalyzing(true);
    setAnalysisProgress({
      currentItem: '',
      completedItems: 0,
      totalItems: selectedItems.length,
      progress: 0
    });

    try {
      // 각 점검 항목에 대해 이미지 분석 요청 준비
      const imageAnalyses = selectedItems.map((item, index) => ({
        itemId: item.id,
        itemName: item.name,
        imagePath: uploadedFiles[index % uploadedFiles.length].path, // 이미지 순환 사용
        prompt: item.prompt
      }));

      // 실시간 분석 시작
      const response = await fetch(`/api/inspection/${inspectionId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ imageAnalyses })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'progress') {
              setAnalysisProgress({
                currentItem: data.currentItem,
                completedItems: data.completedItems,
                totalItems: data.totalItems,
                progress: data.progress
              });
            } else if (data.type === 'complete') {
              // 분석 완료
              addToast('AI 분석이 완료되었습니다!', 'success');
              navigate(`/results/${inspectionId}`);
              return;
            }
          } catch (e) {
            console.log('JSON 파싱 오류 (무시):', e);
          }
        }
      }

    } catch (error) {
      addToast('AI 분석 중 오류가 발생했습니다: ' + error.message, 'error');
      setIsAnalyzing(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isAnalyzing) {
    return (
      <Container>
        <InspectionProgress
          currentItem={analysisProgress.currentItem}
          completedItems={analysisProgress.completedItems}
          totalItems={analysisProgress.totalItems}
          progress={analysisProgress.progress}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🔍 새 안전 점검 시작</Title>
        <Subtitle>AI 기반 스마트 안전 점검을 시작하세요</Subtitle>
      </Header>

      {/* Step 1: 기본 정보 입력 */}
      <StepContainer>
        <StepHeader>
          <StepNumber active={currentStep >= 1}>1</StepNumber>
          <StepTitle>기본 정보 입력</StepTitle>
        </StepHeader>
        
        {currentStep >= 1 && (
          <Card>
            <FormGrid>
              <Input
                label="사용자명"
                placeholder="점검자 이름을 입력하세요"
                value={formData.userName}
                onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                required
              />
              <Input
                label="점검 위치"
                placeholder="점검 장소를 입력하세요"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </FormGrid>
          </Card>
        )}
      </StepContainer>

      {/* Step 2: 점검 항목 선택 */}
      <StepContainer>
        <StepHeader>
          <StepNumber active={currentStep >= 2}>2</StepNumber>
          <StepTitle>점검 항목 선택</StepTitle>
        </StepHeader>
        
        {currentStep >= 2 && (
          <Card>
            {itemsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <ItemSelector
                  items={inspectionItems?.items || []}
                  selectedItems={selectedItems}
                  onSelect={handleItemSelect}
                />
                
                {selectedItems.length > 0 && (
                  <>
                    <h3 style={{ margin: '1.5rem 0 1rem 0' }}>선택된 점검 항목</h3>
                    <SelectedItemsContainer>
                      {selectedItems.map(item => (
                        <SelectedItemCard key={item.id}>
                          <RemoveButton onClick={() => removeSelectedItem(item.id)}>
                            ×
                          </RemoveButton>
                          <ItemName>{item.name}</ItemName>
                          <ItemCategory>{item.category}</ItemCategory>
                        </SelectedItemCard>
                      ))}
                    </SelectedItemsContainer>
                  </>
                )}
              </>
            )}
          </Card>
        )}
      </StepContainer>

      {/* Step 3: 이미지 업로드 */}
      <StepContainer>
        <StepHeader>
          <StepNumber active={currentStep >= 3}>3</StepNumber>
          <StepTitle>현장 이미지 업로드</StepTitle>
        </StepHeader>
        
        {currentStep >= 3 && (
          <Card>
            <FileUpload
              onFileUpload={handleFileUpload}
              maxFiles={10}
              accept="image/*"
              multiple
            />
            
            {uploadedFiles.length > 0 && (
              <>
                <h3 style={{ margin: '1.5rem 0 1rem 0' }}>업로드된 이미지</h3>
                <ImagePreview>
                  {uploadedFiles.map(file => (
                    <ImageCard key={file.id}>
                      <PreviewImage 
                        src={file.relativePath} 
                        alt={file.originalName}
                      />
                      <ImageInfo>
                        <div>{file.originalName}</div>
                        <div>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => removeFile(file.id)}
                          style={{ color: 'red', marginTop: '0.5rem' }}
                        >
                          삭제
                        </Button>
                      </ImageInfo>
                    </ImageCard>
                  ))}
                </ImagePreview>
              </>
            )}
          </Card>
        )}
      </StepContainer>

      {/* 액션 버튼 */}
      <ActionBar>
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          이전
        </Button>
        
        <div>
          {currentStep < 3 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && (!formData.userName || !formData.location)) ||
                (currentStep === 2 && selectedItems.length === 0)
              }
            >
              다음
            </Button>
          ) : (
            <Button
              variant="primary"
              size="large"
              onClick={startInspection}
              disabled={
                createInspectionMutation.isLoading ||
                uploadedFiles.length === 0 ||
                selectedItems.length === 0
              }
            >
              {createInspectionMutation.isLoading ? '시작 중...' : 'AI 분석 시작'}
            </Button>
          )}
        </div>
      </ActionBar>
    </Container>
  );
}

export default InspectionPage;