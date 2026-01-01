// frontend-react/src/components/Sidebar/Sidebar.jsx
import React from 'react';
import AgentMenu from './AgentMenu';
import UserProfile from './UserProfile';
import ModelSelector from '../Inputs/ModelSelector';

// 1. Sidebar 컴포넌트에서 모든 props를 제거합니다.
function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="logo">JINSOO.AI</div>
        <AgentMenu />
      </div>

      {/* --- 👇 [핵심] 이 div에 className을 추가합니다 --- */}
      <div className="sidebar-bottom">
        <ModelSelector />
        <UserProfile />
      </div>
    </aside>
  );
}

export default Sidebar;