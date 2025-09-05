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
    "about": "Passionate cybersecurity enthusiast with a strong foundation in full-stack development.",
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
      social.innerHTML = '';
      (user.socialLinks || []).forEach(link => {
        const a = el('a', { href: link.url || '#', target: '_blank', rel: 'noopener noreferrer', title: link.platform || link.username || '' },
          el('span', { class: 'sr-only' }, `${link.platform || ''}: ${link.username || ''}`),
          // visible label - use platform or username
          el('div', { class: 'px-3 py-2 rounded-md bg-accent bg-opacity-10 text-accent text-sm font-medium' }, link.platform || link.username || link.url)
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
