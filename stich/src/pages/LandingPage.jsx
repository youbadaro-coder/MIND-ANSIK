import PropTypes from 'prop-types'

export default function LandingPage({ onStart }) {
  return (
    <div className="app-shell">
      <div className="landing-page">
        {/* 헤더 */}
        <header className="landing-header">
          <a href="#" className="landing-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-name">핏발키리</span>
          </a>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            🇰🇷 한국어
          </span>
        </header>

        {/* 히어로 */}
        <section className="hero-section">
          <div className="hero-bg-grid" />
          <div className="hero-bg-glow" />

          <div className="hero-content">
            <p className="section-label hero-eyebrow">매일 운동이 게임이 된다</p>
            <h1 className="hero-headline">
              <span className="highlight">발키리</span><br />
              <span style={{ fontSize: '0.55em', letterSpacing: '-0.02em' }}>처럼 단련하라</span>
            </h1>
            <p className="hero-subtitle">
              운동 하나하나를 퀘스트로. 습관을 레벨업으로. 오늘부터 당신도 전설이 됩니다.
            </p>
            <div className="hero-cta-row">
              <button id="hero-cta-start" className="btn-primary" onClick={onStart}>
                ⚡ 무료로 시작하기
              </button>
              <button id="hero-cta-demo" className="btn-ghost">
                ▶ 데모 보기
              </button>
            </div>
            <p className="hero-social-proof">
              🌍 전 세계 <strong>12,400+</strong> 명의 전사들이 함께하고 있어요
            </p>
          </div>

          <div className="hero-character-wrap">
            <img
              src="/character.png"
              alt="핏발키리 트레이너 캐릭터"
              className="hero-character-img"
            />
            <div className="hero-speech-bubble">
              레벨업 할 준비 됐어? 💪
            </div>
          </div>
        </section>

        {/* 기능 소개 */}
        <section className="features-section">
          <h2 className="features-title">나만의 피트니스 모험을 시작해요</h2>
          <div className="features-grid">
            <FeatureCard
              icon="🔥"
              title="매일 미션"
              desc="운동이 보스 배틀처럼 느껴집니다. 오늘의 퀘스트를 완료하고 경험치를 획득하세요!"
            />
            <FeatureCard
              icon="⚡"
              title="경험치 & 레벨업"
              desc="운동 하나마다 XP 획득. 레벨이 올라가는 걸 눈으로 확인하며 성장하세요."
            />
            <FeatureCard
              icon="🏆"
              title="글로벌 랭킹"
              desc="전 세계 80개국 전사들과 경쟁하세요. 순위를 올리고 왕좌를 차지하세요!"
            />
          </div>
        </section>

        {/* 요금제 */}
        <section className="pricing-section">
          <h2 className="pricing-title">나에게 맞는 플랜 선택</h2>
          <p className="pricing-sub">무료로 시작하고, 준비가 됐을 때 레벨업하세요.</p>
          <div className="pricing-grid">
            {/* 무료 */}
            <div className="pricing-card">
              <p className="pricing-plan-name">무료</p>
              <p className="pricing-price">$0</p>
              <ul className="pricing-features">
                <li><span className="check">✓</span> 일일 습관 3개</li>
                <li><span className="check">✓</span> 기본 통계</li>
                <li><span className="check">✓</span> 전사 뱃지</li>
                <li style={{ opacity: 0.4 }}>✗ 랭킹보드</li>
                <li style={{ opacity: 0.4 }}>✗ 캐릭터 스킨</li>
              </ul>
              <div className="pricing-cta">
                <button id="free-cta" className="btn-ghost" style={{ width: '100%', fontSize: '13px', padding: '10px' }} onClick={onStart}>
                  시작하기
                </button>
              </div>
            </div>

            {/* 프로 */}
            <div className="pricing-card pro">
              <div className="pricing-popular-badge">가장 인기</div>
              <p className="pricing-plan-name" style={{ color: 'var(--color-tertiary)' }}>PRO</p>
              <p className="pricing-price" style={{ color: 'var(--color-primary)' }}>
                $5.99 <span className="per-month">/월</span>
              </p>
              <ul className="pricing-features">
                <li><span className="check">✓</span> 무제한 습관</li>
                <li><span className="check">✓</span> 모든 업적</li>
                <li><span className="check">✓</span> 랭킹보드</li>
                <li><span className="check">✓</span> 캐릭터 스킨</li>
                <li><span className="check">✓</span> 우선 지원</li>
              </ul>
              <div className="pricing-cta">
                <button id="pro-cta" className="btn-primary" style={{ width: '100%', fontSize: '13px', padding: '10px' }} onClick={onStart}>
                  PRO 시작 ⚡
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="landing-footer">
          <div className="footer-links">
            <a href="#">개인정보처리방침</a>
            <a href="#">이용약관</a>
            <a href="#">문의하기</a>
          </div>
          <p>© 2025 핏발키리 · All rights reserved</p>
        </footer>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <span className="feature-icon">{icon}</span>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  )
}

LandingPage.propTypes = { onStart: PropTypes.func.isRequired }
FeatureCard.propTypes = { icon: PropTypes.string, title: PropTypes.string, desc: PropTypes.string }
