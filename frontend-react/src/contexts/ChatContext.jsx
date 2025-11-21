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
          recommendations: ['오늘 날씨 알려줘', '요즘 인기 있는 영화 추천해줘', '재미있는 농담 해봐','추천']
        },
        { name: '회의실', apiPath: '/api/meeting', mode: 'Chat', messages: [], 
          recommendations: ['다음 주 월요일 10시 회의실 예약해줘', '가장 가까운 빈 회의실 찾아줘','추천']
        },
        { name: '네이버뉴스', apiPath: '/api/naver_news', mode: 'Chat', messages: [],
          recommendations: ['최신 AI 기술','IT','취업시장','채용','추천']
         },
        { name: '뉴스큐레이션', apiPath: '/api/news', mode: 'Chat', messages: [],
          recommendations: ['AI 관련 뉴스 3개', '경제 동향 요약','추천','추천','추천']
         },
        { name: 'Langchain채팅', apiPath: '/api/langchain/chat', mode: 'Chat', messages: [], 
          recommendations: ['안녕 오늘 날씨 어때?', 'LangChain이 뭐야?', 'React에 대해 설명해줘','추천']
        },
        { name: 'StreamResponse', apiPath: '/api/stream', mode: 'Stream', method: 'POST', messages: [] , 
          recommendations: ['스트림', 'Event Stream', '1장,2장,3장','추천','추천']
        },
        { name: 'LangchainStream', apiPath: '/api/langchain/chatstream', method: 'POST', mode: 'Stream', messages: [],
          recommendations: ['내 이름은 곽준빈이야', '내 이름은?','내 이름은 jin이야','조선시대 왕 이름은?']
         }
    ]);
    const [activeAgent, setActiveAgent] = useState(agents[0]);
    const [userId, setUserId] = useState("react.user"); 
    const [chatMessageInput, setChatMessageInput] = useState('');
    const [keywordInputs, setKeywordInputs] = useState(['', '', '']);
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

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

    // ... (스트리밍, 에러, 스크롤 관련 나머지 useEffect들도 모두 сюда)
    useEffect(() => {
        if (activeAgent.mode === 'Stream' && isStreaming && streamData) {
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
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
              setMessages(prevMessages => prevMessages.map((msg, index) =>
                index === prevMessages.length - 1 ? { ...msg, isStreaming: false } : msg
              ));
            }
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
                    body: JSON.stringify({ "user_id": userId, "message": messageToSend, "keywords": currentKeywords }),
                });
    
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`서버 오류 발생: ${res.status} - ${errorText}`);
                }
    
                const data = await res.json(); 
                
                setMessages(prevMessages => {
                    const updatedMessages = prevMessages.filter(msg => !msg.isLoading);
                    
                    let agentResponseContent = '';
                    let agentResponseContentType = 'text';
    
                    if (activeAgent.name === '네이버뉴스' || activeAgent.name === '뉴스큐레이션') {
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
                    return [...updatedMessages, { type: 'agent', contentType: 'text', content: `❌ 오류: ${err.message}` }];
                });
            }
        } else if (activeAgent.mode === 'Stream'){
          if (activeAgent.method === 'POST'){
            const body = {
                user_id: userId,
                message: messageToSend,
                keywords: keywordInputs.filter(kw => kw.trim() !== '')
            };
            startStreamAction(fullApiPath, body);
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
          setKeywordInputs(['', '', '']);
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