/* ================================================================
   辽宁专升本 · 个人学习站 (app.js)
   第 1 版：纯原生 JavaScript，数据仅保存在浏览器 localStorage 中，
   不登录、不联网、不接后端、不需要任何构建工具。

   localStorage key 统一加前缀 lnzsb_：
   - lnzsb_settings   设置（考试日期等）
   - lnzsb_tasks      每日任务
   - lnzsb_mistakes   错题本
   - lnzsb_logs       学习日志
   ================================================================ */

/* ---------- 存储 key 前缀 ---------- */
const STORAGE_KEYS = {
  SETTINGS: 'lnzsb_settings',
  TASKS: 'lnzsb_tasks',
  MISTAKES: 'lnzsb_mistakes',
  LOGS: 'lnzsb_logs',
  PROFILE: 'lnzsb_profile'
};

/* 复习科目（与科目看板一致） */
const SUBJECTS = ['外语', '计算机', '高数/思政', '专业综合课', '技能考核'];

/* 智能规划：规则引擎推荐模板。
   结构：科目 -> 基础等级 -> 强度 -> 任务数组
   基础等级：zero(零基础) / some(有点印象) / good(比较熟练)
   强度：high(高) / medium(中) / low(低，由状态打卡与测试共同决定) */
const REC_TEMPLATES = {
  外语: {
    zero: {
      medium: [
        { title: '背核心单词', minutes: 30, content: '背30个核心单词（约30分钟）' },
        { title: '语法基础课', minutes: 45, content: '看1节语法基础课（约45分钟）' }
      ],
      high: [
        { title: '背核心单词', minutes: 40, content: '背50个核心单词（约40分钟）' },
        { title: '语法基础课', minutes: 90, content: '看2节语法基础课（约90分钟）' },
        { title: '听力训练', minutes: 15, content: '英语听力训练（约15分钟）' }
      ]
    },
    some: {
      medium: [
        { title: '背高频单词', minutes: 20, content: '背20个高频单词（约20分钟）' },
        { title: '语法练习', minutes: 35, content: '语法专项练习10题（约35分钟）' }
      ],
      high: [
        { title: '背高频单词', minutes: 35, content: '背40个高频单词（约35分钟）' },
        { title: '语法练习', minutes: 60, content: '语法专项练习20题（约60分钟）' },
        { title: '阅读短文', minutes: 30, content: '阅读一篇英语短文并翻译（约30分钟）' }
      ]
    },
    good: {
      medium: [
        { title: '背生词', minutes: 10, content: '背10个生词（约10分钟）' },
        { title: '语法复盘', minutes: 30, content: '语法知识点复盘（约30分钟）' }
      ],
      high: [
        { title: '背难点单词', minutes: 20, content: '背20个难点单词（约20分钟）' },
        { title: '阅读理解', minutes: 60, content: '做完整阅读理解2篇（约60分钟）' },
        { title: '写作练习', minutes: 40, content: '写一篇英语作文并修改（约40分钟）' }
      ]
    }
  },
  计算机: {
    zero: {
      medium: [
        { title: '基础课', minutes: 45, content: '看1节计算机基础课（约45分钟）' },
        { title: '复习术语', minutes: 20, content: '复习计算机关键术语（约20分钟）' }
      ],
      high: [
        { title: '基础理论', minutes: 60, content: '看1章计算机基础理论（约60分钟）' },
        { title: '选择题', minutes: 30, content: '做5道计算机基础选择题（约30分钟）' }
      ]
    },
    some: {
      medium: [
        { title: '重点章节', minutes: 40, content: '复习计算机重点章节（约40分钟）' },
        { title: '练习题', minutes: 30, content: '做10道计算机练习题（约30分钟）' }
      ],
      high: [
        { title: '操作系统/网络', minutes: 60, content: '复习操作系统与计算机网络重点（约60分钟）' },
        { title: '上机练习', minutes: 45, content: '计算机上机动手练习（约45分钟）' }
      ]
    },
    good: {
      medium: [
        { title: '部分真题', minutes: 60, content: '刷部分计算机真题（约60分钟）' }
      ],
      high: [
        { title: '真题2套', minutes: 90, content: '刷2套计算机真题（约90分钟）' },
        { title: '查漏补缺', minutes: 30, content: '查漏补缺薄弱知识点（约30分钟）' }
      ]
    }
  },
  '高数/思政': {
    zero: {
      medium: [
        { title: '基础课', minutes: 40, content: '看1节高数/思政基础课（约40分钟）' },
        { title: '复习公式', minutes: 20, content: '复习重点公式与知识点（约20分钟）' }
      ],
      high: [
        { title: '基础课', minutes: 50, content: '看1节高数/思政基础课（约50分钟）' },
        { title: '基础题', minutes: 40, content: '做5道基础巩固题（约40分钟）' }
      ]
    },
    some: {
      medium: [
        { title: '重点公式', minutes: 30, content: '复习重点公式与考点（约30分钟）' },
        { title: '练习题', minutes: 30, content: '做5道中等难度题（约30分钟）' }
      ],
      high: [
        { title: '重点章节', minutes: 50, content: '复习重点章节（约50分钟）' },
        { title: '计算题', minutes: 50, content: '做10道计算/分析题（约50分钟）' }
      ]
    },
    good: {
      medium: [
        { title: '部分真题', minutes: 60, content: '刷部分高数/思政真题（约60分钟）' }
      ],
      high: [
        { title: '真题1套', minutes: 90, content: '刷1套完整真题（约90分钟）' },
        { title: '错题回顾', minutes: 30, content: '回顾错题本中的易错点（约30分钟）' }
      ]
    }
  },
  '专业综合课': {
    zero: {
      medium: [
        { title: '看课', minutes: 40, content: '看1节专业综合课视频（约40分钟）' },
        { title: '整理知识点', minutes: 20, content: '整理当天学习的知识点（约20分钟）' }
      ],
      high: [
        { title: '看教材', minutes: 60, content: '看1章专业综合课教材（约60分钟）' },
        { title: '做笔记', minutes: 30, content: '做详细学习笔记（约30分钟）' }
      ]
    },
    some: {
      medium: [
        { title: '重点知识', minutes: 40, content: '复习专业综合课重点知识（约40分钟）' },
        { title: '练习题', minutes: 30, content: '做5道专业练习题（约30分钟）' }
      ],
      high: [
        { title: '重点章节', minutes: 60, content: '复习专业综合课重点章节（约60分钟）' },
        { title: '练习题', minutes: 40, content: '做专业综合课练习题（约40分钟）' }
      ]
    },
    good: {
      medium: [
        { title: '浏览笔记', minutes: 20, content: '快速浏览专业课笔记（约20分钟）' },
        { title: '部分真题', minutes: 40, content: '做部分专业课真题（约40分钟）' }
      ],
      high: [
        { title: '刷真题', minutes: 90, content: '刷专业综合课真题（约90分钟）' },
        { title: '查漏补缺', minutes: 30, content: '查漏补缺薄弱环节（约30分钟）' }
      ]
    }
  },
  '技能考核': {
    zero: {
      medium: [
        { title: '看考核要求', minutes: 20, content: '阅读技能考核要求与大纲（约20分钟）' },
        { title: '示范视频', minutes: 30, content: '观看技能考核示范视频（约30分钟）' }
      ],
      high: [
        { title: '看考核大纲', minutes: 30, content: '仔细阅读技能考核大纲（约30分钟）' },
        { title: '操作练习', minutes: 60, content: '练习考核操作步骤（约60分钟）' }
      ]
    },
    some: {
      medium: [
        { title: '重点操作', minutes: 60, content: '分步骤练习重点操作（约60分钟）' }
      ],
      high: [
        { title: '全流程模拟', minutes: 90, content: '进行全流程模拟考核（约90分钟）' },
        { title: '查漏补缺', minutes: 30, content: '查漏补缺操作细节（约30分钟）' }
      ]
    },
    good: {
      medium: [
        { title: '部分模拟', minutes: 60, content: '模拟考核部分环节（约60分钟）' }
      ],
      high: [
        { title: '限时模拟', minutes: 90, content: '限时模拟技能考核（约90分钟）' },
        { title: '全面复盘', minutes: 30, content: '全面复盘考核表现与不足（约30分钟）' }
      ]
    }
  }
};

/* 低强度通用推荐（精力疲惫或碎片时间时，所有科目共用） */
const LOW_INTENSITY_COMMON = [
  { title: '复习错题本', minutes: 15, content: '复习错题本（约15分钟）' },
  { title: 'AI提示词复盘', minutes: 10, content: '看AI提示词复盘（约10分钟）' }
];

/* 每日小测题目（5道通用题，对应5个科目方向） */
const QUIZ_QUESTIONS = [
  {
    q: '单词 "persist" 的意思是？',
    options: ['坚持', '放弃', '忽略', '遗忘'],
    answer: 0
  },
  {
    q: '内存（RAM）断电后数据会保留吗？',
    options: ['会保留', '不会保留'],
    answer: 1
  },
  {
    q: '函数 f(x)=x² 在 x=2 处的导数是多少？',
    options: ['2', '4', '0', '1'],
    answer: 0
  },
  {
    q: '复习专业课时，先看目录再看细节通常更高效。',
    options: ['是', '否'],
    answer: 0
  },
  {
    q: '技能考核前，是否需要提前准备所需工具或材料？',
    options: ['需要', '不需要'],
    answer: 0
  }
];

/* 内置 AI 提示词库（共 5 条） */
const DEFAULT_PROMPTS = [
  {
    title: '测水平',
    text: '我正在准备辽宁省专升本考试，复习科目是【科目】。请帮我出 10 道诊断题，涵盖基础、中级、难题各若干，每题给出选项和参考答案。我答完后，请根据我的答复评估我的水平，指出薄弱点和需要补强的章节。'
  },
  {
    title: '出题批改',
    text: '请根据【科目】的【知识点】出一道辽宁省专升本考试风格的题目，先只给出题目和作答要求，不要给答案。我作答完成后，请批改我的答案，指出错误，给出正确答案和详细解析，最后告诉我哪些知识点还没掌握。'
  },
  {
    title: '费曼复盘',
    text: '请用费曼技巧帮我复盘【科目】的【知识点】。请用通俗易懂的语言，假设我是零基础学生，分步骤讲解这个知识点，并举 2–3 个生活中的例子。最后请让我尝试用自己的话复述一遍，你再帮我检查并纠正表述中不准确的地方。'
  },
  {
    title: '制定3天计划',
    text: '我正在准备辽宁省专升本考试，复习科目是【科目】，还有 3 天复习时间，每天大约可投入 X 小时。请帮我制定一份详细的 3 天复习计划，每天包含：复习章节、重点知识点、练习题数量和难度、休息时间，并给出可执行的时间表与执行建议。'
  },
  {
    title: '整理知识框架',
    text: '请帮我整理辽宁省专升本【科目】的知识框架。请按以下层级列出：核心概念 → 重要知识点 → 常见考点 → 易错点 → 解题模板/套路。使用清晰的层级标题和项目符号，方便我快速复习和查漏补缺。'
  }
];

/* ---------- localStorage 读写工具 ---------- */
function load(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? defaultValue : JSON.parse(raw);
  } catch (e) {
    console.error('读取 localStorage 失败：', key, e);
    return defaultValue;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('保存 localStorage 失败：', key, e);
    showToast('保存失败，请检查浏览器是否允许本地存储');
  }
}

/* ---------- 应用状态（刷新后从 localStorage 恢复） ---------- */
const state = {
  settings: load(STORAGE_KEYS.SETTINGS, { examDate: '' }),
  tasks: load(STORAGE_KEYS.TASKS, []),
  mistakes: load(STORAGE_KEYS.MISTAKES, []),
  logs: load(STORAGE_KEYS.LOGS, []),
  profile: load(STORAGE_KEYS.PROFILE, {
    levels: {},
    goals: {},
    todayEnergy: '',
    todayTime: '',
    testPassed: true,
    testDate: ''
  })
};

/* 当前生成的推荐列表（供“加入今日任务”使用） */
let currentRecommendations = [];

/* ---------- 页面内轻提示（替代弹窗轰炸） ---------- */
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(message) {
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2000);
}

/* ---------- XSS 防护：把用户输入转义为安全的 HTML ---------- */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, ch => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[ch];
  });
}

/* ================================================================
   1. 考试倒计时（考试日期可编辑设置，默认“待定”）
   ================================================================ */
const countdownEl = document.getElementById('countdown');
const examDateInput = document.getElementById('examDate');

function updateCountdown() {
  const examDate = state.settings.examDate;
  if (!examDate) {
    countdownEl.textContent = '考试倒计时：待定';
    countdownEl.classList.add('pending');
    return;
  }
  countdownEl.classList.remove('pending');
  const now = new Date();
  const target = new Date(`${examDate}T00:00:00`);
  const diffMs = target - now;
  if (diffMs <= 0) {
    countdownEl.textContent = '考试日期已到，祝考试顺利！';
    return;
  }
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  countdownEl.textContent = `距离考试还有 ${days} 天 ${hours} 小时 ${minutes} 分钟`;
}

examDateInput.addEventListener('change', e => {
  state.settings.examDate = e.target.value;   // 用户选日期后立即存入 settings
  save(STORAGE_KEYS.SETTINGS, state.settings);
  updateCountdown();
  renderDashboard();
  showToast('考试日期已保存');
});

/* ================================================================
   2. 顶部导航：在 看板 / 任务 / 错题 / 日志 / 提示词 之间切换
   ================================================================ */
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

function showSection(sectionId) {
  sections.forEach(sec => sec.classList.remove('active'));
  navLinks.forEach(link => link.classList.toggle('active', link.dataset.section === sectionId));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add('active');
}

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

showSection('dashboard');      // 默认打开首页/看板
updateCountdown();
setInterval(updateCountdown, 1000); // 每秒刷新一次倒计时

/* ================================================================
   3. 科目看板：每个科目显示“今日任务数 / 已完成数”
   ================================================================ */
const subjectGrid = document.getElementById('subjectGrid');

function renderDashboard() {
  const today = new Date().toISOString().slice(0, 10); // 今天的日期，如 2026-11-17
  subjectGrid.innerHTML = '';
  SUBJECTS.forEach(subject => {
    const subjectTasks = state.tasks.filter(t => t.subject === subject && t.date === today);
    const total = subjectTasks.length;
    const done = subjectTasks.filter(t => t.done).length;
    const card = document.createElement('div');
    card.className = 'subject-card card';
    card.innerHTML = `
      <div class="subject-name">${escapeHtml(subject)}</div>
      <div class="subject-count"><span class="total">${total}</span> / <span class="done">${done}</span></div>
      <div class="subject-tip">今日任务 ${done}/${total} 已完成</div>
    `;
    subjectGrid.appendChild(card);
  });
}

/* ================================================================
   4. 每日任务：新增、勾选完成、删除；字段：科目、内容、日期
   ================================================================ */
const taskForm = document.getElementById('taskForm');
const taskSubjectSelect = document.getElementById('taskSubject');
const taskContentInput = document.getElementById('taskContent');
const taskDateInput = document.getElementById('taskDate');
const taskList = document.getElementById('taskList');
const taskEmptyTip = document.getElementById('taskEmptyTip');
const taskFilters = document.getElementById('taskFilters');

let currentTaskFilter = '全部'; // 当前筛选科目：全部 | 具体科目名

function initSubjectSelects() {
  // 给“任务”和“错题”的科目下拉框填选项
  [taskSubjectSelect, document.getElementById('mistakeSubject')].forEach(select => {
    SUBJECTS.forEach(subj => {
      const opt = document.createElement('option');
      opt.value = subj;
      opt.textContent = subj;
      select.appendChild(opt);
    });
  });
  const today = new Date().toISOString().slice(0, 10);
  taskDateInput.value = today;          // 任务日期默认今天
  document.getElementById('logDate').value = today; // 日志日期默认今天
}

function renderTaskFilters() {
  taskFilters.innerHTML = '';
  ['全部', ...SUBJECTS].forEach(name => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter-btn ${name === currentTaskFilter ? 'active' : ''}`;
    btn.textContent = name;
    btn.addEventListener('click', () => {
      currentTaskFilter = name;
      renderTasks();
    });
    taskFilters.appendChild(btn);
  });
}

function renderTasks() {
  taskList.innerHTML = '';
  // 按日期倒序，再按创建时间倒序
  let list = state.tasks.slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  if (currentTaskFilter !== '全部') {
    list = list.filter(t => t.subject === currentTaskFilter);
  }
  if (list.length === 0) {
    taskEmptyTip.style.display = 'block';
  } else {
    taskEmptyTip.style.display = 'none';
    list.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item card ${task.done ? 'done' : ''}`;
      li.dataset.id = task.id;
      li.innerHTML = `
        <label class="task-checkbox">
          <input type="checkbox" ${task.done ? 'checked' : ''} />
        </label>
        <div class="task-body">
          <div class="task-meta"><span class="chip">${escapeHtml(task.subject)}</span><span class="date">${escapeHtml(task.date)}</span></div>
          <div class="task-content">${escapeHtml(task.content)}</div>
        </div>
        <button class="btn-delete" data-id="${task.id}" title="删除任务">删除</button>
      `;
      const checkbox = li.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => toggleTask(task.id));
      li.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id));
      taskList.appendChild(li);
    });
  }
}

function addTask(e) {
  e.preventDefault();
  const subject = taskSubjectSelect.value;
  const content = taskContentInput.value.trim();
  const date = taskDateInput.value || new Date().toISOString().slice(0, 10);
  if (!content) {
    showToast('请填写任务内容');
    return;
  }
  const task = { id: Date.now(), subject, content, date, done: false, createdAt: Date.now() };
  state.tasks.push(task);
  save(STORAGE_KEYS.TASKS, state.tasks); // 立即持久化到 localStorage
  taskContentInput.value = '';
  renderTasks();
  renderDashboard();
  showToast('任务已添加');
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done; // 勾选/取消勾选
  save(STORAGE_KEYS.TASKS, state.tasks);
  renderTasks();
  renderDashboard();
  showToast(task.done ? '任务已完成，继续加油～' : '任务已重新打开');
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  save(STORAGE_KEYS.TASKS, state.tasks);
  renderTasks();
  renderDashboard();
  showToast('任务已删除');
}

taskForm.addEventListener('submit', addTask);

/* ================================================================
   5. 错题本：字段：科目、题目、我的错误、正确思路、下次复习日期；
   可删除、可标记“已复习”
   ================================================================ */
const mistakeForm = document.getElementById('mistakeForm');
const mistakeSubjectSelect = document.getElementById('mistakeSubject');
const mistakeQuestionInput = document.getElementById('mistakeQuestion');
const mistakeMyErrorInput = document.getElementById('mistakeMyError');
const mistakeRightIdeaInput = document.getElementById('mistakeRightIdea');
const mistakeReviewDateInput = document.getElementById('mistakeReviewDate');
const mistakeList = document.getElementById('mistakeList');
const mistakeEmptyTip = document.getElementById('mistakeEmptyTip');

function renderMistakes() {
  mistakeList.innerHTML = '';
  const list = state.mistakes.slice().sort((a, b) => b.createdAt - a.createdAt);
  if (list.length === 0) {
    mistakeEmptyTip.style.display = 'block';
  } else {
    mistakeEmptyTip.style.display = 'none';
    list.forEach(m => {
      const li = document.createElement('li');
      li.className = 'mistake-item card';
      li.dataset.id = m.id;
      const reviewedCls = m.reviewed ? 'reviewed' : '';
      const reviewedText = m.reviewed ? '未复习' : '标记已复习';
      li.innerHTML = `
        <div class="mistake-header">
          <span class="chip">${escapeHtml(m.subject)}</span>
          <span class="date">${escapeHtml(m.reviewDate || '-')}</span>
          <span class="reviewed-badge ${reviewedCls}">${m.reviewed ? '已复习' : '未复习'}</span>
        </div>
        <div class="mistake-field"><b>题目：</b>${escapeHtml(m.question)}</div>
        <div class="mistake-field"><b>我的错误：</b>${escapeHtml(m.myError)}</div>
        <div class="mistake-field"><b>正确思路：</b>${escapeHtml(m.rightIdea)}</div>
        <div class="mistake-actions">
          <button class="btn-toggle ${reviewedCls}" data-id="${m.id}">${reviewedText}</button>
          <button class="btn-delete" data-id="${m.id}" title="删除错题">删除</button>
        </div>
      `;
      li.querySelector('.btn-toggle').addEventListener('click', () => toggleMistakeReviewed(m.id));
      li.querySelector('.btn-delete').addEventListener('click', () => deleteMistake(m.id));
      mistakeList.appendChild(li);
    });
  }
}

function addMistake(e) {
  e.preventDefault();
  const subject = mistakeSubjectSelect.value;
  const question = mistakeQuestionInput.value.trim();
  const myError = mistakeMyErrorInput.value.trim();
  const rightIdea = mistakeRightIdeaInput.value.trim();
  const reviewDate = mistakeReviewDateInput.value;
  if (!question || !myError || !rightIdea) {
    showToast('请把题目、我的错误、正确思路都填完整');
    return;
  }
  const m = {
    id: Date.now(),
    subject,
    question,
    myError,
    rightIdea,
    reviewDate,
    reviewed: false,
    createdAt: Date.now()
  };
  state.mistakes.push(m);
  save(STORAGE_KEYS.MISTAKES, state.mistakes);
  mistakeForm.reset();
  renderMistakes();
  showToast('错题已添加');
}

function toggleMistakeReviewed(id) {
  const m = state.mistakes.find(x => x.id === id);
  if (!m) return;
  m.reviewed = !m.reviewed;
  save(STORAGE_KEYS.MISTAKES, state.mistakes);
  renderMistakes();
  showToast(m.reviewed ? '已标记为复习' : '已标记为未复习');
}

function deleteMistake(id) {
  state.mistakes = state.mistakes.filter(x => x.id !== id);
  save(STORAGE_KEYS.MISTAKES, state.mistakes);
  renderMistakes();
  showToast('错题已删除');
}

mistakeForm.addEventListener('submit', addMistake);

/* ================================================================
   6. 学习日志：字段：今日完成、卡点/错题、下次起点、日期；
   可新增、删除、按日期倒序显示
   ================================================================ */
const logForm = document.getElementById('logForm');
const logDateInput = document.getElementById('logDate');
const logDoneInput = document.getElementById('logDone');
const logStuckInput = document.getElementById('logStuck');
const logNextInput = document.getElementById('logNext');
const logList = document.getElementById('logList');
const logEmptyTip = document.getElementById('logEmptyTip');

function renderLogs() {
  logList.innerHTML = '';
  const list = state.logs.slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  if (list.length === 0) {
    logEmptyTip.style.display = 'block';
  } else {
    logEmptyTip.style.display = 'none';
    list.forEach(l => {
      const li = document.createElement('li');
      li.className = 'log-item card';
      li.dataset.id = l.id;
      li.innerHTML = `
        <div class="log-header"><span class="date">${escapeHtml(l.date)}</span></div>
        <div class="log-field"><b>今日完成：</b>${escapeHtml(l.done)}</div>
        <div class="log-field"><b>卡点 / 错题：</b>${escapeHtml(l.stuck)}</div>
        <div class="log-field"><b>下次起点：</b>${escapeHtml(l.next)}</div>
        <button class="btn-delete" data-id="${l.id}" title="删除日志">删除</button>
      `;
      li.querySelector('.btn-delete').addEventListener('click', () => deleteLog(l.id));
      logList.appendChild(li);
    });
  }
}

function addLog(e) {
  e.preventDefault();
  const date = logDateInput.value || new Date().toISOString().slice(0, 10);
  const done = logDoneInput.value.trim();
  const stuck = logStuckInput.value.trim();
  const next = logNextInput.value.trim();
  if (!done || !stuck || !next) {
    showToast('请把今日完成、卡点/错题、下次起点都填完整');
    return;
  }
  const l = { id: Date.now(), date, done, stuck, next, createdAt: Date.now() };
  state.logs.push(l);
  save(STORAGE_KEYS.LOGS, state.logs);
  logForm.reset();
  logDateInput.value = new Date().toISOString().slice(0, 10); // 重置后把日期恢复为今天
  renderLogs();
  showToast('日志已添加');
}

function deleteLog(id) {
  state.logs = state.logs.filter(l => l.id !== id);
  save(STORAGE_KEYS.LOGS, state.logs);
  renderLogs();
  showToast('日志已删除');
}

logForm.addEventListener('submit', addLog);

/* ================================================================
   7. AI 提示词库：内置 5 条，一键复制，复制成功有页面内提示
   ================================================================ */
const promptGrid = document.getElementById('promptGrid');

function renderPrompts() {
  promptGrid.innerHTML = '';
  DEFAULT_PROMPTS.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'prompt-card card';
    card.innerHTML = `
      <div class="prompt-title">${escapeHtml(p.title)}</div>
      <div class="prompt-text">${escapeHtml(p.text)}</div>
      <div class="prompt-actions">
        <button class="btn-copy" data-index="${i}">复制</button>
      </div>
    `;
    card.querySelector('.btn-copy').addEventListener('click', () => {
      copyPrompt(DEFAULT_PROMPTS[i].text);
    });
    promptGrid.appendChild(card);
  });
}

function copyPrompt(text) {
  navigator.clipboard.writeText(text).then(
    () => showToast('提示词已复制，粘贴到 AI 对话框即可使用'),
    () => showToast('复制失败，请手动选中文本后复制')
  );
}

/* ================================================================
   8. 智能规划：规则引擎 + 表单问卷
   ================================================================ */

/* ---------- 渲染基础设定网格（5科 × 基础/目标） ---------- */
function renderProfileGrid() {
  const container = document.getElementById('profileGrid');
  container.innerHTML = SUBJECTS.map(subject => `
    <div class="profile-item card">
      <div class="profile-label">${escapeHtml(subject)}</div>
      <div class="profile-selects">
        <select id="profileLevel-${subject}">
          <option value="zero">零基础</option>
          <option value="some">有点印象</option>
          <option value="good">比较熟练</option>
        </select>
        <select id="profileGoal-${subject}">
          <option value="pass">保底及格</option>
          <option value="rush">冲刺高分</option>
        </select>
      </div>
    </div>
  `).join('');

  // 回填已保存的值
  SUBJECTS.forEach(subject => {
    const levelSel = document.getElementById(`profileLevel-${subject}`);
    const goalSel = document.getElementById(`profileGoal-${subject}`);
    if (state.profile.levels[subject]) levelSel.value = state.profile.levels[subject];
    if (state.profile.goals[subject]) goalSel.value = state.profile.goals[subject];
  });
}

/* ---------- 保存基础设定到 localStorage ---------- */
function saveProfile() {
  SUBJECTS.forEach(subject => {
    const levelSel = document.getElementById(`profileLevel-${subject}`);
    const goalSel = document.getElementById(`profileGoal-${subject}`);
    if (levelSel) state.profile.levels[subject] = levelSel.value;
    if (goalSel) state.profile.goals[subject] = goalSel.value;
  });
  save(STORAGE_KEYS.PROFILE, state.profile);
  showToast('基础设定已保存');
}

/* ---------- 保存每日状态打卡 ---------- */
function saveStatus() {
  const energy = document.querySelector('input[name="energy"]:checked');
  const time = document.querySelector('input[name="time"]:checked');
  if (!energy || !time) {
    showToast('请选择精力状态和可用时间');
    return;
  }
  state.profile.todayEnergy = energy.value;
  state.profile.todayTime = time.value;
  save(STORAGE_KEYS.PROFILE, state.profile);
  showToast('状态打卡已保存');
}

/* ---------- 渲染每日小测 ---------- */
function renderQuiz() {
  const container = document.getElementById('quizGrid');
  container.innerHTML = QUIZ_QUESTIONS.map((q, i) => `
    <div class="quiz-item card">
      <div class="quiz-q">${i + 1}. ${escapeHtml(q.q)}</div>
      <div class="quiz-options">
        ${q.options.map((opt, j) => `
          <label class="quiz-option">
            <input type="radio" name="quiz-${i}" value="${j}"> ${escapeHtml(opt)}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

/* ---------- 提交每日小测：正确率低于60%则降低推荐难度 ---------- */
function submitQuiz() {
  let correct = 0;
  QUIZ_QUESTIONS.forEach((q, i) => {
    const selected = document.querySelector(`input[name="quiz-${i}"]:checked`);
    if (selected && parseInt(selected.value, 10) === q.answer) correct++;
  });
  const rate = correct / QUIZ_QUESTIONS.length;
  const passed = rate >= 0.6;
  const today = new Date().toISOString().slice(0, 10);
  state.profile.testPassed = passed;
  state.profile.testDate = today;
  save(STORAGE_KEYS.PROFILE, state.profile);

  const resultEl = document.getElementById('quizResult');
  resultEl.innerHTML = `
    <p>你答对了 ${correct}/${QUIZ_QUESTIONS.length} 道题，正确率 ${Math.round(rate * 100)}%。</p>
    <p style="color:${passed ? '#16a34a' : '#dc2626'}">${passed ? '状态良好，推荐难度正常。' : '正确率较低，今日推荐难度将自动降低一档。'}</p>
  `;
  showToast(passed ? '测试通过，推荐难度正常' : '测试未通过，推荐难度已降低');
}

/* ---------- 计算今日推荐强度 ---------- */
function calcIntensity(energy, time) {
  if (energy === 'low' || time === 'fragment') return 'low';
  if (energy === 'high' && (time === 'gt4' || time === 'h2to4')) return 'high';
  if (energy === 'medium' && time === 'h2to4') return 'medium';
  return 'medium';
}

/* ---------- 难度降低一档 ---------- */
function lowerIntensity(intensity) {
  if (intensity === 'high') return 'medium';
  if (intensity === 'medium') return 'low';
  return 'low';
}

/* ---------- 生成今日推荐任务列表 ---------- */
function generatePlan() {
  if (!state.profile.todayEnergy || !state.profile.todayTime) {
    showToast('请先完成每日状态打卡');
    return;
  }

  const hasProfile = SUBJECTS.every(s => state.profile.levels[s] && state.profile.goals[s]);
  if (!hasProfile) {
    showToast('请先完成各科目的基础设定');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  // 新的一天重置测试状态
  if (state.profile.testDate !== today) {
    state.profile.testPassed = true;
    state.profile.testDate = today;
    save(STORAGE_KEYS.PROFILE, state.profile);
  }

  let intensity = calcIntensity(state.profile.todayEnergy, state.profile.todayTime);
  if (!state.profile.testPassed) {
    intensity = lowerIntensity(intensity);
  }

  currentRecommendations = [];
  SUBJECTS.forEach(subject => {
    const level = state.profile.levels[subject];
    const templates = REC_TEMPLATES[subject];
    if (!templates || !templates[level]) return;

    let list;
    if (intensity === 'low') {
      list = LOW_INTENSITY_COMMON;
    } else {
      list = templates[level][intensity] || [];
    }

    list.forEach(item => {
      currentRecommendations.push({
        subject,
        title: item.title,
        content: item.content,
        minutes: item.minutes
      });
    });
  });

  renderPlanResult();
  showToast(`已生成${currentRecommendations.length}条推荐任务`);
}

/* ---------- 渲染推荐结果 ---------- */
function renderPlanResult() {
  const container = document.getElementById('planResult');
  const recs = currentRecommendations || [];
  if (recs.length === 0) {
    container.innerHTML = '<p class="empty-tip">暂无推荐，请先完成基础设定与状态打卡，再点击生成。</p>';
    return;
  }
  container.innerHTML = recs.map((item, i) => `
    <div class="plan-item card">
      <div class="plan-header">
        <span class="chip">${escapeHtml(item.subject)}</span>
        <span class="plan-time">${item.minutes}分钟</span>
      </div>
      <div class="plan-content">${escapeHtml(item.content)}</div>
      <button class="btn-join" data-index="${i}">加入今日任务</button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-join').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index, 10);
      const item = recs[index];
      const task = {
        id: Date.now() + index,
        subject: item.subject,
        content: item.content,
        date: new Date().toISOString().slice(0, 10),
        done: false,
        createdAt: Date.now()
      };
      state.tasks.push(task);
      save(STORAGE_KEYS.TASKS, state.tasks); // 立即写入每日任务
      renderTasks();
      renderDashboard();
      showSection('tasks'); // 自动跳转到每日任务页面
      showToast('已加入今日任务');
    });
  });
}

/* ---------- 初始化智能规划页面：渲染表单 + 绑定按钮 ---------- */
function initPlanner() {
  renderProfileGrid();
  renderQuiz();

  const saveProfileBtn = document.getElementById('saveProfile');
  if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);

  const saveStatusBtn = document.getElementById('saveStatus');
  if (saveStatusBtn) saveStatusBtn.addEventListener('click', saveStatus);

  const submitQuizBtn = document.getElementById('submitQuiz');
  if (submitQuizBtn) submitQuizBtn.addEventListener('click', submitQuiz);

  const generatePlanBtn = document.getElementById('generatePlan');
  if (generatePlanBtn) generatePlanBtn.addEventListener('click', generatePlan);
}

/* ================================================================
   9. 高效资料库：内置高频资料 + 手动添加笔记
   ================================================================ */

/* 资料存储 key（用户自己添加的笔记存入 localStorage，内置资料不存） */
const STORAGE_KEYS_MATERIALS = 'lnzsb_materials';

/* 内置资料数据结构。方便你以后直接在这里修改、添加或删除。
   每个条目格式：
   {
     subject: '外语' | '计算机' | '高数/思政' | '专业综合课' | '技能考核',
     title: '资料标题',
     content: '核心内容（支持 \\n 换行）'
   }
   如何自己添加资料：直接在下面 MATERIALS_DATA 数组中 push 一条新对象即可，
   或者在页面底部“添加我的专属笔记”表单中手动添加（会存入 localStorage）。 */
const MATERIALS_DATA = [
  /* ================= 外语 ================= */
  {
    subject: '外语',
    title: '万能作文模板：现象利弊类',
    content: '【开头】近年来，……问题日益突出，引起了广泛关注。\n【正论点】一方面，……；另一方面，……。\n【反论点】但是，……也存在一些问题，如……。\n【结尾】综上所述，我们应该……。只有这样，才能……。'
  },
  {
    subject: '外语',
    title: '万能作文模板：书信类',
    content: 'Dear XXX,\nI am writing to tell you that ……\nOn one hand, ……; on the other hand, …….\nI hope ……\nYours,\nXXX'
  },
  {
    subject: '外语',
    title: '万能作文模板：图表类',
    content: '【开头】As is shown in the chart/table, ……\n【主体】From …… to ……, …… increased/decreased sharply.\n【分析】The reasons are as follows. First, …… Second, ……\n【结尾】In conclusion, ……'
  },
  {
    subject: '外语',
    title: '常用连接词',
    content: '递进：Moreover / Furthermore / Besides / In addition\n转折：However / Nevertheless / On the other hand / Despite\n因果：Therefore / Thus / As a result / Because of\n举例：For example / For instance / Such as\n总结：In conclusion / To sum up / In a word'
  },
  /* ================= 计算机 ================= */
  {
    subject: '计算机',
    title: '核心概念01：CPU的组成',
    content: 'CPU（中央处理器）主要由运算器、控制器和寄存器组成，其中运算器进行算术和逻辑运算，控制器协调各部件工作，寄存器临时存储指令和数据。'
  },
  {
    subject: '计算机',
    title: '核心概念02：内存与外存的区别',
    content: '内存（RAM）：速度快、容量小、断电丢失，直接与CPU交互；外存（硬盘/SSD）：速度慢、容量大、断电不丢失，用于长期存储。'
  },
  {
    subject: '计算机',
    title: '核心概念03：操作系统功能',
    content: '操作系统的主要功能包括：处理器管理、存储器管理、设备管理、文件管理，以及为用户提供操作接口。'
  },
  {
    subject: '计算机',
    title: '核心概念04：计算机网络分类',
    content: '按覆盖范围分为：LAN（局域网）、MAN（城域网）、WAN（广域网）。因特网是最大的互连网络。'
  },
  {
    subject: '计算机',
    title: '核心概念05：IP地址',
    content: 'IPv4 地址由 32 位二进制数组成，通常用点分十进制表示，如 192.168.1.1。'
  },
  {
    subject: '计算机',
    title: '核心概念06：数据库管理系统',
    content: 'DBMS 常见类型有关系型数据库（如 MySQL、Oracle）和非关系型数据库（如 NoSQL）。SQL 是用于操作关系型数据库的标准语言。'
  },
  {
    subject: '计算机',
    title: '核心概念07：算法时间复杂度',
    content: '常见时间复杂度从小到大：O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2^n)。'
  },
  {
    subject: '计算机',
    title: '核心概念08：软件开发过程',
    content: '软件开发通常包括：需求分析、概要设计、详细设计、编码实现、测试、维护。'
  },
  {
    subject: '计算机',
    title: '核心概念09：面向对象三大特征',
    content: '封装、继承、多态。封装隐藏内部实现，继承实现代码复用，多态允许同一接口调用不同实现。'
  },
  {
    subject: '计算机',
    title: '核心概念10：二进制与十进制转换',
    content: '二进制转十进制：按权展开求和；十进制转二进制：除2取逆法（整数部分），乘2取整法（小数部分）。'
  },
  {
    subject: '计算机',
    title: '核心概念11：编译程序与解释程序',
    content: '编译程序一次性将源程序翻译成目标程序；解释程序边翻译边执行，不生成独立的目标程序。'
  },
  {
    subject: '计算机',
    title: '核心概念12：文件系统',
    content: '文件系统负责文件的存储、组织、管理和保护，常见文件系统有 FAT32、NTFS、ext4 等。'
  },
  {
    subject: '计算机',
    title: '核心概念13：死锁',
    content: '死锁是指两个或两个以上进程在执行过程中，因竞争资源而造成的一种僵局，若无外力作用，它们将永远推进不下去。'
  },
  {
    subject: '计算机',
    title: '核心概念14：虚拟内存',
    content: '虚拟内存是指请求调页存储管理和分段存储管理能力，允许程序占用的逻辑地址空间大于实存容量。'
  },
  {
    subject: '计算机',
    title: '核心概念15：TCP/IP协议栈',
    content: 'TCP/IP协议栈通常分为四层：应用层、传输层、网际层、网络接口层。'
  },
  {
    subject: '计算机',
    title: '核心概念16：HTTP与HTTPS',
    content: 'HTTP 是超文本传输协议，默认端口80；HTTPS 是加密的HTTP，默认端口443，使用SSL/TLS加密。'
  },
  {
    subject: '计算机',
    title: '核心概念17：DNS域名系统',
    content: 'DNS 将易记的域名（如 www.example.com）转换为机器可识别的 IP 地址。'
  },
  {
    subject: '计算机',
    title: '核心概念18：邮件协议',
    content: 'SMTP 用于发送邮件（端口25），POP3/IMAP 用于接收邮件（端口110/143）。'
  },
  {
    subject: '计算机',
    title: '核心概念19：网络安全基础',
    content: '常见网络攻击包括：病毒、木马、钓鱼、DDoS、SQL注入、跨站脚本（XSS）。'
  },
  {
    subject: '计算机',
    title: '核心概念20：信息安全的基本属性',
    content: 'CIA三要素：保密性（Confidentiality）、完整性（Integrity）、可用性（Availability）。'
  },
  /* ================= 高数/思政 ================= */
  {
    subject: '高数/思政',
    title: '专升本高数必背求导公式表',
    content: '(C)’= 0\n(x^n)’ = nx^(n-1)\n(sin x)’ = cos x\n(cos x)’ = -sin x\n(tan x)’ = sec^2 x\n(e^x)’ = e^x\n(a^x)’ = a^x ln a\n(ln x)’ = 1/x\n(log_a x)’ = 1/(x ln a)\n(uv)’ = u’v + uv’\n(u/v)’ = (u’v - uv’) / v^2\n(cos^{-1} x)’ 等反三角函数求导公式同理'
  },
  {
    subject: '高数/思政',
    title: '高数常见等价无穷小替换公式',
    content: '当 x→0 时：\nsin x ~ x\ntan x ~ x\narcsin x ~ x\narctan x ~ x\nln(1+x) ~ x\ne^x - 1 ~ x\na^x - 1 ~ x·ln a\n1 - cos x ~ x²/2\n(1+x)^α - 1 ~ αx'
  },
  {
    subject: '高数/思政',
    title: '高数求导常见应用',
    content: '求导数用于研究函数单调性、极值、最大最小值、凹凸性与拐点，以及求曲线切线斜率。'
  },
  /* ================= 专业综合课 ================= */
  {
    subject: '专业综合课',
    title: '这里是你自己的专业课重点，请自己手动添加',
    content: '点击下方“添加我的专属笔记”，选择“专业综合课”，填写标题与核心内容，即可生成你的专属资料卡片。'
  },
  /* ================= 技能考核 ================= */
  {
    subject: '技能考核',
    title: '这里是你自己的技能考核重点，请自己手动添加',
    content: '点击下方“添加我的专属笔记”，选择“技能考核”，填写标题与核心内容，即可生成你的专属资料卡片。'
  },

  {
    subject: '高数/思政',
    title: '高数考点·函数、极限与连续',
    content: '◆ 函数的定义域与表达式（识记）\n题型：选择/填空\n求 f(x)=√(x-2)/ln(x-1) 的定义域。\n答案：x>1 且 x≠2，即 (1,2)∪(2,+∞)\n易错/步骤：三重约束：偶次根号内≥0、分母≠0、对数真数>0；逐个列不等式取交集\n\n◆ 重要极限１：lim(x→0) sinx/x = 1（应用）\n题型：选择/填空/解答第一小题\n求 lim(x→0) sin3x/(2x)。\n答案：3/2\n易错/步骤：凑出“sin3x/(3x)”再用基本极限，系数 3/2 不能丢\n\n◆ 重要极限２：(1+1/x)^x → e（应用）\n题型：选择/填空\n求 lim(x→∞)(1+2/x)^x。\n答案：e²\n易错/步骤：先化成 [(1+2/x)^(x/2)]²，指数部分要乘 2，写成 e^(x·2/x)\n\n◆ 等价无穷小代换（x→0）（识记）\n题型：选择/填空/解答\n求 lim(x→0)(1-cosx)/x²。\n答案：1/2\n易错/步骤：1-cosx ~ x²/2；只能在乘除因子中替换，加减中直接换会错\n\n◆ 极限存在条件：左极限=右极限（识记）\n题型：选择/填空\nf(x)={x+1, x<0; a+x², x≥0} 在 x=0 处极限存在，求 a。\n答案：a=1\n易错/步骤：分段点两侧分别算极限再令相等，注意分段点归属哪一段\n\n◆ 间断点及其分类（识记）\n题型：选择/填空\n求 f(x)=(x²-1)/(x²-3x+2) 的间断点并判断类型。\n答案：x=1 可去间断点，x=2 无穷间断点\n易错/步骤：先因式分解约去公因子再判断；第一类（可去/跳跃）与第二类（无穷/振荡）\n\n◆ 连续性与连续函数性质（识记/领会）\n题型：选择/填空/解答\nf(x)={sinx/x, x≠0; a, x=0} 在 x=0 连续，求 a。\n答案：a=1\n易错/步骤：连续 ⇔ lim(x→x0)f(x)=f(x0)，先求极限再等于函数值'
  },
  {
    subject: '高数/思政',
    title: '高数考点·一元函数微分学',
    content: '◆ 导数定义与可导性（领会）\n题型：选择/填空\n用定义求 f(x)=x² 在 x=1 处的导数。\n答案：f\'(1)=lim(h→0)[(1+h)²-1]/h=2\n易错/步骤：导数定义两种写法都要会；可导必连续，连续不一定可导（如 |x| 在 0 处）\n\n◆ 求导公式与四则/复合求导（应用）\n题型：选择/填空/解答\n求 y=ln(sin(2x)) 的导数。\n答案：y\'=2cos2x/sin2x=2cot2x\n易错/步骤：由外到内逐层求导，最后乘上最内层 2；复合链不能漏乘\n\n◆ 隐函数与参数方程求导（识记）\n题型：选择/填空/解答\n由 x²+y²=1 求 dy/dx。\n答案：dy/dx=-x/y\n易错/步骤：两边对 x 求导，y 视为 x 的函数（y\' 项），再解出 y\'\n\n◆ 切线方程与法线方程（识记）\n题型：填空/解答\n求曲线 y=lnx 在点 (1,0) 处的切线方程。\n答案：y=x-1\n易错/步骤：先求 k=f\'(x0)，点斜式 y-f(x0)=k(x-x0)；法线斜率 -1/k\n\n◆ 洛必达法则求未定式（应用）\n题型：选择/填空/解答\n求 lim(x→0)(e^x-1-x)/x²。\n答案：1/2（两次洛必达）\n易错/步骤：只对 0/0、∞/∞ 可用；每次求导后必须先检验是否仍是未定式\n\n◆ 单调性、极值、最值（领会/应用）\n题型：解答题常考\n求 f(x)=x³-3x 的单调区间与极值。\n答案：增区间 (-∞,-1)、(1,+∞)，减区间 (-1,1)；极大值 f(-1)=2，极小值 f(1)=-2\n易错/步骤：列表：f\'(x)=3(x-1)(x+1)；极值点必须落在定义域内，端点不算极值\n\n◆ 凹凸性与拐点（识记/领会）\n题型：选择/填空\n求 y=x³-3x² 的拐点。\n答案：(1,-2)\n易错/步骤：f\'\'(x)=6x-6，令其为 0 得 x=1，且两侧变号才是拐点'
  },
  {
    subject: '高数/思政',
    title: '高数考点·一元函数积分学',
    content: '◆ 不定积分基本公式与直接积分（应用）\n题型：选择/填空/解答\n求 ∫(3x²+1/x)dx。\n答案：x³+ln|x|+C\n易错/步骤：积分结果必须带 +C；1/x 的积分是 ln|x| 要加绝对值\n\n◆ 第一类换元法（凑微分）（应用）\n题型：选择/填空/解答\n求 ∫2x/(1+x²)dx。\n答案：ln(1+x²)+C\n易错/步骤：看到分母的导数在分子上就凑；换元后必须换回原变量\n\n◆ 第二类换元（三角代换/根式代换）（领会）\n题型：解答\n求 ∫√(1-x²)dx。\n答案：令 x=sint，(1/2)[x√(1-x²)+arcsinx]+C\n易错/步骤：含 √(a²-x²) 令 x=asint；含 √(x²+a²) 令 x=atant；记得回代\n\n◆ 分部积分法（应用）\n题型：解答\n求 ∫xe^x dx。\n答案：(x-1)e^x+C\n易错/步骤：口诀“反对幂指三”选 u；u 求导、dv 积分，符号易错（减号）\n\n◆ 牛顿-莱布尼茨公式与定积分计算（应用）\n题型：选择/填空/解答\n求 ∫₀¹(x²+2x)dx。\n答案：1/3+1=4/3\n易错/步骤：F(b)-F(a)；换元时上下限要同步换成新变量的限\n\n◆ 定积分求平面图形面积（应用）\n题型：解答题必考方向\n求 y=x 与 y=x² 围成的面积。\n答案：∫₀¹(x-x²)dx=1/6\n易错/步骤：先求交点定上下限；上方函数减下方函数，别把顺序颠倒\n\n◆ 旋转体体积（应用）\n题型：解答\ny=x² 在 [0,1] 绕 x 轴旋转，求体积。\n答案：π∫₀¹x⁴dx=π/5\n易错/步骤：绕 x 轴用 V=π∫y²dx；绕 y 轴用 V=2π∫x·f(x)dx（柱壳法）'
  },
  {
    subject: '高数/思政',
    title: '高数考点·向量与空间解析几何',
    content: '◆ 向量的数量积、向量积、平行垂直条件（应用）\n题型：选择/填空\na=(1,2,-1)，b=(2,0,1)，求 a·b、a×b。\n答案：a·b=1；a×b=(2,-3,-4)\n易错/步骤：点积为 0 ⇒ 垂直；叉积为 0 ⇒ 平行；叉积坐标用行列式展开，注意中间项负号\n\n◆ 平面方程与直线方程（识记）\n题型：填空/解答\n求过点 (1,0,2)、法向量 (2,-1,3) 的平面方程。\n答案：2(x-1)-y+3(z-2)=0\n易错/步骤：平面点法式 A(x-x0)+B(y-y0)+C(z-z0)=0；直线点向式用方向向量'
  },
  {
    subject: '高数/思政',
    title: '高数考点·多元函数微分学、二重积分',
    content: '◆ 一、二阶偏导数与全微分（应用）\n题型：选择/填空/解答\nz=x²y+sin(xy)，求 z_x、z_y。\n答案：z_x=2xy+ycos(xy)；z_y=x²+xcos(xy)\n易错/步骤：对 x 求偏导时 y 当常数；混合偏导 z_xy=z_yx 可互相验证\n\n◆ 二元函数极值（领会）\n题型：解答\n求 z=x²+y²+2x-4y 的极值。\n答案：驻点 (-1,2)，A=2，AC-B²=4>0，极小值 z=-5\n易错/步骤：先解 z_x=0、z_y=0 求驻点，再用 AC-B² 判别：>0 有极值（A>0 极小）、<0 无极值\n\n◆ 二重积分在直角坐标下的计算（应用）\n题型：解答题必考\n求 ∬_D (x+y)dxdy，D: 0≤x≤1, 0≤y≤1。\n答案：1/2+1/2=1\n易错/步骤：画区域图定型（X 型/Y 型）；内层积分把另一变量当常数；交换次序需重定限\n\n◆ 二重积分交换积分次序（领会）\n题型：填空/解答\n将 ∫₀¹dx∫ₓ¹ f(x,y)dy 交换次序。\n答案：∫₀¹dy∫₀ʸ f(x,y)dx\n易错/步骤：先画积分区域（三角形），再按另一方向重新写上下限，最容易丢的就是限'
  },
  {
    subject: '外语',
    title: '词汇与语法（一）',
    content: '◆ 动词时态（过去完成/现在完成/将来）（词汇与语法约占一半语法题）\nBy the end of last year, he ______ in that company for ten years.\nA. worked  B. had worked  C. has worked  D. works\n答案：B\n要点：抓时间标志词：by the end of + 过去时间 → 过去完成；“for+时间段”常配完成时\n\n◆ 被动语态（高频）\nThe new bridge ______ by the end of next month.\nA. will complete  B. will be completed  C. is completed  D. has completed\n答案：B\n要点：先判断主语与动词关系（被动），再定时态；情态动词后用 be + 过去分词\n\n◆ 非谓语动词（不定式/动名词/分词）（重点考查项）\n______ from the top of the hill, the city looks beautiful.\nA. Seeing  B. Seen  C. To see  D. See\n答案：B\n要点：看逻辑主语：city 是被看 → 用过去分词；主动关系用 -ing；目的用 to do\n\n◆ 非谓语动词固定搭配（高频）\nHe kept me ______ for over two hours.\nA. wait  B. to wait  C. waiting  D. waited\n答案：C\n要点：keep sb doing；记住 stop/remember/forget 后接 to do 与 doing 的意义差别\n\n◆ 定语从句（关系代词/关系副词）（重点考查项）\nThis is the book ______ cover is red.\nA. which  B. that  C. whose  D. what\n答案：C\n要点：缺主/宾用 which/that，缺状语用 where/when/why，表所属用 whose\n\n◆ 名词性从句（重点考查项）\n______ he said at the meeting surprised us all.\nA. That  B. What  C. Which  D. It\n答案：B\n要点：从句缺主语且指“说的内容”→ what；that 只引导不缺成分的陈述从句\n\n◆ 虚拟语气（重点考查项）\nIf I ______ the answer, I would tell you.\nA. know  B. knew  C. had known  D. will know\n答案：B\n要点：与现在事实相反用过去式（be 用 were）；与过去相反用 had done；与将来相反用 were to do/should do'
  },
  {
    subject: '外语',
    title: '词汇与语法（二）',
    content: '◆ 虚拟语气倒装（易失分点）\n______ I been there, I would have helped him.\nA. If  B. Had  C. Have  D. Should\n答案：B\n要点：省略 if 时把 had/should/were 提前：Had I been...= If I had been...\n\n◆ 强调句 It is/was ... that ...（高频）\nIt was in 2019 ______ he graduated from college.\nA. when  B. that  C. which  D. where\n答案：B\n要点：强调句型固定用 that（人作宾语时可用 who），不能用 when/where\n\n◆ 倒装句（否定词提前/only+状语）（重点考查项）\nNever ______ I seen such a beautiful sunset.\nA. have  B. had  C. did  D. was\n答案：A\n要点：否定副词放句首，助动词提前：Never have I seen...；Hardly...when、Not only...but also 同理\n\n◆ 主谓一致（重点考查项）\nNeither the students nor the teacher ______ aware of the change.\nA. are  B. is  C. were  D. have been\n答案：B\n要点：就近原则（neither...nor、either...or、there be）；each/every/everyone 用单数\n\n◆ 词形转换/构词法（选择填空常考）\nHis ______ (succeed) in business made his family proud.\n答案：success\n要点：先判断空格词性（此处需名词），再变形式：success/successful/successfully/succeed\n\n◆ 高频词组与固定搭配（词汇题占一半）\nWe should ______ full use of our spare time.\nA. take  B. make  C. do  D. get\n答案：B\n要点：make full use of、take part in、be used to doing、look forward to doing 等固定搭配必须整体记'
  },
  {
    subject: '外语',
    title: '阅读理解',
    content: '◆ 细节题（定位+同义替换）（3 篇选择，每篇 5 题）\n题干：According to the passage, the main reason for ... is ______.\n答案：回原文对应句定位，选同义改写项\n要点：先看题干关键词回原文定位，答案通常在关键词所在句或其上下句\n\n◆ 主旨大意题（高频）\nWhat is the passage mainly about?\n答案：看首段、各段首句与末段，选覆盖面最大的概括项\n要点：避免以偏概全（只讲某一段）与过度推断（原文未提）\n\n◆ 推理判断与词义猜测题（高频）\nThe underlined word “it” in Paragraph 2 most probably refers to ______.\n答案：回指前一句的主语/宾语\n要点：代词回指看前一句；词义猜测看上下文并列、转折、举例关系\n\n◆ 简答题（1 篇 5 题）（每题答案不超过 3 个词）\nQ: When did the accident happen?\n答案：Last Monday.（≤3 词）\n要点：严格限 3 词内，用原文词；不写完整句、不加解释，抄错拼写即失分'
  },
  {
    subject: '外语',
    title: '英译汉',
    content: '◆ 单句翻译选择题（选择题型）\nHe is the last person I want to see.\nA. 他是我最不想见的人  B. 他是我最后一个要见的人  C. 他是我最后见到的人  D. 他是我想见的最后一人\n答案：A\n要点：注意 the last 表示“最不……的”；抓否定、被动、比较、双重否定\n\n◆ 段落翻译（约 100 词）（重点大题）\nIt is no use crying over spilt milk.\n答案：覆水难收（后悔无益）\n要点：先通读切分意群，再逐句译；汉语要通顺，不逐词硬译，人名地名照抄'
  },
  {
    subject: '外语',
    title: '写作',
    content: '◆ 应用文——道歉信（主要文体（考频最高））\nWrite a letter of apology to your teacher for missing the exam.\n参考模板：Dear Mr. Li, I am writing to apologize for... / Please accept my sincere apology... / Yours sincerely, Li Ming\n要点：三段式：说明事由+道歉 → 解释原因 → 弥补措施+再次致歉；格式（称呼、正文、落款）必须完整\n\n◆ 应用文——感谢信/邀请信/通知（常考文体）\nWrite a notice about a lecture to be held on Friday.\n参考模板：Notice / This is to inform you that... / All are welcome. / Student Union\n要点：通知要有标题 Notice、时间地点活动、落款单位；邀请信要有礼貌收尾\n\n◆ 写作评分要点与提分句式（写作决定档次）\n常用句式：It is widely acknowledged that... / Not only does it..., but it also... / Only in this way can we...\n要点：结构完整（3 段）、时态一致、主谓一致、拼写标点规范；宁用简单正确句，不写复杂错句'
  },
  {
    subject: '高数/思政',
    title: '高数考试结构与复习节奏',
    content: '满分：120 分\n题型结构：选择题 10×3 分=30；填空题 10×3 分=30；解答题 6×10 分=60\n复习优先级：① 极限与连续 ② 导数计算+导数应用（单调极值、洛必达）③ 不定积分与定积分计算 ④ 定积分应用（面积、旋转体体积）⑤ 二重积分 ⑥ 向量与平面直线\n建议时间分配：每天 90 分钟：公式默写 10 分钟 + 计算题 60 分钟 + 错题复盘 20 分钟'
  },
  {
    subject: '外语',
    title: '英语考试结构与复习节奏',
    content: '满分：120 分\n题型结构：词汇与语法（词和短语用法占 50%、语法结构占 50%）；阅读 4 篇共约 1200 词（3 篇选择 15 题+1 篇简答 5 题）；英译汉（单句选择+段落翻译）；应用文写作；不考听力\n复习优先级：① 阅读（分值最大，先保正确率）② 词汇与语法（语法点集中突破：时态语态、非谓语、从句、虚拟、倒装、主谓一致）③ 应用文模板 ④ 段落翻译\n建议时间分配：每天 60 分钟：背词 20 分钟（约 3000 词轮转）+ 阅读 25 分钟 + 语法/写作 15 分钟'
  },
  {
    subject: '计算机',
    title: '计算机考试结构与复习节奏',
    content: '满分：100 分\n考试安排：公共课统考科目，4 月 19 日上午\n复习优先级：按考纲过一遍 Office 操作与基础理论，属性价比最高的保分科目\n建议时间分配：每周 3 次，每次 45 分钟'
  },
  {
    subject: '专业综合课',
    title: '专业课与技能考核备考节奏',
    content: '满分：300 + 100 分\n考核安排：由牵头院校组织，4 月 16 日前完成\n复习优先级：分值占比最高（共 400 分），是拉开差距的主战场，优先级应高于公共课\n建议时间分配：每天 2 小时，按专业组考纲逐章过真题'
  },
  {
    subject: '高数/思政',
    title: '辽宁专升本关键时间节点（2026参考）',
    content: '报名缴费：120 元\n打印准考证：4 月 13—19 日\n考试时间：4 月 18 日 9:00—11:00 数学/思政、14:00—16:00 外语；4 月 19 日 9:00—10:30 计算机\n注意：数学与外语同日，上午考数学需重点训练上午时段计算准确率\n备考建议：考前一个月每周一次全真限时模考'
  },
];

/* 资料状态：用户手动添加的笔记（从 localStorage 恢复） */
let userMaterials = load(STORAGE_KEYS_MATERIALS, []);

let currentMaterialSubject = '全部';   // 当前选中的科目筛选
let currentMaterialQuery = '';         // 当前搜索关键词
const openSubjects = new Set(SUBJECTS); // 展开的科目集合，默认全部展开（手风琴折叠状态）

/* ---------- 渲染资料列表 ---------- */
function renderMaterials() {
  const accordion = document.getElementById('materialAccordion');
  accordion.innerHTML = '';

  // 合并内置资料与用户笔记
  const allMaterials = [...MATERIALS_DATA, ...userMaterials];

  // 按科目筛选 + 关键词搜索
  let filtered = allMaterials.filter(m => {
    const matchSubject = currentMaterialSubject === '全部' || m.subject === currentMaterialSubject;
    const matchQuery = !currentMaterialQuery ||
      m.title.includes(currentMaterialQuery) ||
      m.content.includes(currentMaterialQuery);
    return matchSubject && matchQuery;
  });

  // 按科目分组
  const groups = {};
  SUBJECTS.forEach(s => groups[s] = []);
  filtered.forEach(m => {
    if (groups[m.subject]) groups[m.subject].push(m);
  });

  // 渲染每个科目的折叠面板
  SUBJECTS.forEach(subject => {
    const items = groups[subject];
    if (items.length === 0) return;

    // 搜索或选中具体科目时强制展开；否则按手风琴折叠状态
    const isOpen = (currentMaterialQuery || currentMaterialSubject !== '全部')
      ? true
      : openSubjects.has(subject);

    const panel = document.createElement('div');
    panel.className = 'material-subject-panel';

    const header = document.createElement('div');
    header.className = 'material-subject-header';
    header.innerHTML = `
      <span class="material-subject-title">${escapeHtml(subject)}（${items.length}条）</span>
      <span class="material-subject-arrow ${isOpen ? 'open' : ''}">▼</span>
    `;
    header.addEventListener('click', () => {
      // 点击科目标题：折叠/展开该科目面板
      if (openSubjects.has(subject)) openSubjects.delete(subject);
      else openSubjects.add(subject);
      renderMaterials();
    });

    const body = document.createElement('div');
    body.className = `material-subject-body ${isOpen ? 'open' : ''}`;

    const list = document.createElement('div');
    list.className = 'material-list';
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'material-card';
      card.innerHTML = `
        <div class="material-title">${escapeHtml(item.title)}</div>
        <div class="material-content">${escapeHtml(item.content)}</div>
        <div class="material-actions">
          <button class="btn-copy-material" data-idx="${idx}" data-group="${subject}">复制内容</button>
        </div>
      `;
      card.querySelector('.btn-copy-material').addEventListener('click', e => {
        const group = e.target.dataset.group;
        const idx = parseInt(e.target.dataset.idx, 10);
        const targetItem = groups[group][idx];
        copyMaterial(targetItem.content, e.target);
      });
      list.appendChild(card);
    });

    body.appendChild(list);
    panel.appendChild(header);
    panel.appendChild(body);
    accordion.appendChild(panel);
  });
}

/* ---------- 复制资料内容 ---------- */
function copyMaterial(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    btnEl.textContent = '已复制';
    btnEl.classList.add('copied');
    setTimeout(() => {
      btnEl.textContent = '复制内容';
      btnEl.classList.remove('copied');
    }, 1500);
    showToast('资料内容已复制');
  }, () => {
    showToast('复制失败，请手动选中文本后复制');
  });
}

/* ---------- 初始化科目下拉框（用于添加笔记） ---------- */
function initMaterialSubjectSelect() {
  const select = document.getElementById('matSubject');
  if (!select) return;
  SUBJECTS.forEach(subj => {
    const opt = document.createElement('option');
    opt.value = subj;
    opt.textContent = subj;
    select.appendChild(opt);
  });
}

/* ---------- 添加我的专属笔记 ---------- */
function addMaterialNote(e) {
  e.preventDefault();
  const subject = document.getElementById('matSubject').value;
  const title = document.getElementById('matTitle').value.trim();
  const content = document.getElementById('matContent').value.trim();
  if (!title || !content) {
    showToast('请把标题和内容都填完整');
    return;
  }
  const note = { subject, title, content, id: Date.now() };
  userMaterials.push(note);
  save(STORAGE_KEYS_MATERIALS, userMaterials);
  document.getElementById('matTitle').value = '';
  document.getElementById('matContent').value = '';
  renderMaterials();
  showToast('专属笔记已添加');
}

/* ---------- 搜索筛选 ---------- */
function initMaterialSearch() {
  const searchInput = document.getElementById('materialsSearch');
  if (!searchInput) return;
  searchInput.addEventListener('input', e => {
    currentMaterialQuery = e.target.value.trim();
    renderMaterials();
  });
}

/* ---------- 科目标签筛选 ---------- */
function initMaterialTabs() {
  const tabs = document.querySelectorAll('.material-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMaterialSubject = tab.dataset.subject;
      renderMaterials();
    });
  });
}

/* ---------- 初始化资料库页面 ---------- */
function initMaterials() {
  initMaterialSubjectSelect();
  initMaterialSearch();
  initMaterialTabs();
  renderMaterials();

  const addForm = document.getElementById('materialAddForm');
  if (addForm) addForm.addEventListener('submit', addMaterialNote);
}

/* ================================================================
   初始化：渲染所有板块
   ================================================================ */
initSubjectSelects();
renderDashboard();
renderTaskFilters();
renderTasks();
renderMistakes();
renderLogs();
renderPrompts();
initPlanner();
initMaterials();
