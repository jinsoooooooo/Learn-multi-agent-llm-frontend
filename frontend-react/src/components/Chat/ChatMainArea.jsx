// frontend-react/src/components/Chat/ChatMainArea.jsx

import React from 'react';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import KeywordInputArea from '../Inputs/KeywordInputArea';
import ChatInputArea from '../Inputs/ChatInputArea';
// import ModelSelector from '../Inputs/ModelSelector';

// 1. ChatMainArea에서 모든 props를 제거합니다.
function ChatMainArea() {
  return (
    <main className="content-area">
      <ChatHeader />
      <div className="chat-container">
        {/* 2. 자식 컴포넌트들에게 더 이상 props를 전달하지 않습니다. */}
        <ChatMessageList />
        
        {/* <ModelSelector /> */}
        <KeywordInputArea />
        <ChatInputArea />
      </div>
    </main>
  );
}

export default ChatMainArea;