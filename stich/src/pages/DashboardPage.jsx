import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

/* ── Utilities ── */
function spawnConfetti() {
  // Use CSS-only confetti via a temporary class on body
  try {
    const colors = ['#ff2d6b', '#00e5ff', '#a855f7', '#00ff94', '#ffcc00']
    const container = document.getElementById('confetti-container')
    if (!container) return
    for (let i = 0; i < 14; i++) {
      const piece = document.createElement('div')
      const angle = Math.random() * 360
      const distance = 40 + Math.random() * 80
      piece.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: 50%; top: 50%;
        transform: translate(-50%,-50%);
        pointer-events: none;
        opacity: 1;
        transition: transform 0.8s ease-out, opacity 0.8s ease-out;
      `
      container.appendChild(piece)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rad = angle * (Math.PI / 180)
          piece.style.transform = `translate(calc(-50% + ${Math.cos(rad) * distance}px), calc(-50% + ${Math.sin(rad) * distance}px)) rotate(${angle}deg)`
          piece.style.opacity = '0'
        })
      })
      setTimeout(() => { if (piece.parentNode) piece.parentNode.removeChild(piece) }, 900)
    }
  } catch (e) { /* silent */ }
}

/* ── Data ── */
const INITIAL_HABITS = [
  { id: 1, name: '아침 스트레칭', duration: '10분', difficulty: 'easy', xp: 30, done: true },
  { id: 2, name: 'HIIT 유산소 폭발', duration: '20분', difficulty: 'hard', xp: 100, done: false },
  { id: 3, name: '저녁 요가', duration: '15분', difficulty: 'medium', xp: 50, done: false },
]

const STATS = [
  { label: '운동 횟수', value: '3/5', icon: '🏋️', color: '#ff2d6b', progress: 0.6 },
  { label: '활동 시간', value: '47분', icon: '⏱️', color: '#00e5ff', progress: 0.78 },
  { label: '칼로리', value: '320', icon: '🔥', color: '#a855f7', progress: 0.45 },
]

const NAV_ITEMS = [
  { id: 'home', icon: '🏠', label: '홈' },
  { id: 'trophy', icon: '🏆', label: '랭킹' },
  { id: 'calendar', icon: '📅', label: '기록' },
  { id: 'profile', icon: '👤', label: '내 정보' },
]

/* ── EXP logic ── */
const BASE_XP = 2450
const MAX_XP = 3000
const LEVEL = 12

export default function DashboardPage({ onBack }) {
  const [habits, setHabits] = useState(INITIAL_HABITS)
  const [activeNav, setActiveNav] = useState('home')
  const [xp, setXp] = useState(BASE_XP)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [streakDays] = useState(21)

  const xpPercent = Math.min((xp / MAX_XP) * 100, 100)

  const toggleHabit = useCallback((id) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h
      const nowDone = !h.done
      if (nowDone) {
        spawnConfetti()
        const gained = h.xp
        setXp(currentXp => {
          const next = currentXp + gained
          if (next >= MAX_XP && currentXp < MAX_XP) {
            setTimeout(() => setShowLevelUp(true), 400)
            setTimeout(() => setShowLevelUp(false), 2800)
          }
          return Math.min(next, MAX_XP)
        })
      }
      return { ...h, done: nowDone }
    }))
  }, [])

  // Animate XP bar on mount
  useEffect(() => {
    // small bounce for first load — handled by CSS transition
  }, [])

  return (
    <div className="app-shell">
      {/* Confetti Container */}
      <div id="confetti-container" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }} />

      {/* 레벨업 오버레이 */}
      {showLevelUp && (
        <div className="levelup-overlay">
          <div style={{ fontSize: 72 }}>🎉</div>
          <div className="levelup-title">레벨 업!</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>LV.{LEVEL + 1} 달성! 대단해요! 🔥</div>
        </div>
      )}

      <div className="dashboard">
        {/* 상단 바 */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="avatar">💪</div>
            <div>
              <p className="greeting-small">좋은 아침이에요,</p>
              <p className="greeting-name">영웅이여! 🔥</p>
            </div>
          </div>
          <button id="notif-btn" className="notif-btn" aria-label="알림">
            🔔
            <span className="notif-dot" />
          </button>
        </header>

        {/* 스트릭 카드 */}
        <StreakCard streakDays={streakDays} xp={xp} xpMax={MAX_XP} xpPercent={xpPercent} level={LEVEL} />

        {/* 오늘의 진행 상황 */}
        <section className="stats-section">
          <p className="section-label" style={{ marginBottom: 12 }}>오늘의 진행 상황</p>
          <div className="stats-row">
            {STATS.map(s => (
              <StatRing key={s.id || s.label} {...s} />
            ))}
          </div>
        </section>

        {/* 미션 */}
        <section className="missions-section">
          <div className="missions-header">
            <h2 className="missions-title">⚔️ 오늘의 미션</h2>
            <span className="missions-count">
              {habits.filter(h => h.done).length}/{habits.length} 완료
            </span>
          </div>
          {habits.map(habit => (
            <HabitCard key={habit.id} habit={habit} onToggle={(id) => toggleHabit(id)} />
          ))}
        </section>

        {/* 변신 캐릭터 */}
        <CharacterSection habits={habits} xpPercent={xpPercent} />

        {/* 뒤로 가기 (데모용) */}
        <div style={{ textAlign: 'center', padding: '24px 24px 0' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-secondary)',
              fontSize: 13, cursor: 'pointer', textDecoration: 'underline'
            }}
          >
            ← 랜딩 페이지로 돌아가기
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
            onClick={() => setActiveNav(item.id)}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

/* ── Sub-Components ── */

function StreakCard({ streakDays, xp, xpMax, xpPercent, level }) {
  return (
    <div className="streak-card">
      <div className="streak-header">
        <div className="streak-left">
          <div className="streak-fire-row">
            <span className="streak-fire">🔥</span>
            <div>
              <div className="streak-number">{streakDays}</div>
              <div className="streak-label">일 연속 달성</div>
            </div>
          </div>
          <p className="streak-subtitle">개인 최고 기록! 계속 달려! 🚀</p>
        </div>
        <div className="streak-pb-badge">🏅 최고</div>
      </div>

      <div className="exp-bar-wrap">
        <div className="exp-bar-labels">
          <span className="exp-lvl">레벨 {level}</span>
          <span className="exp-count">{xp.toLocaleString()} / {xpMax.toLocaleString()} XP</span>
        </div>
        <div className="exp-bar-track">
          <div
            className="exp-bar-fill"
            style={{ width: `${xpPercent}%` }}
            role="progressbar"
            aria-valuenow={xp}
            aria-valuemax={xpMax}
            aria-label="Experience points"
          />
        </div>
      </div>
    </div>
  )
}

function StatRing({ label, value, icon, color, progress }) {
  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)

  return (
    <div className="stat-ring-card">
      <div className="ring-svg-wrap">
        <svg className="ring-svg" viewBox="0 0 60 60" aria-hidden="true">
          <circle
            className="ring-track"
            cx="30" cy="30" r={r}
            stroke="rgba(71,70,89,0.4)"
          />
          <circle
            className="ring-fill"
            cx="30" cy="30" r={r}
            stroke={color}
            style={{
              strokeDasharray: circ,
              strokeDashoffset: offset,
              filter: `drop-shadow(0 0 4px ${color}80)`
            }}
          />
        </svg>
        <div className="ring-icon">{icon}</div>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-name">{label}</div>
    </div>
  )
}

function HabitCard({ habit, onToggle }) {
  const diffClass = { easy: 'badge-easy', medium: 'badge-medium', hard: 'badge-hard' }[habit.difficulty]
  const diffLabel = { easy: '쉬움', medium: '보통', hard: '어려움' }[habit.difficulty]

  let cardClass = 'habit-card'
  let checkClass = 'habit-check'
  let checkContent = null

  if (habit.done) {
    cardClass += ' completed'
    checkClass += ' done'
    checkContent = '✓'
  } else if (habit.difficulty === 'hard') {
    cardClass += ' active'
    checkClass += ' active-ring'
  } else {
    checkClass += ' locked-ring'
  }

  return (
    <div
      id={`habit-${habit.id}`}
      className={cardClass}
      onClick={() => onToggle(habit.id)}
      role="checkbox"
      aria-checked={habit.done}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle(habit.id)}
    >
      <div className={checkClass}>{checkContent}</div>
      <div className="habit-info">
        <p className={`habit-name ${habit.done ? 'strikethrough' : ''}`}>{habit.name}</p>
        <div className="habit-meta">
          <span className="habit-duration">⏱ {habit.duration}</span>
          <span className={`badge ${diffClass}`}>{diffLabel}</span>
        </div>
      </div>
      <div className="habit-right">
        <span className="xp-pill">+{habit.xp} XP</span>
      </div>
    </div>
  )
}

function CharacterSection({ habits, xpPercent }) {
  const stage = xpPercent < 25 ? 1 : xpPercent < 50 ? 2 : xpPercent < 80 ? 3 : 4

  const stages = {
    1: { label: '🌱 시작 단계', desc: '이제 막 시작했어요!', message: '전사 훈련을 시작할 시간이에요! ⚔️\n첫 걸음이 가장 어렵지만 할 수 있어요!', color: '#8888aa', imgKey: 'stage1' },
    2: { label: '🔥 변화 중', desc: '몸이 변하기 시작했어요!', message: '벌써 변화가 느껴지죠? 멈추지 마세요!\n운동이 효과를 내기 시작했어요! 💪', color: '#ffcc00', imgKey: 'stage2' },
    3: { label: '⚡ 날씬해지는 중', desc: '근육이 붙고 있어요!', message: '불타오르고 있어요! 몸이 달라지고 있어요!\n계속 달려요! 🔥', color: '#00e5ff', imgKey: 'stage3' },
    4: { label: '👑 전설 달성!', desc: '완벽한 몸매 완성!', message: '전설이 됐어요! 당신은 진정한 발키리예요!\n🏆🔥 모든 미션 완료!', color: '#ff2d6b', imgKey: 'stage4' },
  }
  const current = stages[stage]

  const svgConfigs = {
    1: { body: 'M50,85 Q27,90 25,128 L32,175 Q50,183 68,175 L75,128 Q73,90 50,85', hip: 'M30,160 Q50,172 70,160 L68,192 Q50,198 32,192 Z', armL: 'M32,102 Q10,84 8,63 Q11,54 17,57 Q23,72 37,96', armR: 'M68,102 Q90,84 92,63 Q89,54 83,57 Q77,72 63,96', c: '#c084fc', lw: 26 },
    2: { body: 'M50,85 Q32,88 30,119 L37,167 Q50,174 63,167 L70,119 Q68,88 50,85', hip: 'M35,153 Q50,164 65,153 L63,184 Q50,189 37,184 Z', armL: 'M34,98 Q15,80 13,61 Q16,53 21,56 Q26,70 39,93', armR: 'M66,98 Q85,80 87,61 Q84,53 79,56 Q74,70 61,93', c: '#f472b6', lw: 21 },
    3: { body: 'M50,85 Q36,87 35,114 L41,162 Q50,168 59,162 L65,114 Q64,87 50,85', hip: 'M38,149 Q50,159 62,149 L60,179 Q50,183 40,179 Z', armL: 'M36,96 Q19,78 18,59 Q21,52 26,55 Q29,68 41,91', armR: 'M64,96 Q81,78 82,59 Q79,52 74,55 Q71,68 59,91', c: '#22d3ee', lw: 17 },
    4: { body: 'M50,85 Q38,86 38,111 L43,159 Q50,164 57,159 L62,111 Q62,86 50,85', hip: 'M41,147 Q50,155 59,147 L57,173 Q50,177 43,173 Z', armL: 'M39,94 Q24,75 24,56 Q27,49 31,53 Q33,65 43,90', armR: 'M61,94 Q76,75 76,56 Q73,49 69,53 Q67,65 57,90', c: '#ff2d6b', lw: 13 },
  }
  const sc = svgConfigs[stage]

  return (
    <div style={{ margin: '16px', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${current.color}30`, background: 'var(--color-surface-2)' }}>
      {/* 변신 진행바 */}
      <div style={{ padding: '12px 16px 8px', background: 'var(--color-surface-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: current.color }}>{current.label}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{current.desc}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: s <= stage ? current.color : 'var(--color-surface-4)', boxShadow: s <= stage ? `0 0 8px ${current.color}80` : 'none', transition: 'all 0.5s ease' }}/>
          ))}
        </div>
      </div>

      {/* 캐릭터 + 말풍선 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: 16 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={`/${current.imgKey}.png`}
            alt={`${current.label} 캐릭터`}
            style={{ width: 110, height: 'auto', animation: 'charFloat 4s ease-in-out infinite', filter: `drop-shadow(0 0 14px ${current.color}50)` }}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
          />
          {/* SVG 대체 캐릭터 (요가복) */}
          <svg style={{ display: 'none', animation: 'charFloat 4s ease-in-out infinite', filter: `drop-shadow(0 0 16px ${sc.c}60)` }} width="110" height="210" viewBox="0 0 100 210" fill="none">
            <circle cx="50" cy="25" r="18" fill={sc.c} opacity="0.9"/>
            <ellipse cx="50" cy="14" rx="20" ry="10" fill="#1a1a3a" opacity="0.85"/>
            <circle cx="43" cy="27" r="2" fill="#1a1a3a" opacity="0.6"/>
            <circle cx="57" cy="27" r="2" fill="#1a1a3a" opacity="0.6"/>
            <path d="M44,35 Q50,40 56,35" stroke="#1a1a3a" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <rect x="46" y="43" width="8" height="14" rx="4" fill={sc.c} opacity="0.8"/>
            <path d={sc.body} fill={sc.c} opacity="0.85"/>
            <path d={sc.armL} fill={sc.c} opacity="0.75"/>
            <path d={sc.armR} fill={sc.c} opacity="0.75"/>
            <path d={sc.hip} fill="#1a1a3a" opacity="0.9"/>
            <rect x={50 - sc.lw} y="177" width={sc.lw - 2} height="36" rx="6" fill="#1a1a3a" opacity="0.85"/>
            <rect x="52" y="177" width={sc.lw - 2} height="36" rx="6" fill="#1a1a3a" opacity="0.85"/>
            {Array.from({ length: stage }).map((_, i) => <text key={i} x={28 + i * 13} y="208" fontSize="11" fill={sc.c}>★</text>)}
          </svg>
          <div style={{ position: 'absolute', top: 0, right: -10, background: current.color, color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 800, boxShadow: `0 0 10px ${current.color}80` }}>
            {stage}/4
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: 'var(--color-surface-4)', border: `1px solid ${current.color}30`, borderRadius: '12px 12px 12px 4px', padding: '12px 14px', marginBottom: 8, fontSize: 13, fontWeight: 500, lineHeight: 1.55, whiteSpace: 'pre-line' }}>
            {current.message}
          </div>
          <p style={{ fontSize: 11, color: current.color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>⚡ 발키리 트레이너 · 변신 {stage}단계</p>
        </div>
      </div>

      {/* 단계 미리보기 */}
      <div style={{ display: 'flex', padding: '4px 16px 14px', gap: 8 }}>
        {[1,2,3,4].map(s => (
          <div key={s} style={{ flex: 1, textAlign: 'center', opacity: s <= stage ? 1 : 0.3, transition: 'opacity 0.5s ease' }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, margin: '0 auto 4px', background: s <= stage ? stages[s].color : 'var(--color-surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: s <= stage ? `0 0 8px ${stages[s].color}60` : 'none', transition: 'all 0.5s ease' }}>
              {s === 1 ? '🌱' : s === 2 ? '🔥' : s === 3 ? '⚡' : '👑'}
            </div>
            <div style={{ fontSize: 9, color: s <= stage ? stages[s].color : 'var(--color-text-secondary)', fontWeight: 600 }}>
              {s === 1 ? '시작' : s === 2 ? '변화' : s === 3 ? '날씬' : '전설'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

DashboardPage.propTypes = { onBack: PropTypes.func.isRequired }
StreakCard.propTypes = { streakDays: PropTypes.number, xp: PropTypes.number, xpMax: PropTypes.number, xpPercent: PropTypes.number, level: PropTypes.number }
StatRing.propTypes = { label: PropTypes.string, value: PropTypes.string, icon: PropTypes.string, color: PropTypes.string, progress: PropTypes.number }
HabitCard.propTypes = { habit: PropTypes.object, onToggle: PropTypes.func }
CharacterSection.propTypes = { habits: PropTypes.array, xpPercent: PropTypes.number }
