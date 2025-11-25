import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import './ModelSelector.css';

function ModelSelector() {
  const { modelList, selectedModel, setSelectedModel } = useChat();

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };

  // 래퍼를 form으로 변경하고, 라벨과 아이콘 삭제
  return (
    <form className="model-selector-form">
      <div className="select-wrapper">
        <select 
          id="model-select"
          className="model-selector-select"
          value={selectedModel}
          onChange={handleModelChange}
          aria-label="AI 모델 선택" // 스크린 리더를 위한 접근성 라벨
        >
          {/* 모델이 로드되지 않았을 때를 위한 옵션 추가 */}
          {modelList.length === 0 && <option>모델 로딩 중...</option>}
          {modelList.map(modelName => (
            <option key={modelName} value={modelName}>
              {modelName}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}

export default ModelSelector;