// frontend-react/src/hooks/useChatStreamPost.js
import { useState, useEffect, useRef, useCallback } from 'react';

// useChatStreamPost 커스텀 Hook 정의 (POST + fetch + ReadableStream 방식)
function useChatStreamPost() { // API URL 등은 startStreamAction에서 직접 받음
  const [streamData, setStreamData] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null); // 요청 취소를 위한 AbortController


  // debuging 용
  const startStreamAction = useCallback(async (options) => {
    const { apiUrl, body, onNewChatId, onError} = options;

    console.log(`[디버깅] 지금부터 ${apiUrl} 주소로 POST 요청을 보냅니다.`);
    console.log('[디버깅] 함께 보낼 데이터:', body);

    // 이전 AbortController가 있다면 취소
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController(); // 새 AbortController 생성
    const signal = abortControllerRef.current.signal;


    setError(null);
    setStreamData(''); // ★ streamData를 여기서 초기화
    setIsStreaming(true);

    try {
      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          // ★★★ 스트림 관련 옵션과 AbortController를 '모두' 제거 ★★★
      });

      console.log('[디버깅] 서버로부터 응답을 받았습니다:', response);

      if (!response.ok) {
          // 404 오류가 발생하면 여기서 걸릴 겁니다.
          console.error('[디버깅] 서버 응답이 실패했습니다. 상태 코드:', response.status);
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      // 응답을 받기만 하고, 스트림 처리는 '아무것도' 하지 않습니다.

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      while (true) {
          const { done, value } = await reader.read();
          if (done) {
              break;
          }

          // 버퍼에 '\n'이 있는 동안 계속 루프를 돈다.
          buffer += decoder.decode(value, { stream: true });
          while (buffer.includes('\n')) {
            const separatorIndex = buffer.indexOf('\n'); 
            const singleJsonMessage = buffer.substring(0, separatorIndex); // '\n' 앞까지를 하나의 완전한 메시지로 잘라낸다.
            buffer = buffer.substring(separatorIndex + 1); // 처리한 메시지는 버퍼에서 제거한다.

            if (singleJsonMessage.trim() === "") continue; // 만약 위와 같이 잘라진 메세지가 아무것도 없으면 건너뛰고 다음 문장을 진행 
            
            try {
              // CONTINUE: 가 아닌 대상으로 파싱을 진행  
              const parsedData = JSON.parse(singleJsonMessage);

              if (parsedData.type === 'chat_id') {
                    // [필수] onNewChatId 콜백만 호출합니다.
                    if (onNewChatId) onNewChatId(parsedData.chat_id);

                } else if (parsedData.type === 'text') {
                    // [단순화] onNewChunk 대신, 내부 상태인 streamData를 직접 업데이트합니다.
                    setStreamData(prevData => prevData + parsedData.text);
                    console.log('data',parsedData.text)
                    
                }else {
                  console.log('잘못된 parsedData.type 입니다. -> ', parsedData.type  );
                }
                
            } catch (e) {
                console.warn('[error]:', singleJsonMessage, e);
                setIsStreaming(false);
            }
            break;
          }  
      }

      // 임시로 스트리밍 상태를 바로 종료
      setIsStreaming(false);

    } catch (err) {
        console.error('[디버깅] fetch 요청 중 심각한 오류 발생:', err);
        setError(err);
        setIsStreaming(false);
    }

}, [isStreaming]); // 의존성은 일단 그대로 둡니다.

  // // 스트림을 시작하는 함수: apiUrl, body 등을 인자로 받음
  // const startStreamAction = useCallback( async (apiUrl, body) => {
    
  //   if (isStreaming) {
  //     console.warn("useChatStreamPost: 이미 스트리밍 중이므로 새 스트림을 시작하지 않습니다.");
  //     return;
  //   }

  //   // 이전 AbortController가 있다면 취소
  //   if (abortControllerRef.current) {
  //       abortControllerRef.current.abort();
  //   }

  //   abortControllerRef.current = new AbortController(); // 새 AbortController 생성
  //   const signal = abortControllerRef.current.signal;

  //   setError(null);
  //   setStreamData('');
  //   setIsStreaming(true);

  //   try {
  //     // POST 요청으로 변경
  //     const res = await fetch(apiUrl, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(body), // body에 데이터 포함
  //       signal: signal, // 요청 취소 시그널 연결
  //     });

  //     if (!res.ok || !res.body) {
  //       const errorText = await res.text();
  //       throw new Error(`Server error: ${res.status} - ${errorText}`);
  //     }

  //     // ReadableStream 리더 얻기
  //     const reader = res.body.getReader();
  //     const decoder = new TextDecoder('utf-8'); // UTF-8 디코더

  //     let accumulatedChunk = ''; // 부분적으로 도착한 chunk를 누적
      
      
  //     // while (true) {
  //     //   const { done, value } = await reader.read(); // 스트림에서 데이터 읽기
  //     //   if (done) {
  //     //     console.log('useChatStreamPost: 스트림 완료.');
  //     //     setIsStreaming(false); // 스트림 완료 상태로 변경
  //     //     break; // 스트림 종료
  //     //   }

  //     //   // Uint8Array를 텍스트로 디코딩하고, EventStream 형식에 맞춰 파싱
  //     //   // const chunk = decoder.decode(value, { stream: true });
  //     //   accumulatedChunk += chunk;

  //     //   // EventStream 규격에 따라 "data: [내용]\n\n"을 파싱
  //     //   let messages = accumulatedChunk.split('\n\n');
  //     //   accumulatedChunk = messages.pop(); // 마지막 불완전한 메시지는 다음 청크와 합쳐질 수 있음

  //     //   messages.forEach(msg => {

  //     //     // if (msg.startsWith('data: ')) {
  //     //     //   const dataContent = msg.substring(6); // "data: " 제거
  //     //     //   if (dataContent === "[DONE]") {
  //     //     //     // [DONE] 메시지를 받으면 스트림 완료 처리
  //     //     //     console.log('useChatStreamPost: [DONE] 메시지 수신.');
  //     //     //     setIsStreaming(false); // 스트림 완료 상태로 변경
  //     //     //     // reader.cancel() 등을 통해 스트림을 강제 종료할 수도 있습니다.
  //     //     //   } else {
  //     //     //     setStreamData(prevData => prevData + dataContent);
  //     //     //   }
  //     //     // }

  //     let buffer = ''; // 개행(\n)을 기준으로 메시지를 처리하기 위한 버퍼
  //     while (buffer.includes('\n')) {
  //       const separatorIndex = buffer.indexOf('\n');
  //       // 3. 개행 문자 앞까지 잘라내어 하나의 완전한 JSON 메시지로 간주
  //       const singleJsonMessage = buffer.substring(0, separatorIndex);
  //       // 4. 처리한 메시지는 버퍼에서 제거
  //       buffer = buffer.substring(separatorIndex + 1);

  //       if (singleJsonMessage.trim() === "") continue;

  //       try {
  //         // 5. 완전한 JSON 메시지를 파싱
  //         const parsedData = JSON.parse(singleJsonMessage);

  //         // 6. 파싱된 데이터의 type에 따라 분기 처리
  //         if (parsedData.type === 'chat_id' || parsedData.type === 'metadata') {
  //           // 메타데이터(chat_id) 콜백 호출
  //           if (onNewChatId) onNewChatId(parsedData.chat_id);
          
  //         } else if (parsedData.type === 'text' || parsedData.type === 'text_chunk') {
  //           // 텍스트 조각은 streamData 상태에 추가
  //           setStreamData(prevData => prevData + parsedData.text);
          
  //         } else if (parsedData.type === 'error') {
  //           // 에러 콜백 호출
  //           if (onError) onError(new Error(parsedData.error));
  //           console.error('useChatStreamPost: 서버로부터 에러 메시지 수신:', parsedData.error);
  //         }
  //       } catch (e) {
  //         console.warn('useChatStreamPost: 잘못된 JSON 메시지 수신, 건너뜁니다:', singleJsonMessage, e);
  //       }
  //     }
  //   } catch (err) {
  //     if (err.name === 'AbortError') {
  //       console.log('useChatStreamPost: fetch 요청이 취소되었습니다.');
  //     } else {
  //       console.error('useChatStreamPost: 스트리밍 오류 발생:', err);
  //       setError(err);
  //     }
  //     setIsStreaming(false);
  //   } finally {
  //     abortControllerRef.current = null;
  //   }
  // }, [isStreaming]); // isStreaming은 중복 방지 로직에 사용되므로 의존성에 포함

  // useEffect는 컴포넌트 언마운트 시에만 정리 역할을 합니다.
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 기존 fetch 요청 취소
      if (abortControllerRef.current) {
        console.log('useChatStreamPost: 컴포넌트 언마운트 시 fetch 요청 취소.');
        abortControllerRef.current.abort();
      }
    };
  }, []); // 빈 의존성 배열

  return { streamData, isStreaming, error, startStreamAction };
}

export default useChatStreamPost;