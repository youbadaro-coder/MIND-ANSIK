// 뽀모도로 타이머 상태 관리
let timeLeft = 25 * 60; // 초 단위
let timerId = null;
let isFocusSession = true;
let totalSessions = 0;

const timerDisplay = document.getElementById('timer-display');
const progressRing = document.getElementById('timer-progress');
const statusBadge = document.getElementById('status-badge');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const focusTab = document.getElementById('focus-tab');
const breakTab = document.getElementById('break-tab');
const sessionCountDisplay = document.getElementById('session-count');
const kodariMsg = document.getElementById('kodari-msg');

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const KODARI_MESSAGES = {
    focus: [
        "대표님, 지금 이 25분이 미래를 바꿉니다! 집중 가즈아!",
        "방해 금지! 코다리가 입구 지키고 있겠습니다! 😎",
        "크으~ 대표님의 집중하는 모습, 너무 섹시(?)하십니다!",
        "한 번만 더 집중하면 성공입니다! 맡겨만 주십시오!"
    ],
    break: [
        "고생하셨습니다! 커피 한 잔의 여유 어떠신가요? ☕",
        "5분만 푹 쉬고 오세요. 코다리도 좀 쉬겠습니다. 🐟",
        "대표님, 스트레칭 한 번 쭈욱~ 하시죠!",
        "잠깐 쉬어야 뇌가 돌아갑니다. 역시 대표님의 안목!"
    ]
};

// 프로그레스 바 초기화
progressRing.style.strokeDasharray = CIRCUMFERENCE;

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.title = `(${timerDisplay.textContent}) 코다리 뽀모도로`;
}

function updateProgress(ratio) {
    const offset = CIRCUMFERENCE - (ratio * CIRCUMFERENCE);
    progressRing.style.strokeDashoffset = offset;
}

function startTimer() {
    if (timerId) return;
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        const total = isFocusSession ? 25 * 60 : 5 * 60;
        updateProgress(timeLeft / total);
        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            sessionCompleted();
        }
    }, 1000);
    updateKodariMsg();
}

function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
}

function resetTimer() {
    pauseTimer();
    isFocusSession = true;
    timeLeft = 25 * 60;
    updateTimerDisplay();
    updateProgress(1);
    updateUIForMode();
}

// 주간 데이터 관리 (LocalStorage 활용)
let weeklyData = JSON.parse(localStorage.getItem('kodari-weekly-sessions')) || [0, 0, 0, 0, 0, 0, 0]; // 월~일

function saveWeeklyData() {
    localStorage.setItem('kodari-weekly-sessions', JSON.stringify(weeklyData));
}

function updateWeeklyChart() {
    const chartContainer = document.getElementById('weekly-chart');
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const todayIndex = (new Date().getDay() + 6) % 7; // 0(월) ~ 6(일)로 변환

    chartContainer.innerHTML = '';
    const maxSessions = Math.max(...weeklyData, 4);

    weeklyData.forEach((count, index) => {
        const heightPercentage = (count / maxSessions) * 100;
        const isToday = index === todayIndex;

        const dayCol = document.createElement('div');
        dayCol.className = 'flex-1 flex flex-col items-center gap-2 h-full';
        dayCol.innerHTML = `
            <div class="w-full flex-1 bg-slate-700/30 rounded-t-lg relative group flex items-end">
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-pink-500 text-[10px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    ${count} sessions
                </div>
                <div class="w-full rounded-t-lg transition-all duration-1000 ${isToday ? 'bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-pink-500/30'}" 
                     style="height: ${heightPercentage}%"></div>
            </div>
            <span class="text-[10px] font-bold ${isToday ? 'text-pink-400' : 'text-slate-500'}">${days[index]}</span>
        `;
        chartContainer.appendChild(dayCol);
    });
}

function sessionCompleted() {
    if (isFocusSession) {
        totalSessions++;
        const todayIndex = (new Date().getDay() + 6) % 7;
        weeklyData[todayIndex]++;
        saveWeeklyData();
        updateWeeklyChart();
        sessionCountDisplay.textContent = `Today: ${totalSessions} sessions`;
        alert("오늘의 집중 세션 완료! 역시 우리 대표님 대단하십니다! 🚀");
        switchToBreak();
    } else {
        alert("충분히 쉬셨나요? 다시 달릴 시간입니다! 충성! 🫡");
        switchToFocus();
    }
}

function switchToFocus() {
    isFocusSession = true;
    timeLeft = 25 * 60;
    updateUIForMode();
    updateTimerDisplay();
    updateProgress(1);
}

function switchToBreak() {
    isFocusSession = false;
    timeLeft = 5 * 60;
    updateUIForMode();
    updateTimerDisplay();
    updateProgress(1);
}

function updateUIForMode() {
    if (isFocusSession) {
        statusBadge.textContent = "FOCUS TIME 🎯";
        statusBadge.className = "bg-pink-500/10 text-pink-400 px-4 py-1 rounded-full text-sm font-bold border border-pink-500/20 inline-block animate-bounce-subtle";
        progressRing.style.stroke = "#ec4899";
        focusTab.className = "flex-1 py-2 text-sm font-bold rounded-lg bg-pink-500/20 text-pink-200 transition-all";
        breakTab.className = "flex-1 py-2 text-sm font-bold rounded-lg text-slate-400 hover:text-white transition-all";
    } else {
        statusBadge.textContent = "BREAK TIME ☕";
        statusBadge.className = "bg-emerald-500/10 text-emerald-400 px-4 py-1 rounded-full text-sm font-bold border border-emerald-500/20 inline-block animate-bounce-subtle";
        progressRing.style.stroke = "#10b981";
        breakTab.className = "flex-1 py-2 text-sm font-bold rounded-lg bg-emerald-500/20 text-emerald-200 transition-all";
        focusTab.className = "flex-1 py-2 text-sm font-bold rounded-lg text-slate-400 hover:text-white transition-all";
    }
    updateKodariMsg();
}

function updateKodariMsg() {
    const msgs = isFocusSession ? KODARI_MESSAGES.focus : KODARI_MESSAGES.break;
    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
    kodariMsg.textContent = `"${randomMsg}"`;
}

function init() {
    updateTimerDisplay();
    updateProgress(1);
    updateKodariMsg();
    updateWeeklyChart();
    const todayIndex = (new Date().getDay() + 6) % 7;
    totalSessions = weeklyData[todayIndex];
    sessionCountDisplay.textContent = `Today: ${totalSessions} sessions`;
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
focusTab.addEventListener('click', () => { if (!timerId) switchToFocus(); });
breakTab.addEventListener('click', () => { if (!timerId) switchToBreak(); });

init();
