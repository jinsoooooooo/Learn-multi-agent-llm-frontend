// frontend-react/src/components/Chat/ChatMainArea.jsx

import React from 'react';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import KeywordInputArea from '../Inputs/KeywordInputArea';
import ChatInputArea from '../Inputs/ChatInputArea';
// import ModelSelector from '../Inputs/ModelSelector';

function ChatMainArea() {
  return (
    <main className="content-area">
      <ChatHeader />
      <div className="chat-container">
        <ChatMessageList />
        
        {/* <ModelSelector /> */}
        <KeywordInputArea />
        <ChatInputArea />
      </div>
    </main>
  );
}

export default ChatMainArea;