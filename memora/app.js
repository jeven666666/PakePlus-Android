const pageHistory = [];
let currentPage = 'page-home';

const memberOnlyPages = [
  'page-challenge-hall', 'page-challenge-detail', 'page-challenge-fill',
  'page-challenge-recite', 'page-challenge-blind', 'page-challenge-reorder',
  'page-challenge-result', 'page-challenge-rank',
  'page-battle', 'page-battle-invite', 'page-battle-arena', 'page-battle-result',
  'page-voice'
];

function navigateTo(pageId, params) {
  if (!state.user.isMember && memberOnlyPages.includes(pageId)) {
    showMembershipModal();
    return;
  }
  const currentEl = document.getElementById(currentPage);
  if (currentEl) currentEl.classList.remove('active');
  const targetEl = document.getElementById(pageId);
  if (targetEl) targetEl.classList.add('active');
  if (currentPage !== pageId) {
    pageHistory.push(currentPage);
  }
  currentPage = pageId;
  onPageEnter(pageId, params);
}

function goBack() {
  if (pageHistory.length > 0) {
    const prevPage = pageHistory.pop();
    const currentEl = document.getElementById(currentPage);
    if (currentEl) currentEl.classList.remove('active');
    const prevEl = document.getElementById(prevPage);
    if (prevEl) prevEl.classList.add('active');
    currentPage = prevPage;
  } else {
    switchTab(0);
  }
}

function switchTab(index) {
  const tabPages = ['page-books', 'page-books-list', 'page-data', 'page-profile'];
  const pageId = tabPages[index] || 'page-books';
  pageHistory.length = 0;
  const currentEl = document.getElementById(currentPage);
  if (currentEl) currentEl.classList.remove('active');
  const targetEl = document.getElementById(pageId);
  if (targetEl) targetEl.classList.add('active');
  currentPage = pageId;
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.classList.toggle('active', parseInt(tab.dataset.tab) === index);
  });
}

const state = {
  user: {
    id: 'user-001',
    nickname: 'Gale',
    avatar: 'G',
    target: '考研设计史论 · 目标：江浙沪 211',
    level: 3,
    xp: 6500,
    xpToNext: 10000,
    totalHours: 127,
    correctRate: 0.89,
    streak: 23,
    longestStreak: 45,
    totalPoints: 2340,
    isMember: false,
    membership: { plan: null, startDate: null, endDate: null },
    dailyQuota: { recite: 10, quiz: 1, aiChat: 5, challenge: 5 },
    dailyUsed: { recite: 3, quiz: 0, aiChat: 2, challenge: 1 }
  },
  currentBook: null,
  currentChapter: null,
  currentKnowledge: null,
  challengeState: {
    chapterId: 'art-chapter-01',
    chapterTitle: '艺术本质论',
    totalLevels: 10,
    currentLevel: 1,
    unlockedUpTo: 3,
    levels: [
      { levelId: 1, type: 'fill', difficulty: 'easy', timeLimit: 60, bestScore: 95, bestStars: 3, attempts: 3, completed: true },
      { levelId: 2, type: 'recite', difficulty: 'medium', timeLimit: 90, bestScore: 78, bestStars: 2, attempts: 2, completed: true },
      { levelId: 3, type: 'blind', difficulty: 'hard', timeLimit: 60, bestScore: 0, bestStars: 0, attempts: 0, completed: false },
      { levelId: 4, type: 'reorder', difficulty: 'easy', timeLimit: 60, bestScore: 0, bestStars: 0, attempts: 0, completed: false },
      { levelId: 5, type: 'fill', difficulty: 'medium', timeLimit: 60, bestScore: 0, bestStars: 0, attempts: 0, completed: false },
      { levelId: 6, type: 'recite', difficulty: 'hard', timeLimit: 90, bestScore: 0, bestStars: 0, attempts: 0, completed: false },
      { levelId: 7, type: 'blind', difficulty: 'medium', timeLimit: 60, bestScore: 0, bestStars: 0, attempts: 0, completed: false },
      { levelId: 8, type: 'reorder', difficulty: 'medium', timeLimit: 60, bestScore: 0, bestStars: 0, attempts: 0, completed: false },
      { levelId: 9, type: 'fill', difficulty: 'hard', timeLimit: 60, bestScore: 0, bestStars: 0, attempts: 0, completed: false },
      { levelId: 10, type: 'recite', difficulty: 'hard', timeLimit: 120, bestScore: 0, bestStars: 0, attempts: 0, completed: false }
    ],
    totalStars: 5,
    totalScore: 173,
    combo: 0,
    hp: 80
  },
  battleState: {
    opponent: null,
    myScore: 0,
    opponentScore: 0,
    currentRound: 1,
    totalRounds: 5
  },
  selectedPlan: 'quarterly',
  onboardingStep: 0
};

const knowledgePoints = [
  {
    id: 'art-nature-001',
    title: '艺术本质论',
    content: '马克思主义认为，艺术是一种特殊的社会意识形态，是上层建筑的重要组成部分，它根源于社会生活，又反作用于经济基础。',
    book: '艺术概论',
    chapter: '第一章 艺术的本质',
    tags: ['意识形态', '上层建筑', '社会生活', '经济基础'],
    keywords: ['社会意识形态', '上层建筑', '社会生活', '经济基础', '反作用'],
    structure: {
      level0: '艺术本质论',
      level1: ['社会意识形态', '上层建筑'],
      level2: ['根源于社会生活', '反作用于经济基础']
    },
    hp: 75,
    correctRate: 0.85,
    errorCount: 3,
    lastStudied: '2026-05-26',
    nextReview: '2026-05-28'
  },
  {
    id: 'art-nature-002',
    title: '艺术的社会功能',
    content: '艺术的社会功能主要包括：认知功能、教育功能、审美功能。认知功能使人认识社会生活；教育功能通过形象感染人；审美功能是艺术最本质的功能。',
    book: '艺术概论',
    chapter: '第一章 艺术的本质',
    tags: ['认知功能', '教育功能', '审美功能'],
    keywords: ['认知功能', '教育功能', '审美功能', '形象感染', '最本质'],
    structure: {
      level0: '艺术的社会功能',
      level1: ['认知功能', '教育功能', '审美功能'],
      level2: ['认识社会生活', '形象感染人', '最本质的功能']
    },
    hp: 60,
    correctRate: 0.72,
    errorCount: 5,
    lastStudied: '2026-05-25',
    nextReview: '2026-05-27'
  },
  {
    id: 'art-origin-001',
    title: '艺术起源学说',
    content: '关于艺术起源的主要学说有：模仿说、游戏说、表现说、巫术说、劳动说。其中劳动说认为艺术起源于人类的生产劳动实践，是目前最被广泛接受的观点。',
    book: '艺术概论',
    chapter: '第二章 艺术的起源',
    tags: ['模仿说', '游戏说', '表现说', '巫术说', '劳动说'],
    keywords: ['模仿说', '游戏说', '表现说', '巫术说', '劳动说', '生产劳动实践'],
    structure: {
      level0: '艺术起源学说',
      level1: ['模仿说', '游戏说', '表现说', '巫术说', '劳动说'],
      level2: ['艺术模仿自然', '精力过剩的游戏', '情感表现', '巫术仪式', '生产劳动实践']
    },
    hp: 45,
    correctRate: 0.60,
    errorCount: 8,
    lastStudied: '2026-05-24',
    nextReview: '2026-05-26'
  },
  {
    id: 'design-history-001',
    title: '包豪斯设计教育体系',
    content: '包豪斯提出了"艺术与技术的新统一"的设计理念，建立了基础课（三大构成：平面构成、色彩构成、立体构成）和双轨制教学（形式导师+工作室导师）的教育体系。',
    book: '设计史',
    chapter: '第三章 现代设计运动',
    tags: ['包豪斯', '艺术与技术', '三大构成', '双轨制'],
    keywords: ['艺术与技术的新统一', '三大构成', '平面构成', '色彩构成', '立体构成', '双轨制教学'],
    structure: {
      level0: '包豪斯设计教育体系',
      level1: ['设计理念', '基础课', '教学制度'],
      level2: ['艺术与技术的新统一', '三大构成', '双轨制教学']
    },
    hp: 90,
    correctRate: 0.95,
    errorCount: 1,
    lastStudied: '2026-05-27',
    nextReview: '2026-05-29'
  },
  {
    id: 'design-history-002',
    title: '工艺美术运动',
    content: '工艺美术运动由威廉·莫里斯倡导，主张恢复手工制作，反对机械化生产，强调艺术与手工艺的结合，主张"师承自然"的设计原则。',
    book: '设计史',
    chapter: '第二章 设计改革的先驱',
    tags: ['威廉·莫里斯', '手工制作', '师承自然'],
    keywords: ['威廉·莫里斯', '手工制作', '机械化生产', '艺术与手工艺', '师承自然'],
    structure: {
      level0: '工艺美术运动',
      level1: ['倡导者', '主张', '设计原则'],
      level2: ['威廉·莫里斯', '恢复手工制作/反对机械化', '师承自然']
    },
    hp: 30,
    correctRate: 0.45,
    errorCount: 12,
    lastStudied: '2026-05-23',
    nextReview: '2026-05-25'
  }
];

let timerInterval = null;
let timerSeconds = 0;

function startTimer(seconds, onTick, onEnd) {
  timerSeconds = seconds;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerSeconds--;
    if (onTick) onTick(timerSeconds);
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (onEnd) onEnd();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function startChallenge(type, levelId) {
  const level = state.challengeState.levels.find(l => l.levelId === levelId);
  if (!level) return;
  state.challengeState.currentLevel = levelId;
  const pageMap = {
    fill: 'page-challenge-fill',
    recite: 'page-challenge-recite',
    blind: 'page-challenge-blind',
    reorder: 'page-challenge-reorder'
  };
  const pageId = pageMap[type];
  if (!pageId) return;
  navigateTo(pageId, { levelId, type });
}

function submitChallengeAnswer() {
  stopTimer();
  const kp = knowledgePoints[0];
  let userAnswer = '';
  const textarea = document.querySelector('.challenge-content textarea');
  const inputs = document.querySelectorAll('.challenge-content .blank-input');
  if (textarea) {
    userAnswer = textarea.value;
  } else if (inputs.length > 0) {
    userAnswer = Array.from(inputs).map(i => i.value).join('，');
  }
  const result = calculateScore(userAnswer, kp.content, kp.keywords);
  const correct = result.totalScore >= 50;
  updateCombo(correct);
  if (correct) {
    updateHP(Math.floor(Math.random() * 11) + 5);
  } else {
    updateHP(-(Math.floor(Math.random() * 16) + 5));
  }
  navigateTo('page-challenge-result', result);
}

function calculateScore(userAnswer, originalContent, keywords) {
  let keywordMatches = 0;
  keywords.forEach(kw => {
    if (userAnswer.includes(kw)) keywordMatches++;
  });
  let keywordScore = keywords.length > 0 ? keywordMatches / keywords.length : 0;
  let semanticScore = simulateSemanticSimilarity(userAnswer, originalContent);
  let structureScore = simulateStructureScore(userAnswer, originalContent);
  let totalScore = keywordScore * 0.4 + semanticScore * 0.4 + structureScore * 0.2;
  let stars = totalScore >= 0.9 ? 3 : totalScore >= 0.7 ? 2 : totalScore >= 0.5 ? 1 : 0;
  return {
    totalScore: Math.round(totalScore * 100),
    keywordScore: Math.round(keywordScore * 100),
    semanticScore: Math.round(semanticScore * 100),
    structureScore: Math.round(structureScore * 100),
    stars
  };
}

function simulateSemanticSimilarity(answer, original) {
  let originalChars = new Set(original.replace(/[，。、；：""''（）\s]/g, ''));
  let answerChars = new Set(answer.replace(/[，。、；：""''（）\s]/g, ''));
  let matchCount = 0;
  answerChars.forEach(c => { if (originalChars.has(c)) matchCount++; });
  return Math.min(1, matchCount / (originalChars.size || 1) + Math.random() * 0.1);
}

function simulateStructureScore(answer, original) {
  let sentences = answer.split(/[。！？；]/).filter(s => s.trim());
  let originalSentences = original.split(/[。！？；]/).filter(s => s.trim());
  return Math.min(1, sentences.length / (originalSentences.length || 1) + Math.random() * 0.1);
}

function updateHP(change) {
  state.challengeState.hp = Math.max(0, Math.min(100, state.challengeState.hp + change));
  updateHPBar();
}

function updateHPBar() {
  const hpBar = document.querySelector('.hp-bar-fill');
  if (hpBar) {
    hpBar.style.width = state.challengeState.hp + '%';
    hpBar.className = 'hp-bar-fill ' + (state.challengeState.hp <= 40 ? 'hp-red' : state.challengeState.hp <= 70 ? 'hp-yellow' : 'hp-green');
  }
  const hpFills = document.querySelectorAll('.hp-fill');
  hpFills.forEach(fill => {
    fill.style.width = state.challengeState.hp + '%';
  });
}

function updateCombo(correct) {
  if (correct) {
    state.challengeState.combo++;
    showComboIndicator(state.challengeState.combo);
  } else {
    state.challengeState.combo = 0;
  }
}

function showComboIndicator(combo) {
  if (combo >= 2) {
    showFloatingText(`x${combo} 连击！`);
  }
}

function showFloatingText(text) {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);font-size:24px;font-weight:bold;color:#7C5CFC;z-index:9999;pointer-events:none;animation:floatUp 1s ease-out forwards;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function showMembershipModal() {
  const card = document.getElementById('membership-card');
  const success = document.getElementById('membership-success');
  if (card) card.style.display = '';
  if (success) success.style.display = 'none';
  document.getElementById('membership-modal').classList.add('active');
  selectPlan(state.selectedPlan);
  updateMembershipUI();
}

function closeMembershipModal() {
  document.getElementById('membership-modal').classList.remove('active');
}

const planConfig = {
  monthly: { name: '月卡会员', price: '¥19.9', months: 1 },
  quarterly: { name: '季卡会员', price: '¥49.9', months: 3 },
  yearly: { name: '年卡会员', price: '¥149.9', months: 12 }
};

function selectPlan(plan) {
  state.selectedPlan = plan || state.selectedPlan;
  document.querySelectorAll('.plan-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.plan === state.selectedPlan);
  });
  const ctaPrice = document.getElementById('cta-price');
  if (ctaPrice) ctaPrice.textContent = planConfig[state.selectedPlan].price;
}

function confirmPurchase() {
  if (state.user.isMember) {
    showToast('你已经是会员啦！');
    closeMembershipModal();
    return;
  }
  const ctaBtn = document.getElementById('membership-cta');
  if (ctaBtn) {
    ctaBtn.disabled = true;
    ctaBtn.innerHTML = '<span class="cta-text">支付中</span><span class="cta-loading"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span>';
  }
  setTimeout(() => {
    state.user.isMember = true;
    state.user.membership.plan = state.selectedPlan;
    const now = new Date();
    state.user.membership.startDate = now.toISOString().split('T')[0];
    const expire = new Date(now);
    expire.setMonth(expire.getMonth() + planConfig[state.selectedPlan].months);
    state.user.membership.endDate = expire.toISOString().split('T')[0];
    state.user.dailyQuota = { recite: -1, quiz: -1, aiChat: -1, challenge: -1 };
    showPurchaseSuccess();
    updateMembershipUI();
  }, 1800);
}

function showPurchaseSuccess() {
  const card = document.getElementById('membership-card');
  const success = document.getElementById('membership-success');
  if (card) card.style.display = 'none';
  if (success) {
    success.style.display = '';
    const planName = document.getElementById('success-plan');
    const planExpire = document.getElementById('success-expire');
    if (planName) planName.textContent = planConfig[state.selectedPlan].name;
    if (planExpire) {
      const d = new Date(state.user.membership.endDate);
      planExpire.textContent = '有效期至 ' + d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }
  }
}

function updateMembershipUI() {
  document.querySelectorAll('.membership-badge').forEach(badge => {
    if (state.user.isMember) {
      badge.textContent = '会员';
      badge.className = 'membership-badge vip';
    } else {
      badge.textContent = '免费版';
      badge.className = 'membership-badge free';
    }
  });
  document.querySelectorAll('.vip-tag').forEach(tag => {
    if (state.user.isMember) tag.style.display = 'none';
  });
  document.querySelectorAll('.theme-card.locked').forEach(card => {
    if (state.user.isMember) {
      card.classList.remove('locked');
      card.classList.add('unlocked');
    }
  });
}

function showBottomSheet(content) {
  const overlay = document.getElementById('bottom-sheet');
  const body = document.getElementById('bottom-sheet-body');
  if (body) body.innerHTML = content;
  overlay.classList.add('active');
}

function closeBottomSheet() {
  document.getElementById('bottom-sheet').classList.remove('active');
}

function showToast(message, type) {
  type = type || 'success';
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  const app = document.getElementById('app');
  if (app) app.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function nextOnboardingStep() {
  state.onboardingStep++;
  if (state.onboardingStep >= 3) {
    navigateTo('page-books');
  } else {
    updateOnboardingSlide();
  }
}

function skipOnboarding() {
  navigateTo('page-books');
}

function updateOnboardingSlide() {
  const carousel = document.getElementById('onboarding-carousel');
  if (carousel) {
    carousel.style.transform = `translateX(-${state.onboardingStep * 100}%)`;
  }
  document.querySelectorAll('.onboarding-step').forEach((step, i) => {
    step.classList.toggle('active', i === state.onboardingStep);
  });
  document.querySelectorAll('.onboarding-dots .dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === state.onboardingStep);
  });
  const nextBtn = document.getElementById('onboarding-next');
  if (nextBtn) {
    nextBtn.textContent = state.onboardingStep === 2 ? '开始使用' : '下一步';
  }
}

function onPageEnter(pageId, params) {
  switch (pageId) {
    case 'page-challenge-fill':
      initFillChallenge();
      break;
    case 'page-challenge-recite':
      initReciteChallenge();
      break;
    case 'page-challenge-blind':
      initBlindChallenge();
      break;
    case 'page-challenge-reorder':
      initReorderChallenge();
      break;
    case 'page-challenge-result':
      displayChallengeResult(params);
      break;
    case 'page-challenge-hall':
      renderChallengeHall();
      break;
    case 'page-voice':
      initVoicePage();
      break;
    case 'page-ai':
      initAIChat();
      break;
    case 'page-data':
      renderCalendar();
      break;
    case 'page-onboarding':
      updateOnboardingSlide();
      break;
    default:
      break;
  }
}

function initFillChallenge() {
  const kp = knowledgePoints[0];
  const textEl = document.querySelector('#page-challenge-fill .challenge-text');
  if (textEl) {
    let html = '<p>' + kp.content.replace(/社会意识形态/g, '<span class="blank-slot"><input type="text" class="blank-input inline"></span>').replace(/上层建筑/g, '<span class="blank-slot"><input type="text" class="blank-input inline"></span>') + '</p>';
    textEl.innerHTML = html;
  }
  const timeLimit = 60;
  startTimer(timeLimit, (seconds) => {
    updateTimerDisplay(seconds);
  }, () => {
    submitChallengeFill();
  });
  updateTimerDisplay(timeLimit);
}

function initReciteChallenge() {
  const readingPhase = document.getElementById('reading-phase');
  const recitingPhase = document.getElementById('reciting-phase');
  if (readingPhase) readingPhase.style.display = '';
  if (recitingPhase) recitingPhase.style.display = 'none';
  let readingCountdown = 30;
  const countdownEl = document.getElementById('reading-countdown-num');
  startTimer(30, (seconds) => {
    if (countdownEl) countdownEl.textContent = seconds;
    if (seconds <= 0) {
      if (readingPhase) readingPhase.style.display = 'none';
      if (recitingPhase) recitingPhase.style.display = '';
      stopTimer();
      startTimer(90, (s) => {
        updateTimerDisplay(s);
      }, () => {
        submitChallengeRecite();
      });
      updateTimerDisplay(90);
    }
  }, () => {});
}

function initBlindChallenge() {
  const kp = knowledgePoints[0];
  const titleEl = document.querySelector('#page-challenge-blind .blind-title h3');
  if (titleEl) titleEl.textContent = '请背诵：' + kp.title;
  startTimer(60, (seconds) => {
    updateTimerDisplay(seconds);
  }, () => {
    submitChallengeBlind();
  });
  updateTimerDisplay(60);
}

function initReorderChallenge() {
  const kp = knowledgePoints[0];
  const sentences = kp.content.split(/[，。；]/).filter(s => s.trim());
  const shuffled = shuffleArray(sentences);
  const listEl = document.getElementById('reorder-list');
  if (listEl) {
    listEl.innerHTML = '';
    shuffled.forEach((text, i) => {
      const item = document.createElement('div');
      item.className = 'reorder-item drag-item';
      item.draggable = true;
      item.dataset.index = i;
      item.innerHTML = `<svg class="drag-handle" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg><span class="reorder-number">${i + 1}</span><span class="reorder-text">${text}</span>`;
      listEl.appendChild(item);
    });
    initDragAndDrop();
  }
  startTimer(60, (seconds) => {
    updateTimerDisplay(seconds);
  }, () => {
    submitReorder();
  });
  updateTimerDisplay(60);
}

function shuffleArray(arr) {
  let shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function initDragAndDrop() {
  const container = document.querySelector('.reorder-list');
  if (!container) return;
  let dragItem = null;
  container.addEventListener('dragstart', (e) => {
    dragItem = e.target.closest('.drag-item');
    if (dragItem) dragItem.classList.add('dragging');
  });
  container.addEventListener('dragend', (e) => {
    if (dragItem) dragItem.classList.remove('dragging');
    dragItem = null;
    container.querySelectorAll('.reorder-item').forEach((item, i) => {
      const numEl = item.querySelector('.reorder-number');
      if (numEl) numEl.textContent = i + 1;
    });
  });
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    if (dragItem) {
      if (afterElement) {
        container.insertBefore(dragItem, afterElement);
      } else {
        container.appendChild(dragItem);
      }
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.drag-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function displayChallengeResult(params) {
  if (!params) return;
  const starsEl = document.querySelector('#page-challenge-result .result-stars');
  if (starsEl) {
    let starsHtml = '';
    for (let i = 0; i < 3; i++) {
      const fill = i < params.stars ? '#FFD700' : '#ddd';
      starsHtml += `<svg width="48" height="48" viewBox="0 0 24 24" fill="${fill}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
    starsEl.innerHTML = starsHtml;
  }
  const dimsEl = document.querySelector('#page-challenge-result .score-dimensions');
  if (dimsEl) {
    dimsEl.innerHTML = `
      <div class="dimension-item"><span class="dimension-label">关键词匹配</span><div class="dimension-bar"><div class="dimension-fill" style="width:${params.keywordScore}%"></div></div><span class="dimension-value">${params.keywordScore}%</span></div>
      <div class="dimension-item"><span class="dimension-label">语义相似度</span><div class="dimension-bar"><div class="dimension-fill" style="width:${params.semanticScore}%"></div></div><span class="dimension-value">${params.semanticScore}%</span></div>
      <div class="dimension-item"><span class="dimension-label">结构完整度</span><div class="dimension-bar"><div class="dimension-fill" style="width:${params.structureScore}%"></div></div><span class="dimension-value">${params.structureScore}%</span></div>`;
  }
  const pointsEl = document.querySelector('#page-challenge-result .points-value');
  if (pointsEl) pointsEl.textContent = '+' + Math.round(params.totalScore * 1.2);
  const hpEl = document.querySelector('#page-challenge-result .hp-value');
  if (hpEl) {
    const hpChange = params.totalScore >= 50 ? Math.floor(Math.random() * 11) + 5 : -(Math.floor(Math.random() * 16) + 5);
    hpEl.textContent = (hpChange >= 0 ? '+' : '') + hpChange;
    hpEl.className = 'hp-value ' + (hpChange >= 0 ? 'positive' : 'negative');
  }
  if (params.stars >= 2) {
    const achEl = document.getElementById('achievement-unlock');
    if (achEl) achEl.style.display = '';
  }
}

function renderChallengeHall() {
  const totalStars = state.challengeState.levels.reduce((sum, l) => sum + l.bestStars, 0);
  const maxStars = state.challengeState.totalLevels * 3;
  const starsEl = document.querySelector('#page-challenge-hall .total-stars');
  if (starsEl) starsEl.textContent = `⭐ ${totalStars}/${maxStars}`;
}

let isRecording = false;
let voiceTimerInterval = null;
let voiceSeconds = 0;

function initVoicePage() {
  isRecording = false;
  voiceSeconds = 0;
  const btn = document.getElementById('mic-button');
  if (btn) btn.classList.remove('recording');
  const statusEl = document.getElementById('voice-status');
  if (statusEl) statusEl.textContent = '点击开始';
  const timerEl = document.getElementById('voice-timer');
  if (timerEl) timerEl.textContent = '00:00';
  clearInterval(voiceTimerInterval);
}

function toggleRecording() {
  isRecording = !isRecording;
  const btn = document.getElementById('mic-button');
  if (btn) btn.classList.toggle('recording', isRecording);
  const statusEl = document.getElementById('voice-status');
  if (isRecording) {
    showToast('开始录音...');
    if (statusEl) statusEl.textContent = '录音中...';
    voiceTimerInterval = setInterval(() => {
      voiceSeconds++;
      const timerEl = document.getElementById('voice-timer');
      if (timerEl) timerEl.textContent = formatTime(voiceSeconds);
    }, 1000);
  } else {
    showToast('录音结束');
    if (statusEl) statusEl.textContent = '录音完成';
    clearInterval(voiceTimerInterval);
    simulateVoiceResult();
  }
}

function simulateVoiceResult() {
  const kp = knowledgePoints[0];
  const textarea = document.getElementById('voice-result');
  if (textarea) {
    textarea.value = kp.content.substring(0, Math.floor(kp.content.length * 0.7)) + '...';
  }
}

function finishVoiceRecording() {
  if (isRecording) {
    isRecording = false;
    clearInterval(voiceTimerInterval);
    const btn = document.getElementById('mic-button');
    if (btn) btn.classList.remove('recording');
  }
  simulateVoiceResult();
  showToast('语音背诵已提交');
  navigateTo('page-recall-result');
}

const aiResponses = [
  '这个概念可以从三个维度理解：1) 本质层面——它是什么；2) 功能层面——它有什么作用；3) 历史层面——它是如何发展的。',
  '记忆口诀：想一个谐音联想，把关键词串成一句话。比如"社上经反"可以联想为"社上经反"→"社会上层经济反作用"。',
  '这个知识点容易和XX混淆，区别在于：前者强调的是本质属性，后者强调的是功能表现。',
  '建议用思维导图的方式整理这个章节的结构，先画主干，再画分支，最后填充细节。',
  '你的薄弱点在XXX，建议重点复习这部分。可以通过遮挡回忆和逆向背诵来强化记忆。'
];

function initAIChat() {
  const quotaEl = document.getElementById('ai-quota');
  if (quotaEl) {
    const remaining = state.user.dailyQuota.aiChat - state.user.dailyUsed.aiChat;
    quotaEl.textContent = remaining;
  }
}

function sendAiMessage() {
  const input = document.getElementById('ai-input');
  if (!input || !input.value.trim()) return;
  if (state.user.dailyUsed.aiChat >= state.user.dailyQuota.aiChat) {
    showToast('今日AI对话次数已用完', 'error');
    return;
  }
  addChatMessage(input.value, 'user');
  input.value = '';
  state.user.dailyUsed.aiChat++;
  initAIChat();
  setTimeout(() => {
    const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    addChatMessage(response, 'ai');
  }, 1000);
}

function addChatMessage(text, type) {
  const container = document.querySelector('.chat-messages');
  if (!container) return;
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;
  msg.appendChild(bubble);
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function aiAction(action) {
  const actionMessages = {
    mnemonic: '请帮我生成一个关于"艺术本质论"的记忆口诀',
    explain: '请解释"社会意识形态"这个概念',
    technique: '请给我一些背诵"艺术的社会功能"的技巧',
    analyze: '请分析我最近的错题情况'
  };
  const input = document.getElementById('ai-input');
  if (input) {
    input.value = actionMessages[action] || '';
  }
  sendAiMessage();
}

const quizData = {
  choice: [
    { question: '艺术最本质的社会功能是？', options: ['认知功能', '教育功能', '审美功能', '娱乐功能'], answer: 2 },
    { question: '马克思主义认为艺术的根源是？', options: ['人类天赋', '社会生活', '宗教信仰', '自然模仿'], answer: 1 },
    { question: '包豪斯的设计理念是？', options: ['形式追随功能', '艺术与技术的新统一', '少即是多', '装饰即罪恶'], answer: 1 }
  ],
  fill: [
    { question: '艺术是一种特殊的______', answer: '社会意识形态' },
    { question: '工艺美术运动的倡导者是______', answer: '威廉·莫里斯' },
    { question: '包豪斯的基础课包括平面构成、色彩构成和______', answer: '立体构成' }
  ]
};

let currentQuizIndex = 0;
let quizScore = 0;
let quizTimerInterval = null;

function selectOption(el, letter) {
  const options = el.parentElement.querySelectorAll('.option-card');
  options.forEach(opt => opt.classList.remove('selected', 'correct', 'wrong'));
  el.classList.add('selected');
  const currentQuiz = quizData.choice[currentQuizIndex];
  if (!currentQuiz) return;
  const letterMap = { A: 0, B: 1, C: 2, D: 3 };
  const selectedIndex = letterMap[letter];
  if (selectedIndex === currentQuiz.answer) {
    el.classList.add('correct');
    quizScore++;
  } else {
    el.classList.add('wrong');
    options[currentQuiz.answer].classList.add('correct');
  }
  setTimeout(() => {
    nextQuizQuestion();
  }, 1500);
}

function nextQuizQuestion() {
  currentQuizIndex++;
  if (currentQuizIndex >= quizData.choice.length) {
    navigateTo('page-quiz-result');
    return;
  }
  const quiz = quizData.choice[currentQuizIndex];
  const questionEl = document.querySelector('#page-quiz-choice .quiz-question p');
  if (questionEl) questionEl.textContent = quiz.question;
  const optionsEl = document.querySelector('#page-quiz-choice .quiz-options');
  if (optionsEl) {
    const letters = ['A', 'B', 'C', 'D'];
    optionsEl.innerHTML = quiz.options.map((opt, i) =>
      `<div class="option-card" onclick="selectOption(this, '${letters[i]}')"><span class="option-letter">${letters[i]}</span><span class="option-text">${opt}</span></div>`
    ).join('');
  }
  const progressEl = document.querySelector('#page-quiz-choice .quiz-progress');
  if (progressEl) progressEl.textContent = `${currentQuizIndex + 1}/${quizData.choice.length}`;
  const progressBar = document.querySelector('#page-quiz-choice .progress-fill');
  if (progressBar) progressBar.style.width = `${((currentQuizIndex + 1) / quizData.choice.length) * 100}%`;
}

function submitFillAnswer() {
  const input = document.querySelector('#page-quiz-fill .fill-input');
  if (!input) return;
  const currentFill = quizData.fill[currentQuizIndex % quizData.fill.length];
  if (input.value.trim() === currentFill.answer) {
    quizScore++;
    showToast('回答正确！');
  } else {
    showToast('回答错误，正确答案：' + currentFill.answer, 'error');
  }
  currentQuizIndex++;
  setTimeout(() => {
    if (currentQuizIndex >= quizData.choice.length + quizData.fill.length) {
      navigateTo('page-quiz-result');
    } else {
      nextQuizQuestion();
    }
  }, 1500);
}

function skipQuizQuestion() {
  currentQuizIndex++;
  if (currentQuizIndex >= quizData.choice.length) {
    navigateTo('page-quiz-result');
  } else {
    nextQuizQuestion();
  }
}

function renderCalendar() {
  const gridEl = document.querySelector('#checkin-calendar .calendar-grid');
  if (!gridEl) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const checkedDays = new Set();
  for (let d = 1; d < today; d++) {
    if (Math.random() > 0.3) checkedDays.add(d);
  }
  checkedDays.add(today);
  let html = '<div class="cal-header">';
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  weekDays.forEach(w => { html += `<span class="cal-weekday">${w}</span>`; });
  html += '</div><div class="cal-body">';
  for (let i = 0; i < firstDay; i++) {
    html += '<span class="cal-day empty"></span>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    let cls = 'cal-day';
    if (d === today) cls += ' today';
    if (checkedDays.has(d)) cls += ' checked';
    html += `<span class="${cls}">${d}</span>`;
  }
  html += '</div>';
  gridEl.innerHTML = html;
}

function getReviewItems() {
  return {
    time: knowledgePoints.filter(kp => {
      const nextReview = new Date(kp.nextReview);
      return nextReview <= new Date();
    }),
    error: knowledgePoints.filter(kp => kp.errorCount >= 3),
    structure: knowledgePoints.filter(kp => kp.hp <= 50),
    random: shuffleArray(knowledgePoints).slice(0, 3)
  };
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplay(seconds) {
  document.querySelectorAll('.timer-text').forEach(el => {
    el.textContent = formatTime(seconds);
  });
  document.querySelectorAll('.timer-ring circle:nth-child(2)').forEach(circle => {
    const circumference = parseFloat(circle.getAttribute('stroke-dasharray')) || 126;
    const offset = circumference * (1 - seconds / 120);
    circle.setAttribute('stroke-dashoffset', Math.max(0, offset));
  });
}

function updateExamCountdown() {
  const examDate = new Date('2026-12-25');
  const today = new Date();
  const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
  document.querySelectorAll('.countdown-number').forEach(el => {
    el.textContent = diff;
  });
}

function toggleNode(el) {
  const node = el.closest('.tree-node');
  if (!node) return;
  const children = node.querySelector('.node-children');
  if (!children) return;
  const isExpanded = node.classList.contains('expanded');
  if (isExpanded) {
    node.classList.remove('expanded');
    children.style.display = 'none';
  } else {
    node.classList.add('expanded');
    children.style.display = '';
  }
}

function showHint() {
  showToast('首字提示：社、意、上、经、反');
}

function submitStructureAnswer() {
  const inputs = document.querySelectorAll('#page-structure-practice .blank-input');
  let allFilled = true;
  inputs.forEach(input => {
    if (!input.value.trim()) allFilled = false;
  });
  if (!allFilled) {
    showToast('请填写所有空格', 'error');
    return;
  }
  const kp = knowledgePoints[0];
  let userAnswer = Array.from(inputs).map(i => i.value).join('，');
  const result = calculateScore(userAnswer, kp.content, kp.keywords);
  showToast(`得分：${result.totalScore}分`);
  navigateTo('page-recall-result');
}

function submitRecallAnswer() {
  const inputs = document.querySelectorAll('#page-recall .blank-input');
  let userAnswer = '';
  if (inputs.length > 0) {
    userAnswer = Array.from(inputs).map(i => i.value).join('，');
  }
  const kp = knowledgePoints[0];
  const result = calculateScore(userAnswer, kp.content, kp.keywords);
  navigateTo('page-recall-result', result);
}

function showFullHint() {
  const kp = knowledgePoints[0];
  const textarea = document.querySelector('#page-recall-hint textarea');
  if (textarea) {
    textarea.value = kp.content.substring(0, Math.floor(kp.content.length * 0.5));
  }
}

function submitHintAnswer() {
  const textarea = document.querySelector('#page-recall-hint textarea');
  if (!textarea || !textarea.value.trim()) {
    showToast('请输入答案', 'error');
    return;
  }
  const kp = knowledgePoints[0];
  const result = calculateScore(textarea.value, kp.content, kp.keywords);
  navigateTo('page-recall-result', result);
}

function nextKnowledgePoint() {
  const nextKp = knowledgePoints[Math.floor(Math.random() * knowledgePoints.length)];
  state.currentKnowledge = nextKp;
  showToast('切换到：' + nextKp.title);
  navigateTo('page-recall');
}

function submitReverseAnswer() {
  const textarea = document.querySelector('#page-reverse textarea');
  if (!textarea || !textarea.value.trim()) {
    showToast('请输入论证过程', 'error');
    return;
  }
  const kp = knowledgePoints[0];
  const result = calculateScore(textarea.value, kp.content, kp.keywords);
  navigateTo('page-reverse-result', result);
}

function addKeyword() {
  const chips = document.querySelector('#page-keyword .keyword-chips');
  if (!chips) return;
  const newChip = document.createElement('span');
  newChip.className = 'keyword-chip';
  newChip.contentEditable = true;
  newChip.textContent = '新关键词';
  chips.appendChild(newChip);
  newChip.focus();
}

function submitKeywordAnswer() {
  const textarea = document.querySelector('#page-keyword textarea');
  if (!textarea || !textarea.value.trim()) {
    showToast('请输入内容', 'error');
    return;
  }
  const kp = knowledgePoints[0];
  const result = calculateScore(textarea.value, kp.content, kp.keywords);
  navigateTo('page-keyword-result', result);
}

function showOriginalText() {
  const kp = knowledgePoints[0];
  showBottomSheet(`<div style="padding:16px;"><h4>原文</h4><p>${kp.content}</p></div>`);
}

function switchSceneTab(tab) {
  document.querySelectorAll('.scene-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.scene-tab').forEach(t => {
    if (t.textContent === tab) t.classList.add('active');
  });
  const contentEl = document.querySelector('.scene-content p');
  if (!contentEl) return;
  const scenes = {
    '比喻': '想象经济基础是地基，上层建筑是房子。艺术就是房子里的装饰画——它由地基支撑，但装饰画也能让房子更有价值，吸引更多人来看，从而让地基更稳固。',
    '故事': '从前有个叫"艺术"的年轻人，他住在"上层建筑"大厦里，每天的工作是反映"社会生活"。他的工资来自"经济基础"公司，虽然他不直接生产商品，但他的作品让公司更有文化底蕴。',
    '案例': '文艺复兴时期的艺术繁荣，根源于意大利城市商品经济的发展。经济基础的变化催生了新兴资产阶级，他们需要新的文化来表达自己的价值观，从而推动了艺术的变革。',
    '图像': '想象一棵树：根系是经济基础，树干是上层建筑，枝叶是艺术。根系为整棵树提供养分，枝叶虽然不直接吸收养分，但通过光合作用让树更健康。'
  };
  contentEl.textContent = scenes[tab] || scenes['比喻'];
}

function regenerateScene() {
  showToast('正在生成新场景...');
  setTimeout(() => {
    switchSceneTab('比喻');
    showToast('新场景已生成');
  }, 800);
}

function favoriteScene() {
  showToast('已收藏');
}

function submitChallengeFill() {
  stopTimer();
  const kp = knowledgePoints[0];
  const inputs = document.querySelectorAll('#page-challenge-fill .blank-input');
  let userAnswer = '';
  if (inputs.length > 0) {
    userAnswer = Array.from(inputs).map(i => i.value).join('，');
  }
  const result = calculateScore(userAnswer, kp.content, kp.keywords);
  const correct = result.totalScore >= 50;
  updateCombo(correct);
  if (correct) {
    updateHP(Math.floor(Math.random() * 11) + 5);
  } else {
    updateHP(-(Math.floor(Math.random() * 16) + 5));
  }
  navigateTo('page-challenge-result', result);
}

function showChallengeHint() {
  const kp = knowledgePoints[0];
  showToast('提示：' + kp.keywords[0]);
}

function submitChallengeRecite() {
  stopTimer();
  const kp = knowledgePoints[0];
  const textarea = document.querySelector('#page-challenge-recite textarea');
  let userAnswer = textarea ? textarea.value : '';
  const result = calculateScore(userAnswer, kp.content, kp.keywords);
  const correct = result.totalScore >= 50;
  updateCombo(correct);
  if (correct) {
    updateHP(Math.floor(Math.random() * 11) + 5);
  } else {
    updateHP(-(Math.floor(Math.random() * 16) + 5));
  }
  navigateTo('page-challenge-result', result);
}

function submitChallengeBlind() {
  stopTimer();
  const kp = knowledgePoints[0];
  const textarea = document.querySelector('#page-challenge-blind textarea');
  let userAnswer = textarea ? textarea.value : '';
  const result = calculateScore(userAnswer, kp.content, kp.keywords);
  const correct = result.totalScore >= 50;
  updateCombo(correct);
  if (correct) {
    updateHP(Math.floor(Math.random() * 11) + 5);
  } else {
    updateHP(-(Math.floor(Math.random() * 16) + 5));
  }
  navigateTo('page-challenge-result', result);
}

function submitReorder() {
  stopTimer();
  const kp = knowledgePoints[0];
  const items = document.querySelectorAll('#reorder-list .reorder-item');
  let userAnswer = Array.from(items).map(item => {
    const textEl = item.querySelector('.reorder-text');
    return textEl ? textEl.textContent : '';
  }).join('，');
  const result = calculateScore(userAnswer, kp.content, kp.keywords);
  const correct = result.totalScore >= 50;
  updateCombo(correct);
  if (correct) {
    updateHP(Math.floor(Math.random() * 11) + 5);
  } else {
    updateHP(-(Math.floor(Math.random() * 16) + 5));
  }
  navigateTo('page-challenge-result', result);
}

function nextChallengeLevel() {
  const currentLevel = state.challengeState.currentLevel;
  const nextLevel = state.challengeState.levels.find(l => l.levelId > currentLevel && l.levelId <= state.challengeState.unlockedUpTo);
  if (nextLevel) {
    startChallenge(nextLevel.type, nextLevel.levelId);
  } else {
    showToast('恭喜！已通过所有已解锁关卡');
    navigateTo('page-challenge-hall');
  }
}

function switchChapter(index) {
  document.querySelectorAll('.chapter-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });
}

function switchRankTab(tab) {
  document.querySelectorAll('.rank-tab').forEach(t => {
    t.classList.toggle('active', t.textContent === (tab === 'friends' ? '好友' : '全服'));
  });
}

function inviteFriend() {
  showToast('邀请链接已复制到剪贴板');
}

function quickMatch() {
  showToast('正在匹配对手...');
  setTimeout(() => {
    state.battleState.opponent = { name: 'Luna', avatar: 'L', color: '#7C5CFC' };
    state.battleState.myScore = 0;
    state.battleState.opponentScore = 0;
    state.battleState.currentRound = 1;
    navigateTo('page-battle-arena');
  }, 2000);
}

function shareRoom() {
  showToast('邀请已分享');
}

function cancelBattle() {
  goBack();
}

function shareBattleResult() {
  showToast('结果已分享');
}

function switchPeriod(period) {
  document.querySelectorAll('.period-tab').forEach(t => {
    t.classList.toggle('active', t.textContent === (period === 'week' ? '本周' : period === 'month' ? '本月' : '总计'));
  });
}

function filterBooks(category) {
  document.querySelectorAll('#page-books-list .chip').forEach(c => {
    c.classList.toggle('active', c.textContent === category);
  });
}

function toggleFilter() {
  showBottomSheet('<div style="padding:16px;"><h4>筛选</h4><p>按进度、掌握度、最近学习时间筛选</p></div>');
}

function startImport(type) {
  if (type === 'cloud') {
    showToast('云盘同步即将上线', 'error');
    return;
  }
  if (type === 'ai') {
    showToast('AI智能提取中...');
    setTimeout(() => {
      showToast('已提取 3 个知识点');
    }, 1500);
    return;
  }
  if (type === 'camera') {
    showToast('正在打开相机...');
    return;
  }
  if (type === 'file') {
    showToast('请选择文件...');
    return;
  }
  if (type === 'preset') {
    navigateTo('page-books-list');
    return;
  }
  showToast('请输入内容');
}

function filterDNA(filter) {
  document.querySelectorAll('#page-dna .chip').forEach(c => {
    c.classList.toggle('active', c.textContent === filter);
  });
}

function filterHeatmap(filter) {
  document.querySelectorAll('#page-heatmap .chip').forEach(c => {
    c.classList.toggle('active', c.textContent === filter);
  });
}

function startReview(type) {
  const reviewItems = getReviewItems();
  const items = reviewItems[type] || reviewItems.random;
  if (items.length === 0) {
    showToast('暂无需要复习的内容');
    return;
  }
  state.currentKnowledge = items[0];
  showToast(`开始${type === 'time' ? '时间' : type === 'wrong' ? '错题' : type === 'structure' ? '结构' : '随机'}复习`);
  navigateTo('page-recall');
}

function selectTheme(theme) {
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  const themeCard = document.querySelector(`.theme-card[onclick="selectTheme('${theme}')"]`);
  if (themeCard) themeCard.classList.add('active');
}

function applyTheme() {
  showToast('主题已应用');
}

function selectQuality(quality) {
  document.querySelectorAll('#page-voice-settings .selector-group:first-child .selector-option').forEach(opt => {
    opt.classList.toggle('active', opt.textContent === (quality === 'low' ? '低' : quality === 'medium' ? '中' : '高'));
  });
}

function selectLanguage(lang) {
  document.querySelectorAll('#page-voice-settings .selector-group:last-of-type .selector-option').forEach(opt => {
    opt.classList.toggle('active', opt.textContent === (lang === 'zh' ? '中文' : 'English'));
  });
}

function testRecording() {
  showToast('正在测试录音...');
  setTimeout(() => showToast('录音质量良好'), 1500);
}

function syncNow() {
  showToast('正在同步...');
  setTimeout(() => showToast('同步完成'), 1500);
}

function restoreData() {
  showToast('正在恢复数据...');
  setTimeout(() => showToast('数据已恢复'), 1500);
}

function exportData() {
  showToast('数据导出中...');
  setTimeout(() => showToast('导出完成'), 1500);
}

function clearCache() {
  showToast('缓存已清除');
}

function showDailyGoal() {
  showBottomSheet('<div style="padding:16px;"><h4>每日目标</h4><p>背诵：10个知识点</p><p>检测：1次</p><p>闯关：5关</p></div>');
}

function showReminderTime() {
  showBottomSheet('<div style="padding:16px;"><h4>提醒时间</h4><p>早：08:00</p><p>午：13:00</p><p>晚：21:00</p></div>');
}

function filterAchievement(category) {
  document.querySelectorAll('.ach-category').forEach(c => {
    c.classList.toggle('active', c.textContent === category);
  });
}

function selectFeedbackCat(category) {
  document.querySelectorAll('.feedback-cat').forEach(c => {
    c.classList.toggle('active', c.textContent === category);
  });
}

function uploadFeedbackImage() {
  showToast('请选择图片...');
}

function submitFeedback() {
  const textarea = document.querySelector('#page-feedback textarea');
  if (!textarea || !textarea.value.trim()) {
    showToast('请填写反馈内容', 'error');
    return;
  }
  showToast('感谢你的反馈！');
  goBack();
}

function toggleFaq(el) {
  const answer = el.querySelector('.faq-answer');
  const icon = el.querySelector('.faq-question svg');
  if (!answer) return;
  if (answer.style.display === 'none') {
    answer.style.display = '';
    if (icon) icon.style.transform = 'rotate(90deg)';
  } else {
    answer.style.display = 'none';
    if (icon) icon.style.transform = '';
  }
}

function contactSupport() {
  showToast('客服微信号：Memora_Help');
}

function openLink(type) {
  showToast('正在打开' + (type === 'terms' ? '用户协议' : type === 'privacy' ? '隐私政策' : '开源许可'));
}

function sendCode() {
  const phoneInput = document.querySelector('#page-login input[type="tel"]');
  if (!phoneInput || !phoneInput.value.trim() || phoneInput.value.length < 11) {
    showToast('请输入正确的手机号', 'error');
    return;
  }
  const codeBtn = document.querySelector('.btn-code');
  if (codeBtn) {
    codeBtn.disabled = true;
    let countdown = 60;
    const originalText = codeBtn.textContent;
    codeBtn.textContent = `${countdown}s`;
    const interval = setInterval(() => {
      countdown--;
      codeBtn.textContent = `${countdown}s`;
      if (countdown <= 0) {
        clearInterval(interval);
        codeBtn.textContent = originalText;
        codeBtn.disabled = false;
      }
    }, 1000);
  }
  showToast('验证码已发送');
}

function login() {
  showToast('登录成功！');
  navigateTo('page-books');
}

function wechatLogin() {
  showToast('微信登录中...');
  setTimeout(() => {
    showToast('登录成功！');
    navigateTo('page-books');
  }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  updateExamCountdown();
  setInterval(updateExamCountdown, 86400000);
  updateMembershipUI();
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatUp {
      0% { opacity: 1; transform: translate(-50%, -50%); }
      100% { opacity: 0; transform: translate(-50%, -150%); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .cta-loading { display: inline-flex; align-items: center; }
    .cta-loading svg { animation: spin 1s linear infinite; }
    .toast { position: fixed; top: 60px; left: 50%; transform: translateX(-50%); padding: 10px 24px; border-radius: 20px; font-size: 14px; z-index: 10000; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
    .toast-success { background: rgba(16,185,129,0.9); color: white; }
    .toast-error { background: rgba(239,68,68,0.9); color: white; }
    .toast.show { opacity: 1; }
    .dragging { opacity: 0.5; }
  `;
  document.head.appendChild(style);
});
