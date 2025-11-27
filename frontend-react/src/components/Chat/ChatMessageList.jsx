// frontend-react/src/components/Chat/ChatMessageList.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
// 1. useChat 훅을 import 합니다.
import { useChat } from '../../contexts/ChatContext';


// 2. props를 받지 않도록 수정합니다.
//function ChatMessageList({ messages, activeAgent, messagesEndRef, handleRecommendationClick }) {
function ChatMessageList() {
  // 3. useChat() 훅을 사용하여 필요한 값들을 직접 가져옵니다.
  const { messages, activeAgent, messagesEndRef, handleRecommendationClick } = useChat();

  return (
    <div id="chat-messages" className="chat-messages">
      {messages.length === 0 && (
        <>
          <p className="greeting">
            현재 선택된 에이전트: <strong id="current-agent-name">{activeAgent.name}</strong><br/>
            대화를 시작하거나, 좌측에서 다른 에이전트 모드를 선택해주세요.
          </p>
          <div className="recommendation-cards">
            <h4>이런 대화를 많이 했어요</h4>
            <div className="card-grid">
              {activeAgent.recommendations &&
                activeAgent.recommendations.map((text, index) => (
                  <div key={index}
                    className="card"
                    onClick={() => handleRecommendationClick(text)}
                  >
                    {text}
                  </div>
               ))}    
            </div>
          </div>
        </>
      )}
      {messages.map((msg, index) => (
        <div 
            key={index} 
            className={`chat-bubble ${msg.type}-bubble ${msg.isLoading || msg.isStreaming ? 'loading-bubble' : ''}`}
            // [수정] contentType이 'html'일 때만 이 속성을 설정하고, 아닐 때는 undefined로 설정하여 속성 자체를 제거합니다.
            dangerouslySetInnerHTML={msg.contentType === 'html' ? { __html: msg.content } : undefined}
        >
            {/* [수정] contentType이 'text'일 때만 내용을 렌더링하고, 'html'일 때는 명시적으로 null을 반환하여 children이 없음을 보장합니다. */}
            {msg.contentType === 'text' ? (
              msg.isLoading ? (
                <div className="loading-content">
                  <div className="spinner"></div>
                    {/* <span>{msg.content}</span> */}
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )
            ) : null}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatMessageList;