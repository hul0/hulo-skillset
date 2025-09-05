/* ==================================================================================
   Robust script.js (v2) — loads skills.json, ratings.json, and user.json.
   - Graceful fallbacks if fetch fails (so UI still renders).
   - Populates header/profile placeholders and social links.
   - Uses user.skillCategories to map categoryId -> display title.
   - Defensive and verbose logging to help debugging.
   ================================================================================== */

(function () {
  'use strict';

  // -----------------------------
  // Tiny DOM helpers
  // -----------------------------
  function $id(id) { return document.getElementById(id); }
  function el(tag, attrs = {}, ...children) {
    const d = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') d.className = v;
      else if (k === 'html') d.innerHTML = v;
      else d.setAttribute(k, String(v));
    });
    children.flat().forEach(ch => {
      if (ch == null) return;
      d.append(typeof ch === 'string' ? document.createTextNode(ch) : ch);
    });
    return d;
  }

  // -----------------------------
  // Fallback data for offline/file:// testing
  // -----------------------------
  const FALLBACK_USER = {
    "name": "Rupam Ghosh",
    "nickname": "hulo",
    "title": "Cyber Security Enthusiast & Full-Stack Developer",
    "location": "Durgapur, West Bengal, India",
    "profilePicture": "https://via.placeholder.com/300x300/0a0f14/00f5d4?text=RG",
    "about": "Passionate cybersecurity enthusiast with a strong foundation in full-stack development. (ERROR - THIS IS DUMMY TEXTS)",
    "cvUrl": "./assets/Rupam_Ghosh_CV.pdf",
    "socialLinks": [
      { "platform": "github", "url": "https://github.com/rupamghosh", "username": "rupamghosh" },
      { "platform": "linkedin", "url": "https://linkedin.com/in/rupamghosh", "username": "rupamghosh" }
    ],
    "skillCategories": [
      { "id": "cybersecurity", "name": "🔐 Cybersecurity Skills" },
      { "id": "programming", "name": "💻 Programming & Development" },
      { "id": "systems", "name": "🖥️ Systems & Infrastructure" },
      { "id": "tools", "name": "🔧 Tools & Technologies" }
    ],
    "experience": { "totalYears": 4, "startDate": "2020-09-01" }
  };

  const FALLBACK_SKILLS = [
    {
      "id": "python",
      "name": "Python",
      "categoryId": "programming",
      "category": "Programming",
      "level": "Advanced",
      "tags": ["backend", "scripting"],
      "priority": 10,
      "visible": true,
      "startDate": "2021-06-01",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg",
      "description": "Primary language for backend development, scripting, and cybersecurity tasks.",
      "projects": ["Developed a port scanner", "Built REST APIs"],
      "resources": [{ "name": "Official Docs", "url": "https://docs.python.org/3/" }]
    },
    {
      "id": "javascript",
      "name": "JavaScript",
      "categoryId": "programming",
      "category": "Programming",
      "level": "Intermediate",
      "tags": ["frontend", "web"],
      "priority": 9,
      "visible": true,
      "startDate": "2022-01-15",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png",
      "description": "Used for frontend interactivity and dynamic web apps.",
      "projects": ["Built portfolio website"],
      "resources": [{ "name": "MDN", "url": "https://developer.mozilla.org/" }]
    }
  ];

  const FALLBACK_RATINGS = { "python": 8, "javascript": 7 };

  // -----------------------------
  // Rating label helper
  // -----------------------------
  function ratingLabel(n) {
    if (n >= 9) return 'Expert';
    if (n >= 7) return 'Advanced';
    if (n >= 4) return 'Intermediate';
    return 'Beginner';
  }

  // -----------------------------
  // Fetch helper with clear logging & failure
  // -----------------------------
  async function fetchJSON(path) {
    try {
      const resp = await fetch(path, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      return await resp.json();
    } catch (err) {
      console.warn(`fetchJSON failed for "${path}":`, err);
      throw err;
    }
  }

  // -----------------------------
  // Experience calculation
  // -----------------------------
  function computeExperienceYearsFromSkills(skills) {
    const dates = (skills || [])
      .map(s => s.startDate)
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d));
    if (!dates.length) return 0;
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const now = new Date();
    let years = now.getFullYear() - earliest.getFullYear();
    const adjust = (now.getMonth() < earliest.getMonth() || (now.getMonth() === earliest.getMonth() && now.getDate() < earliest.getDate())) ? 1 : 0;
    return Math.max(0, years - adjust);
  }

  // -----------------------------
  // UI: loader, renderers, cards, modal
  // -----------------------------
  function showLoader(text = 'Loading...') {
    const main = $id('skills-main');
    if (!main) return;
    main.innerHTML = '';
    main.append(el('div', { id: 'loader', class: 'col-span-full text-center py-16' },
      el('p', { class: 'text-accent animate-pulse' }, text)
    ));
  }

  function renderStats(totalSkills, totalCategories, experienceYears) {
    if ($id('total-skills')) $id('total-skills').textContent = String(totalSkills);
    if ($id('total-categories')) $id('total-categories').textContent = String(totalCategories);
    if ($id('experience-years')) $id('experience-years').textContent = `${experienceYears}+`;
  }

  function createSkillCard(skill, rating) {
    const img = skill.imageUrl || 'https://via.placeholder.com/80?text=Skill';
    const card = el('button', {
      class: 'skill-card group text-left p-4 rounded-lg border border-border-color hover:shadow-lg transition-all flex gap-4 items-center bg-secondary-glass w-full',
      type: 'button',
      'data-skill-id': skill.id
    });

    const logo = el('img', { src: img, alt: skill.name, class: 'w-12 h-12 rounded-full object-cover flex-shrink-0' });
    const body = el('div', { class: 'flex-1' },
      el('div', { class: 'flex items-center justify-between' },
        el('div', {}, el('div', { class: 'font-semibold text-white' }, skill.name),
          el('div', { class: 'text-xs text-text-secondary' }, skill.category || '')
        ),
        el('div', { class: 'text-sm text-text-secondary' }, ratingLabel(rating))
      ),
      el('p', { class: 'text-sm text-text-secondary mt-2 line-clamp-2' }, skill.description || '')
    );

    card.append(logo, body);
    card.addEventListener('click', () => openSkillModal(skill, rating));
    return card;
  }

  function renderSkillsGrid(skills, ratings, categoriesMap) {
    const main = $id('skills-main');
    if (!main) return;
    main.innerHTML = '';

    // group by categoryId or fallback to category
    const groups = {};
    skills.forEach(s => {
      if (s.visible === false) return;
      const key = s.categoryId || (s.category ? s.category.toLowerCase() : 'uncategorized');
      if (!groups[key]) groups[key] = { title: categoriesMap[key] || s.category || key, items: [] };
      groups[key].items.push(s);
    });

    const container = el('div', { class: 'space-y-8' });

    Object.keys(groups).forEach(key => {
      const group = groups[key];
      group.items.sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.name || '').localeCompare(b.name || ''));
      const section = el('section', { class: 'bg-secondary p-4 rounded-lg border border-border-color' });

      const header = el('header', { class: 'mb-4 flex items-center justify-between' },
        el('h3', { class: 'text-lg font-bold text-accent' }, group.title),
        el('div', { class: 'text-sm text-text-secondary' }, `${group.items.length} skill${group.items.length !== 1 ? 's' : ''}`)
      );
      section.append(header);

      const grid = el('div', { class: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' });
      group.items.forEach(skill => {
        const rating = (ratings && ratings[skill.id] !== undefined) ? ratings[skill.id] : 0;
        grid.append(createSkillCard(skill, rating));
      });
      section.append(grid);
      container.append(section);
    });

    main.append(container);

    // stats
    const totalSkills = (skills || []).filter(s => s.visible !== false).length;
    const totalCategories = Object.keys(groups).length;
    const experienceYears = computeExperienceYearsFromSkills(skills) || 0;
    renderStats(totalSkills, totalCategories, experienceYears);
  }

  // Modal helpers
  function openSkillModal(skill, rating) {
    const modal = $id('skill-modal');
    if (!modal) {
      console.warn('Modal (id=skill-modal) not found in DOM.');
      return;
    }
    if ($id('modal-img')) $id('modal-img').src = skill.imageUrl || 'https://via.placeholder.com/80?text=Skill';
    if ($id('modal-title')) $id('modal-title').textContent = skill.name || '';
    if ($id('modal-category')) $id('modal-category').textContent = skill.category || (skill.categoryId || 'Uncategorized');
    if ($id('modal-description')) $id('modal-description').textContent = skill.description || '';

    const ratingNormalized = Math.max(0, Math.min(10, Number(rating || 0)));
    if ($id('modal-rating-bar')) $id('modal-rating-bar').style.width = `${(ratingNormalized/10)*100}%`;
    if ($id('modal-rating-text')) $id('modal-rating-text').textContent = `${ratingNormalized}/10 • ${ratingLabel(ratingNormalized)}`;

    if ($id('modal-start-date')) $id('modal-start-date').textContent = skill.startDate || '—';

    // projects
    const projEl = $id('modal-projects');
    if (projEl) {
      projEl.innerHTML = '';
      (skill.projects || []).forEach(p => projEl.append(el('li', { class: 'text-text-secondary' }, p)));
      if (!(skill.projects || []).length) projEl.append(el('li', { class: 'text-text-secondary' }, 'No projects listed.'));
    }

    // resources
    const resEl = $id('modal-resources');
    if (resEl) {
      resEl.innerHTML = '';
      (skill.resources || []).forEach(r => {
        const a = el('a', { href: r.url || '#', target: '_blank', rel: 'noopener noreferrer', class: 'block text-sm' }, r.name || r.url || 'link');
        resEl.append(el('div', {}, a));
      });
      if (!(skill.resources || []).length) resEl.append(el('div', { class: 'text-text-secondary' }, 'No resources available.'));
    }

    modal.classList.remove('hidden');
    const close = $id('close-modal-btn');
    if (close) close.focus();
  }

  function setupModalClose() {
    const modal = $id('skill-modal');
    if (!modal) return;
    const closeBtn = $id('close-modal-btn');
    const backdrop = $id('modal-backdrop');
    function close() { modal.classList.add('hidden'); }
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !modal.classList.contains('hidden')) close(); });
  }

  // -----------------------------
  // User header/footer population
  // -----------------------------
  function populateHeader(user) {
    if (!user) return;
    if ($id('user-name')) $id('user-name').textContent = user.name || user.nickname || '—';
    if ($id('user-title')) $id('user-title').textContent = user.title || '';
    if ($id('user-about')) $id('user-about').textContent = user.about || '';
    if ($id('profile-picture')) {
      $id('profile-picture').src = user.profilePicture || '';
      $id('profile-picture').alt = user.name || 'Profile';
    }
    if ($id('user-location')) $id('user-location').textContent = user.location || '';

    // CV / download button (index.html uses a button)
    const cvBtn = $id('download-cv-btn');
    if (cvBtn) {
      cvBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const cv = user.cvUrl || '';
        if (!cv) return alert('CV not available.');
        window.open(cv, '_blank', 'noopener');
      });
    }

   // social links container
const social = $id('social-links');
if (social) {
  social.innerHTML = ''; // clear existing content to avoid duplicates

  const iconMap = {
    github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M12 .5C5.648.5.5 5.648.5 12c0 5.086 3.292 9.389 7.86 10.912.575.105.785-.25.785-.556v-2.041c-3.197.695-3.87-1.37-3.87-1.37-.523-1.327-1.277-1.68-1.277-1.68-1.043-.714.08-.699.08-.699 1.152.081 1.758 1.184 1.758 1.184 1.025 1.756 2.688 1.249 3.342.954.103-.741.401-1.25.73-1.538-2.553-.29-5.238-1.276-5.238-5.675 0-1.254.448-2.277 1.183-3.079-.119-.291-.513-1.459.112-3.041 0 0 .964-.309 3.16 1.176a10.98 10.98 0 012.878-.387c.977.005 1.962.132 2.878.387 2.197-1.485 3.16-1.176 3.16-1.176.625 1.582.231 2.75.113 3.041.737.802 1.183 1.825 1.183 3.079 0 4.409-2.69 5.381-5.253 5.665.412.356.79 1.056.79 2.133v3.163c0 .31.209.667.793.555C20.713 21.388 24 17.086 24 12 24 5.648 18.352.5 12 .5z"/></svg>`,
    linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M19 0h-14c-2.762 0-5 2.238-5 5v14c0 2.762 2.238 5 5 5h14c2.762 0 5-2.238 5-5v-14c0-2.762-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.269c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75c.966 0 1.75.784 1.75 1.75s-.784 1.75-1.75 1.75zm13.5 11.269h-3v-5.5c0-1.379-.028-3.155-1.922-3.155-1.925 0-2.218 1.504-2.218 3.055v5.6h-3v-10h2.879v1.367h.041c.401-.759 1.379-1.559 2.841-1.559 3.039 0 3.599 2.001 3.599 4.6v5.592z"/></svg>`,
    twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M24 4.557a9.82 9.82 0 01-2.828.775 4.936 4.936 0 002.165-2.724 9.875 9.875 0 01-3.127 1.195A4.924 4.924 0 0016.616 3c-2.732 0-4.949 2.217-4.949 4.949 0 .387.044.764.128 1.125-4.11-.207-7.758-2.175-10.2-5.165a4.934 4.934 0 00-.67 2.486c0 1.715.873 3.23 2.2 4.122a4.909 4.909 0 01-2.24-.618v.063c0 2.396 1.705 4.395 3.966 4.85a4.936 4.936 0 01-2.233.085c.63 1.968 2.445 3.4 4.6 3.442A9.87 9.87 0 010 19.54a13.933 13.933 0 007.548 2.212c9.056 0 14.01-7.506 14.01-14.01 0-.213-.005-.425-.014-.636A10.025 10.025 0 0024 4.557z"/></svg>`,
    email: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
    phone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M6.6 10.8c1.8 3.5 4.7 6.4 8.2 8.2l2.6-2.6c.3-.3.8-.4 1.2-.2 1.3.5 2.8.8 4.3.8.6 0 1 .4 1 1v3.5c0 .6-.4 1-1 1C10.9 20 4 13.1 4 4.6 4 4 4.4 3.6 5 3.6H8.5c.6 0 1 .4 1 1 0 1.6.3 3 .8 4.3.2.4.1.9-.2 1.2L6.6 10.8z"/></svg>`,
    website: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13h-3v3h-4v-3H7v-4h3V8h4v3h3v4z"/></svg>`,
    default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`
  };

  (user.socialLinks || []).forEach(link => {
    const key = (link.platform || '').toLowerCase();
    const iconSvg = iconMap[key] || iconMap.default;

    const a = el('a', {
      href: link.url || '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: `${link.platform || ''} • ${link.username || ''}`,
      'aria-label': `${link.platform || ''} • ${link.username || ''}`,
      class: 'flex items-center gap-2 px-3 py-2 rounded-md bg-accent bg-opacity-10 text-accent text-sm font-medium hover:bg-accent hover:text-white transition-colors'
    },
      el('span', { class: 'inline-block', html: iconSvg }),
      // username visible on sm+ screens
      el('span', { class: 'hidden sm:inline-block' }, link.username || link.platform || '')
    );

    social.append(a);
  });
}



    // footer name
    if ($id('footer-name')) $id('footer-name').textContent = user.name || '—';
    if ($id('copyright-year')) $id('copyright-year').textContent = String((new Date()).getFullYear());
  }

  // -----------------------------
  // Init: fetch all JSONs in parallel & render
  // -----------------------------
  async function init() {
    console.info('script.js initializing: fetching user.json, skills.json, ratings.json...');

    showLoader('Initializing skill matrix... Accessing data nodes...');

    let userData = null, skillsData = null, ratingsData = null;
    let fetchErrors = {};

    try {
      const promises = await Promise.allSettled([
        fetchJSON('user.json'),
        fetchJSON('skills.json'),
        fetchJSON('ratings.json')
      ]);

      // Map results
      const [userRes, skillsRes, ratingsRes] = promises;
      if (userRes && userRes.status === 'fulfilled') userData = userRes.value;
      if (skillsRes && skillsRes.status === 'fulfilled') skillsData = skillsRes.value;
      if (ratingsRes && ratingsRes.status === 'fulfilled') ratingsData = ratingsRes.value;

      // capture failures for logging
      if (userRes && userRes.status === 'rejected') fetchErrors.user = String(userRes.reason);
      if (skillsRes && skillsRes.status === 'rejected') fetchErrors.skills = String(skillsRes.reason);
      if (ratingsRes && ratingsRes.status === 'rejected') fetchErrors.ratings = String(ratingsRes.reason);
    } catch (err) {
      console.error('Unexpected error during fetch', err);
      fetchErrors.general = String(err);
    }

    // Fallbacks if necessary
    if (!userData) { console.warn('user.json not loaded — falling back to embedded user data.'); userData = FALLBACK_USER; }
    if (!skillsData) { console.warn('skills.json not loaded — falling back to embedded skills.'); skillsData = FALLBACK_SKILLS; }
    if (!ratingsData) { console.warn('ratings.json not loaded — falling back to embedded ratings.'); ratingsData = FALLBACK_RATINGS; }

    // Validate shapes
    if (!Array.isArray(skillsData)) {
      console.error('skills.json must be an array. Got:', skillsData);
      showLoader('Error: skills.json malformed — check console.');
      return;
    }
    if (!ratingsData || typeof ratingsData !== 'object' || Array.isArray(ratingsData)) {
      console.error('ratings.json must be an object mapping ids to numbers. Got:', ratingsData);
      showLoader('Error: ratings.json malformed — check console.');
      return;
    }

    // Build categories map from userData.skillCategories if present
    const categoriesMap = {};
    (userData.skillCategories || []).forEach(cat => {
      if (cat && cat.id) categoriesMap[cat.id] = cat.name || cat.title || cat.id;
    });

    // If skills have categoryId but not category, populate category text from categoriesMap
    skillsData.forEach(s => {
      if (!s.category && s.categoryId && categoriesMap[s.categoryId]) s.category = categoriesMap[s.categoryId];
    });

    // Populate header/profile using user.json
    try {
      populateHeader(userData);
    } catch (e) {
      console.warn('populateHeader error', e);
    }

    // If user.experience.totalYears exists, use it for the experience stat; otherwise compute from skills
    const experienceYears = (userData && userData.experience && Number(userData.experience.totalYears)) || computeExperienceYearsFromSkills(skillsData) || 0;

    // Render grid and stats (renderSkillsGrid computes its own experience; we'll set explicit)
    renderSkillsGrid(skillsData, ratingsData, categoriesMap);
    // override experience-years if user provided
    if ($id('experience-years')) $id('experience-years').textContent = `${experienceYears}+`;

    // Modal close wiring
    setupModalClose();

    // Log fetch failures to console for debugging
    if (Object.keys(fetchErrors).length) {
      console.info('There were fetch issues (see warnings/errors above). fetchErrors:', fetchErrors);
    } else {
      console.info('All JSONs loaded successfully.');
    }
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
