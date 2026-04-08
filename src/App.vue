<script setup>
import { computed, ref } from "vue";
import catalog from "./data/projects.json";

const projects = ref(
  Array.isArray(catalog.projects)
    ? catalog.projects
    : (catalog.categories ?? []).flatMap((category) => category.projects ?? []),
);
const numberFormatter = new Intl.NumberFormat("en-US");
const DEFAULT_PROJECT_LOGO = "/logos/geopressure.png";

const normalizeText = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const getProjectLogo = (project) => {
  const logo = normalizeText(project.logo);
  return logo || DEFAULT_PROJECT_LOGO;
};

const handleLogoError = (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)) {
    return;
  }

  if (image.dataset.fallbackApplied === "true") {
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = DEFAULT_PROJECT_LOGO;
};

const getProjectHomepage = (project) => {
  const homepage = normalizeText(project.homepage);
  if (homepage) {
    return homepage;
  }

  const github = normalizeText(project.github);
  return github || null;
};

const getProjectGithub = (project) => {
  const github = normalizeText(project.github);
  return github || null;
};

const getProjectStargazers = (project) => {
  const github = getProjectGithub(project);
  return github ? `${github.replace(/\/$/, "")}/stargazers` : null;
};

const getProjectStars = (project) => {
  return Number.isFinite(project.stars) ? project.stars : null;
};

const allProjects = computed(() => {
  return projects.value.map((project, index) => {
    return {
      key: `${project.name}-${index}`,
      project,
    };
  });
});

const totalProjects = computed(() => allProjects.value.length);

const faqItems = [
  {
    question: "What is GeoPressure?",
    answerHtml:
      "GeoPressure is an open-source suite for researchers studying bird migration with multi-sensor geolocators that include atmospheric pressure data. It helps reconstruct bird trajectories from geolocator measurements.",
  },
  {
    question: "Where should I start?",
    answerHtml:
      'Start with the <a href="https://geopressure.org/GeoPressureManual/" target="_blank" rel="noopener noreferrer">GeoPressureManual</a> if you want to learn how the workflow works and how to start your analysis. If you are interested in visualizing or downloading example data, check out the <a href="https://geopressure.org/GeoLocatorExplorer/" target="_blank" rel="noopener noreferrer">GeoLocatorExplorer</a>.',
  },
  {
    question: "What data are required for analysis?",
    answerHtml:
      'The core requirement for <a href="https://geopressure.org/GeoPressureR/" target="_blank" rel="noopener noreferrer">GeoPressureR</a> is a continuous pressure time series from a geolocator, ideally sampled at better than 1-hour resolution. Acceleration, light data, and known deployment or retrieval locations can also help in specific parts of the workflow.',
  },
  {
    question: "What is the difference between GeoPressureR and GeoLocatoR?",
    answerHtml:
      '<a href="https://geopressure.org/GeoPressureR/" target="_blank" rel="noopener noreferrer">GeoPressureR</a> is the main analysis R package for project-level pressure-based geolocation and trajectory modeling. <a href="https://raphaelnussbaumer.com/GeoLocatoR/" target="_blank" rel="noopener noreferrer">GeoLocatoR</a> is an R package for tag-level data packaging, handling, and sharing through GeoLocator Data Packages. Use GeoLocatoR to organize and standardize geolocator data, and GeoPressureR to run the analysis.',
  },
];

const formatStars = (value) => {
  return numberFormatter.format(value);
};
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
    <header
      class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <div class="brand-title">
          <img
            src="/logos/geopressure.png"
            alt="GeoPressure logo"
            class="site-logo"
            decoding="async"
          />
          <h1
            class="font-serif text-5xl leading-tight text-slate-900 sm:text-6xl"
          >
            GeoPressure Suite
          </h1>
        </div>
        <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Open tools and shared standards for studying bird movement with
          multi-sensor geolocators, from data formats to analysis and
          visualization workflows.
        </p>
      </div>
      <div class="sm:pt-1">
        <a
          href="https://github.com/GeoPressure"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          <i class="bi bi-github text-[14px]" aria-hidden="true"></i>
          <span>GeoPressure on GitHub</span>
        </a>
      </div>
    </header>

    <main class="space-y-5" aria-label="GeoPressure repositories">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="(entry, index) in allProjects"
          :key="entry.key"
          class="card animate-rise"
          :style="{ animationDelay: `${index * 40}ms` }"
        >
          <a
            :href="getProjectHomepage(entry.project)"
            target="_blank"
            rel="noopener noreferrer"
            class="card-overlay"
            :aria-label="`Open ${entry.project.name}`"
          >
            <span class="sr-only">{{ entry.project.name }}</span>
          </a>

          <div class="card-content">
            <a
              v-if="getProjectGithub(entry.project)"
              :href="getProjectGithub(entry.project)"
              target="_blank"
              rel="noopener noreferrer"
              class="card-github-button meta-link card-sub-link inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
              :aria-label="`Open ${entry.project.name} on GitHub`"
            >
              <i class="bi bi-github text-[13px]" aria-hidden="true"></i>
            </a>

            <img
              :src="getProjectLogo(entry.project)"
              :alt="`${entry.project.name} logo`"
              class="logo-image"
              loading="lazy"
              @error="handleLogoError"
            />

            <div class="flex items-start justify-between gap-3">
              <h3 class="text-xl font-semibold text-slate-900">
                <a
                  :href="getProjectHomepage(entry.project)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="card-title-link card-sub-link"
                >
                  {{ entry.project.name }}
                </a>
              </h3>

              <div class="flex items-center">
                <a
                  v-if="getProjectStars(entry.project) !== null"
                  :href="getProjectStargazers(entry.project)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                  :aria-label="`View ${entry.project.name} stargazers on GitHub`"
                >
                  <i class="bi bi-star-fill text-[10px]" aria-hidden="true"></i>
                  {{ formatStars(getProjectStars(entry.project)) }}
                </a>
              </div>
            </div>

            <p class="mt-0.5 text-sm leading-relaxed text-slate-600">
              {{ entry.project.description }}
            </p>
          </div>
        </article>
      </div>
      <section class="faq-section">
        <div class="faq-header">
          <h2 class="font-serif text-5xl text-slate-900">FAQ</h2>
        </div>
        <div class="faq-grid">
          <article
            v-for="item in faqItems"
            :key="item.question"
            class="faq-item"
          >
            <h3 class="text-base font-semibold text-slate-900">
              {{ item.question }}
            </h3>
            <p
              class="text-sm leading-relaxed text-slate-600 faq-answer"
              v-html="item.answerHtml"
            ></p>
          </article>
        </div>
      </section>
    </main>

    <footer class="mt-10 flex justify-center border-t border-slate-200 pt-6">
      <a
        href="https://www.vogelwarte.ch/en/"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-3 text-center text-slate-600 transition hover:text-slate-900"
      >
        <span class="text-xs uppercase tracking-wide">Supported by</span>
        <img
          src="https://www.vogelwarte.ch/wp-content/uploads/2023/10/logo.svg"
          alt="Swiss Ornithological Institute (Vogelwarte) logo"
          class="h-10 w-auto"
          loading="lazy"
          decoding="async"
        />
      </a>
    </footer>
  </div>
</template>
