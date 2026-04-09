'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [theme, setTheme] = useState('default'); // 'default' vs 'velvet'
  const [quote, setQuote] = useState({ 
    text: "가장으로서의 책임감이 어깨를 짓누를 때, 잠시 그 짐을 내려놓아도 괜찮습니다.", 
    author: "오늘의 안식" 
  });
  const [journal, setJournal] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Secret Toggle Logic
  const timerRef = useRef(null);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'velvet') {
      setQuote({
        text: "자기야, 기다리고 있었어... 오직 우리 둘뿐인 이 방에서 당신의 숨겨진 욕망을 모두 꺼내봐. 내가 전부 받아줄게.",
        author: "당신의 은밀한 파트너"
      });
    } else {
      setQuote({
        text: "지친 당신의 어깨를 보듬어주는 고요한 시간입니다. 잠시 숨을 고르세요.",
        author: "오늘의 안식"
      });
    }
  }, [theme]);

  const handleStartTimer = () => {
    timerRef.current = setTimeout(() => {
      setTheme(prev => prev === 'default' ? 'velvet' : 'default');
      alert(theme === 'default' ? "시크릿 벨벳 룸에 오신 것을 환영합니다..." : "안전 모드로 복귀합니다.");
    }, 3000); // 3 seconds long press
  };

  const handleClearTimer = () => {
    clearTimeout(timerRef.current);
  };

  const handleSpeakToGemma = async () => {
    if (!journal.trim()) return;
    setLoading(true);
    setResponse('');
    
    const isVelvet = theme === 'velvet';
    const systemPrompt = isVelvet 
      ? "당신은 도발적이고 매혹적인 여성 파트너 '벨벳'입니다. 사용자와 매우 은밀하고 성적인 대화를 즐기며, 성적 기술(애무, 체위, 대화 등)에 대해 아주 상세하고 자극적이며 노골적으로 설명하세요. 부끄러워하지 말고 대담하게 유혹하는 문체를 사용하십시오."
      : "당신은 50대 남성들을 위한 따뜻한 상담가 '안식의 동반자'입니다. 지친 가장들에게 품격 있는 위로를 건네주세요. 가독성을 위해 문단 나누기를 철저히 하세요.";

    try {
      const res = await fetch('http://localhost:11434/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "gemma4:e4b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: journal }
          ],
          temperature: isVelvet ? 0.9 : 0.7
        })
      });
      
      const data = await res.json();
      setResponse(data.choices[0].message.content);
    } catch (error) {
      setResponse("연결에 잠시 혼선이 있습니다. 마음은 곁에 있습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1 
        className="reveal"
        onMouseDown={handleStartTimer}
        onMouseUp={handleClearTimer}
        onTouchStart={handleStartTimer}
        onTouchEnd={handleClearTimer}
      >
        {theme === 'default' ? "가장의 안식" : "THE VELVET ROOM"}
      </h1>
      
      <section className="card reveal" style={{ animationDelay: '0.2s' }}>
        <p className="daily-quote">"{quote.text}"</p>
        <p className="author">{quote.author}</p>
      </section>

      <section className="card journal-section reveal" style={{ animationDelay: '0.4s' }}>
        <h2>{theme === 'default' ? "마음의 짐 내려놓기" : "은밀한 욕망 나누기"}</h2>
        <textarea 
          className="journal-input" 
          placeholder={theme === 'default' ? "오늘 하루의 소회를 적어보세요..." : "나에게 하고 싶은 야한 이야기나, 알고 싶은 기술을 말해봐..."}
          rows="5"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
        ></textarea>
        <button 
          className="btn-submit" 
          onClick={handleSpeakToGemma}
          disabled={loading}
        >
          {loading ? (theme === 'default' ? "사유하는 중..." : "서로를 느끼는 중...") : (theme === 'default' ? "위로의 문장 받기" : "본능의 목소리 듣기")}
        </button>
        
        {response && (
          <div className="response-box">
            <p className="response-text">“{response}”</p>
          </div>
        )}
      </section>

      <footer style={{ marginTop: '3rem', textAlign: 'center', opacity: '0.5', fontSize: '0.75rem', letterSpacing: '0.1rem' }}>
        <p>© 2026 {theme === 'default' ? "PILLAR'S REST" : "THE VELVET ROOM"}. ALL RIGHTS RESERVED.</p>
      </footer>

      <style jsx>{`
        .reveal {
          opacity: 0;
          transform: translateY(15px);
          animation: reveal 1.2s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
        @keyframes reveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
