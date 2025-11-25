// frontend-react/src/components/Sidebar/UserProfile.jsx
import React from 'react';
// 1. useChat 훅을 import 합니다.
import { useChat } from '../../contexts/ChatContext';


// 2. props({ userId })를 제거합니다.
// function UserProfile({ userId }) {
function UserProfile() {
  // 3. 대신에 useChat() 훅을 사용하여 필요한 userId만 가져옵니다.
  const { userId , sessionId} = useChat();
  const isDevMode = import.meta.env.DEV;
  return (
    <div className="user-profile">
      <div className="avatar">임</div>
      <div className="user-info">
        {/* 이제 userId는 Context에서 직접 온 값입니다. */}
        <strong>{userId}</strong><br/>
        {/* 개발 모드이고 sessionId가 존재할 때만 이 div를 렌더링합니다. */}
        {isDevMode && sessionId && (
          <div className="session-id-display">
            {sessionId} 
          </div>
         )}  
      </div>
    </div>
  );
}

export default UserProfile;