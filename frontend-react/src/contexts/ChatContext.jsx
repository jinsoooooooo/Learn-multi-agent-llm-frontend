// frentend-react/src/contexts/ChatContext.jsx
import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import useChatStreamPost from '../hooks/useChatStreamPost';

// Context 생성 (이전 단계에서 완료)
const ChatContext = createContext();

// 헬퍼 함수 (App.jsx에서 그대로 가져옴)
// ... createNewsHtml, createChatText 함수 ...
function createNewsHtml(data) {
    if (!data.articles || data.articles.length === 0) {
      return `검색된 뉴스 기사가 없습니다.`;
    }
    let newsHtml = `<div class="news-container"><ul class="news-list">`;
    data.articles.forEach(article => {
      newsHtml += `
        <li class="news-item">
          <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="news-title-link">${article.title}</a>
          <p class="news-description">${article.description}</p>
        </li>
      `;
    });
    newsHtml += `</ul></div>`;
    return newsHtml;
}
function createChatText(data) {
    return data.reply || data.response || "응답이 없습니다.";
}


// Provider 컴포넌트
export function ChatProvider({ children }) {
  // 1. App.jsx의 모든 상태 로직을 이곳으로 이동 ========================
  const [agents, setAgents] = useState([
      { name: '채팅', apiPath: '/api/chat', mode: 'Chat', messages: [], 
        recommendations: ['오늘 날씨 알려줘', '요즘 인기 있는 영화 추천해줘', '재미있는 농담 해봐','곽튜브의 이름은?']
      },
      { name: '회의실', apiPath: '/api/meeting', mode: 'Chat', messages: [], 
        recommendations: ['회의실 예약 현황 알려줘','다음 주 월요일 10시 회의실 예약해줘', '가장 가까운 빈 회의실은?']
      },
      { name: '네이버뉴스', apiPath: '/api/naver_news', mode: 'Chat', messages: [],
        recommendations: ['최신 AI 기술','IT','취업시장','채용','추천']
        },
      // { name: '뉴스큐레이션', apiPath: '/api/news', mode: 'Chat', messages: [],
      //   recommendations: ['AI 관련 뉴스 3개', '경제 동향 요약','추천','추천','추천']
      //   },
      { name: 'Langchain채팅 (Redis)', apiPath: '/api/langchain/chat', mode: 'Chat', messages: [], 
        recommendations: ['곽튜브의 이름은?', '내 이름은?', '오늘 날시 알려줘','LangChain이 뭐야?','추천']
      },
      { name: 'Streaming 샘플', apiPath: '/api/test/stream', mode: 'Stream', method: 'POST', messages: [] , 
        recommendations: ['스트림', 'Event Stream', '1장,2장,3장','추천','추천']
      },
      // { name: 'LangchainStream', apiPath: '/api/langchain/chatstream', method: 'POST', mode: 'Stream', messages: [],
      //   recommendations: ['내 이름은 곽준빈이야', '내 이름은?','내 이름은 jin이야','조선시대 왕 이름은?']
      //   },
      { name: 'RAG+체이닝 스트리밍', apiPath: '/api/rag/chat/stream', method: 'POST', mode: 'Stream', messages: [],
        recommendations: ['이력서에서 프로젝트에 대해서 찾아서 요약 정리 해줘', '그룹웨어 관리자 메뉴얼은 어디있어?','추천']
        }  
  ]);
  const [activeAgent, setActiveAgent] = useState(agents[0]);
  const [userId, setUserId] = useState("react.user"); 
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [keywordInputs, setKeywordInputs] = useState(['', '', '']);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // ---- 모델 목록 및 선택된 모델 정의 추가 
  const [modelList, setModelList] = useState([]);         // 1. 전체 모델 목록을 담을 상태
  const [selectedModel, setSelectedModel] = useState(''); // 2. 현재 선택된 모델을 담을 상태
  const [chatId, setchatId] = useState(null); // 3. 현재 세션 ID를 담을 상태

  const { 
      streamData, 
      isStreaming, 
      error: streamError,
      startStreamAction 
  } = useChatStreamPost();

  // 2. App.jsx의 모든 useEffect 로직을 이곳으로 이동 =====================
  useEffect(() => {
      document.title = `Multi-Agent | ${activeAgent.name} ${isStreaming ? '| 스트리밍 중...' : ''}`;
  }, [activeAgent.name, isStreaming]);

  // (스트리밍, 에러, 스크롤 관련 나머지 useEffect들도 모두 )
  useEffect(() => {
      if (activeAgent.mode === 'Stream' && isStreaming && streamData) {
      // console.log('[debug] ','11111', activeAgent.mode , isStreaming, streamData , )
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.type === 'agent' && lastMessage.isStreaming) {
          return prevMessages.map((msg, index) => 
            index === prevMessages.length - 1 
              ? { ...msg, content: streamData } 
              : msg
          );
        } else if (streamData !== '') {
          return [...prevMessages, { type: 'agent', contentType: 'text', content: streamData, isStreaming: true }];
        }
        return prevMessages;
      });
    } else if (activeAgent.mode === 'Stream' && !isStreaming && streamData) {
      // console.log('[debug] ','22222', activeAgent.mode , isStreaming, streamData , )
        
      const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.isStreaming) {
          setMessages(prevMessages => prevMessages.map((msg, index) =>
            index === prevMessages.length - 1 ? { ...msg, isStreaming: false } : msg
          ));
        }
    } else {
      // console.log('[debug] ','33333', activeAgent.mode , isStreaming, streamData , )
      
    }
  }, [streamData, isStreaming, activeAgent.mode]);
  
  useEffect(() => {
    if (activeAgent.mode === 'Stream' && streamError) {
      setMessages(prevMessages => [...prevMessages, { type: 'agent', contentType: 'text', content: ` 스트리밍 오류: ${streamError.message}` }]);
    }
  }, [streamError, activeAgent.mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamData]);

  // 컴포넌트가 마운트될 때 모델 목록을 가져오는 useEffect
  useEffect( () => {
    const fetchModels = async () => {
      try {
        const fullPath = import.meta.env.VITE_API_URL + '/api/models';
        const response = await fetch(fullPath);

        if(!response.ok){
          throw new Error('모델 목록을 가져오는 데 실패했습니다.');
        }
        const data = await response.json();

        setModelList(data);         // 가져온 모델 목록을 상태에 저장
        setSelectedModel(data[2]);  // 첫 번째 모델을 기본 선택 모델로 설정

      } catch (e){
        console.error(e)
      }
    };

    fetchModels();
  }, [] ); // 의존성에 빈 배열을 전달하여 컴포넌트가 처음 마운트될 때 한 번만 실행되도록 합니다.





  // 3. App.jsx의 모든 핸들러 함수를 이곳으로 이동 ======================
  const handleSendMessage = async () => {
      // ... (handleSendMessage 함수의 모든 내용)
      if (chatMessageInput.trim() === '') return;
      if (isStreaming) {
        console.warn("App.jsx: 이미 스트리밍 중이므로 새 메시지 전송을 막습니다.");
        return;
      }
  
      const newUserMessage = { type: 'user', contentType: 'text', content: chatMessageInput };
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      
      const currentKeywords = keywordInputs.filter(kw => kw.trim() !== '');
      const messageToSend = chatMessageInput;
      setChatMessageInput('');
      setKeywordInputs(['', '', '']);
      
      // const fullApiPath = "http://127.0.0.1:8000" + activeAgent.apiPath;
      const fullApiPath = import.meta.env.VITE_API_URL + activeAgent.apiPath;
      console.log(`fullApiPath: ${fullApiPath}`);
      console.log(`[${activeAgent.name} 에이전트로 전송: ${messageToSend}`);
      
      if (activeAgent.mode === 'Chat') {
          const loadingMessage = { type: 'agent', contentType: 'text', content: '...생각 중...', isLoading: true };
          setMessages(prevMessages => [...prevMessages, loadingMessage]);
  
          try {
              const res = await fetch(fullApiPath, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    "user_id": userId, 
                    "message": messageToSend, 
                    "keywords": currentKeywords,
                    "model": selectedModel,     // <-- 선택된 모델 추가
                    "Chat_id": chatId   // <-- 현재 세션 ID 추가 (처음엔 null)
                  }),
              });
  
              if (!res.ok) {
                  const errorText = await res.text();
                  throw new Error(`서버 오류 발생: ${res.status} - ${errorText}`);
              }
  
              const data = await res.json(); 
              console.log('data:',data)
              // 현재 chatId가 없고, 응답으로 새 ID가 왔다면 상태를 업데이트합니다.
              if (!chatId && data.chat_id) {
                  setchatId(data.chat_id);
              } 
              
              setMessages(prevMessages => {
                  const updatedMessages = prevMessages.filter(msg => !msg.isLoading);
                  
                  let agentResponseContent = '';
                  let agentResponseContentType = 'text';
  
                  // if (activeAgent.name === '네이버뉴스' || activeAgent.name === '뉴스큐레이션') {
                  if (activeAgent.name === '뉴스큐레이션') {
                      agentResponseContent = createNewsHtml(data);
                      agentResponseContentType = 'html';
                  } else {
                      agentResponseContent = createChatText(data);
                  }
                  return [...updatedMessages, { type: 'agent', contentType: agentResponseContentType, content: agentResponseContent }];
              });
  
          } catch (err) {
              setMessages(prevMessages => {
                  const updatedMessages = prevMessages.filter(msg => !msg.isLoading);
                  return [...updatedMessages, { type: 'agent', contentType: 'text', content: ` 오류: ${err.message}` }];
              });
          }
      } else if (activeAgent.mode === 'Stream'){
        if (activeAgent.method === 'POST'){
          const body = {
              chat_id: chatId,    // 현재 채팅 ID, 처음에는 null
              user_id: userId,
              model: selectedModel,  // <-- 선택된 모델 추가
              message: messageToSend,
              keywords: keywordInputs.filter(kw => kw.trim() !== '')
          };
          console.log('body:', body)
          
          startStreamAction({
            apiUrl: fullApiPath,
            body: body,
            // onNewChatId 콜백: 훅 내부에서 chat_id를 받으면 이 함수가 실행됩니다.
            onNewChatId: (newChatId) => {
              // ChatContext의 chatId 상태를 업데이트합니다.
              setchatId(newChatId); 
              console.log("새로운 Chat ID를 Context에 저장했습니다:", newChatId);
            },
            // (선택) onDone 콜백: 스트림이 성공적으로 끝나면 실행됩니다.
            onDone: () => {
              console.log("Context: 스트림이 성공적으로 완료되었습니다.");
            },
            // (선택) onError 콜백: 스트림 중 에러가 발생하면 실행됩니다.
            onError: (err) => {
              console.error("Context: 스트림에서 에러가 발생했습니다:", err.message);
              // 에러 메시지를 화면에 표시할 수도 있습니다.
              setMessages(prev => [...prev, { type: 'agent', content: `오류: ${err.message}` }]);
            }
          });
      }
      }
  };

  const handleAgentChange = (agent) => {
      // ... (handleAgentChange 함수의 모든 내용)
      setAgents(prevAgents => prevAgents.map(a => 
          a.name === activeAgent.name ? { ...a, messages } : a
        ));
        setActiveAgent(agent);
        setMessages(agent.messages);
        setChatMessageInput('');
        setKeywordInputs(['SK하이닉스', '', '']);
        setchatId(null);
  };

  const handleKeywordInputChange = (index, value) => {
      // ... (handleKeywordInputChange 함수의 모든 내용)
      setKeywordInputs(prevKeywords => {
          const newKeywords = [...prevKeywords];
          newKeywords[index] = value;
          return newKeywords;
        });
  };

  const handleRecommendationClick = (recommendationText) => {
      // 이 함수는 chatMessageInput 상태를 변경하고 handleSendMessage를 호출해야 합니다.
      // 하지만 handleSendMessage는 chatMessageInput 상태를 참조하므로,
      // 상태 업데이트가 비동기적으로 일어나는 문제를 해결하기 위해 직접 메시지를 넘겨주는 방식으로 수정합니다.
      
      // 1. 입력창에 텍스트를 설정 (사용자 피드백용)
      setChatMessageInput(recommendationText);
      
      // 2. handleSendMessage를 즉시 호출하되, 방금 설정한 텍스트를 직접 사용하도록 함
      // (handleSendMessage 내부에서 chatMessageInput을 참조하기 때문에, 이 방식이 더 안정적입니다)
      // -> 이 부분은 handleSendMessage를 수정해야 더 깔끔해집니다. 우선 현재 구조를 유지.
      // -> 더 나은 방법: handleSendMessage가 인자를 받도록 수정하는 것. 다음 단계에서 리팩토링 제안 가능.
      
      // 임시 해결책: 상태를 업데이트하고, 다음 렌더링 사이클에서 함수가 실행되도록 함
      setTimeout(() => handleSendMessage(), 0); 
  };

  // 4. Provider를 통해 전달할 value 객체 =============================
  // 다른 컴포넌트에서 사용할 상태와 함수들을 모두 여기에 포함시킵니다.
  const value = {
      agents,
      activeAgent,
      userId,
      chatMessageInput,
      setChatMessageInput,
      keywordInputs,
      handleKeywordInputChange,
      messages,
      messagesEndRef,
      isStreaming,
      handleSendMessage,
      handleAgentChange,
      handleRecommendationClick,
      modelList,
      selectedModel,
      setSelectedModel,
      chatId // Chat_id를 다른 컴포넌트에서 쓸 수 있도록 추가

  };

  return (
      <ChatContext.Provider value={value}>
          {children}
      </ChatContext.Provider>
  );
}

// 커스텀 훅 (이전 단계에서 완료)
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}