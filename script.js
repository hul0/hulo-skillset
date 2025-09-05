(async function () {
  "use strict";

  // --- DOM ELEMENTS ---
  const skillsMain = document.getElementById("skills-main");
  const loader = document.getElementById("loader");
  const modal = document.getElementById("skill-modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const copyrightYear = document.getElementById("copyright-year");

  // User Profile Elements
  const profilePicture = document.getElementById("profile-picture");
  const userName = document.getElementById("user-name");
  const userTitle = document.getElementById("user-title");
  const userLocation = document.getElementById("user-location");
  const userAbout = document.getElementById("user-about");
  const socialLinks = document.getElementById("social-links");
  const downloadCvBtn = document.getElementById("download-cv-btn");
  const footerName = document.getElementById("footer-name");

  // Stats Elements
  const totalSkillsEl = document.getElementById("total-skills");
  const totalCategoriesEl = document.getElementById("total-categories");
  const experienceYearsEl = document.getElementById("experience-years");

  // Initialize copyright year
  copyrightYear.textContent = new Date().getFullYear();

  // --- UTILITY FUNCTIONS ---

  async function fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${url}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  function createPlaceholderSvg(name) {
    const initials = name.substring(0, 2).toUpperCase();
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-12 h-12">
        <rect width="100" height="100" rx="15" fill="#0a0f14"/>
        <text x="50" y="50" font-family="JetBrains Mono, monospace" font-size="40" fill="#00f5d4" text-anchor="middle" dy=".3em">${initials}</text>
        <rect width="100" height="100" rx="15" fill="none" stroke="#1a222c" stroke-width="2"/>
      </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  function calculateYearsSince(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    return Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
  }

  function formatExperienceDuration(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    const years = today.getFullYear() - start.getFullYear();
    const months = today.getMonth() - start.getMonth();
    const totalMonths = years * 12 + months;
    const displayYears = Math.floor(totalMonths / 12);
    const displayMonths = totalMonths % 12;
    return `${start.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} (~${displayYears}y ${displayMonths}m)`;
  }

  // --- SOCIAL ICONS ---
  const socialIcons = {
    github: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
    linkedin: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    twitter: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>`,
    email: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`,
    website: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>`,
    instagram: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    phone: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>`
  };

  // --- RENDERING FUNCTIONS ---

  function renderUserProfile(userData) {
    // Profile Picture
    profilePicture.src = userData.profilePicture || createPlaceholderSvg(userData.name);
    profilePicture.alt = `${userData.name} Profile Picture`;

    // Basic Info
    userName.textContent = userData.name;
    userTitle.textContent = userData.title;
    userLocation.textContent = `📍 ${userData.location}`;
    userAbout.textContent = userData.about;
    footerName.textContent = userData.name;

    // Social Links
    socialLinks.innerHTML = "";
    userData.socialLinks.forEach(link => {
      const icon = socialIcons[link.platform] || socialIcons.website;
      const socialLink = document.createElement("a");
      socialLink.href = link.url;
      socialLink.className = "social-link";
      socialLink.target = "_blank";
      socialLink.rel = "noopener noreferrer";
      socialLink.title = link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
      socialLink.innerHTML = icon;
      socialLinks.appendChild(socialLink);
    });

    // CV Download
    if (userData.cvUrl) {
      downloadCvBtn.href = userData.cvUrl;
      downloadCvBtn.target = "_blank";
      downloadCvBtn.rel = "noopener noreferrer";
    } else {
      downloadCvBtn.addEventListener("click", (e) => {
        e.preventDefault();
        alert("CV download link not configured yet!");
      });
    }
  }

  function renderCategorySection(category, categorySkills) {
    const section = document.createElement("section");
    section.className = "mb-12";
    section.innerHTML = `
      <div class="category-header">
        <h2 class="category-title">
          ${category.name}
          <span class="category-count">${categorySkills.length}</span>
        </h2>
        <p class="category-description">${category.description}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="category-${category.id}">
      </div>
    `;

    const grid = section.querySelector(`#category-${category.id}`);
    categorySkills.forEach(skill => {
      const card = renderSkillCard(skill);
      grid.appendChild(card);
    });

    return section;
  }

  function renderSkillCard(skill) {
    const card = document.createElement("button");
    card.className = "skill-card text-left p-5 rounded-lg flex flex-col";
    card.dataset.skillId = skill.id;

    const ratingPercentage = (skill.rating / 10) * 100;
    const experienceDate = new Date(skill.startDate).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "short" }
    );

    card.innerHTML = `
      <div class="flex items-center space-x-4 mb-4">
        <img src="${
          skill.imageUrl || createPlaceholderSvg(skill.name)
        }" alt="${
      skill.name
    } icon" class="w-12 h-12 rounded-md object-cover flex-shrink-0">
        <div>
          <h3 class="text-xl font-bold text-white">${skill.name}</h3>
          <p class="text-xs text-accent">${skill.category}</p>
          <p class="text-xs text-text-secondary">Since ${experienceDate}</p>
        </div>
      </div>
      <div class="mt-auto">
        <p class="text-xs text-accent mb-1">Proficiency: ${skill.rating}/10</p>
        <div class="rating-bar-bg w-full h-2 rounded-full">
          <div class="rating-bar-fill h-full rounded-full" style="width: 0%;" data-rating="${ratingPercentage}"></div>
        </div>
      </div>
    `;

    return card;
  }

  function updateStats(skills, categories) {
    totalSkillsEl.textContent = skills.length;
    totalCategoriesEl.textContent = categories.length;
    
    // Calculate years of experience from earliest start date
    const earliestDate = skills.reduce((earliest, skill) => {
      const skillDate = new Date(skill.startDate);
      return skillDate < earliest ? skillDate : earliest;
    }, new Date());
    
    experienceYearsEl.textContent = `${calculateYearsSince(earliestDate)}+`;
  }

  // --- MODAL FUNCTIONS ---

  function populateModal(skill) {
    document.getElementById("modal-title").textContent = skill.name;
    document.getElementById("modal-category").textContent = skill.category;
    document.getElementById("modal-description").textContent = skill.description;
    document.getElementById("modal-img").src = skill.imageUrl || createPlaceholderSvg(skill.name);

    document.getElementById("modal-start-date").textContent = formatExperienceDuration(skill.startDate);

    const ratingPercentage = (skill.rating / 10) * 100;
    document.getElementById("modal-rating-bar").style.width = `${ratingPercentage}%`;
    document.getElementById("modal-rating-text").textContent = `${skill.rating}/10 (${Math.round(ratingPercentage)}%)`;

    const projectsList = document.getElementById("modal-projects");
    projectsList.innerHTML =
      skill.projects.map((p) => `<li>${p}</li>`).join("") ||
      "<li>No specific projects listed yet.</li>";

    const resourcesList = document.getElementById("modal-resources");
    resourcesList.innerHTML =
      skill.resources
        .map(
          (r) => `
          <li>
            <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="flex items-center space-x-3 text-text-secondary hover:text-accent transition-colors">
              <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 001.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
              <span>${r.name}</span>
            </a>
          </li>`
        )
        .join("") || "<li>No resources listed yet.</li>";
  }

  function showModal(skill) {
    populateModal(skill);
    modal.classList.remove("hidden");
    modal.classList.remove("fade-out");
    modal.classList.add("fade-in");
    document.getElementById("modal-content").classList.remove("slide-down-out");
    document.getElementById("modal-content").classList.add("slide-up-in");
    document.body.style.overflow = "hidden";
  }

  function hideModal() {
    modal.classList.remove("fade-in");
    modal.classList.add("fade-out");
    document.getElementById("modal-content").classList.remove("slide-up-in");
    document.getElementById("modal-content").classList.add("slide-down-out");
    setTimeout(() => {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    }, 400);
  }

  // --- MAIN INITIALIZATION ---
  try {
    const [skillsData, ratingsData, userData] = await Promise.all([
      fetchData("./skills.json"),
      fetchData("./ratings.json"),
      fetchData("./user.json"),
    ]);

    // Enhance skills with ratings
    const skills = skillsData.map((skill) => ({
      ...skill,
      rating: ratingsData[skill.id] || 0,
    }));

    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {});

    // Get unique categories with metadata
    const categories = userData.skillCategories.filter(cat => 
      skillsByCategory[cat.id] && skillsByCategory[cat.id].length > 0
    );

    // Render user profile
    renderUserProfile(userData);

    // Update stats
    updateStats(skills, categories);

    // Remove loader and render categories
    loader.remove();

    categories.forEach((category) => {
      const categorySkills = skillsByCategory[category.id];
      if (categorySkills && categorySkills.length > 0) {
        const categorySection = renderCategorySection(category, categorySkills);
        skillsMain.appendChild(categorySection);
      }
    });

    // Animate rating bars on scroll into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bar = entry.target.querySelector(".rating-bar-fill");
            if (bar) {
              setTimeout(() => {
                bar.style.width = `${bar.dataset.rating}%`;
              }, 200);
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll(".skill-card").forEach((card) => observer.observe(card));

    // Setup modal event listeners
    skillsMain.addEventListener("click", (e) => {
      const card = e.target.closest(".skill-card");
      if (card) {
        const skillId = card.dataset.skillId;
        const selectedSkill = skills.find((s) => s.id === skillId);
        if (selectedSkill) showModal(selectedSkill);
      }
    });

    closeModalBtn.addEventListener("click", hideModal);
    modalBackdrop.addEventListener("click", hideModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        hideModal();
      }
    });

  } catch (error) {
    console.error("Failed to initialize skills portfolio:", error);
    loader.innerHTML = `
      <div class="text-center py-16">
        <p class="text-red-500 mb-4">⚠️ Error: Could not load portfolio data</p>
        <p class="text-text-secondary text-sm">Please check that all JSON files are present and valid.</p>
        <details class="mt-4 text-left max-w-md mx-auto">
          <summary class="text-accent cursor-pointer">Error Details</summary>
          <pre class="text-xs text-text-secondary mt-2 p-2 bg-bg-secondary rounded">${error.message}</pre>
        </details>
      </div>`;
  }
})();