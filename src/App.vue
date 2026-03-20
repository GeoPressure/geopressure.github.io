<script setup>
import { computed, onMounted, ref } from "vue";
import catalog from "./data/projects.json";

const projects = ref(
  Array.isArray(catalog.projects)
    ? catalog.projects
    : (catalog.categories ?? []).flatMap((category) => category.projects ?? []),
);
const starsByRepo = ref({});

const GITHUB_REPO_REGEX = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/;
const numberFormatter = new Intl.NumberFormat("en-US");

const normalizeText = (value) => {
  return typeof value === "string" ? value.trim() : "";
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

const getRepoPathFromUrl = (url) => {
  const match = normalizeText(url).match(GITHUB_REPO_REGEX);
  if (!match) {
    return null;
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, "");
  return `${owner}/${repo}`;
};

const getProjectRepoPath = (project) => {
  return getRepoPathFromUrl(
    getProjectGithub(project) ?? getProjectHomepage(project),
  );
};

const getProjectStars = (project) => {
  const repoPath = getProjectRepoPath(project);
  if (!repoPath) {
    return null;
  }

  const stars = starsByRepo.value[repoPath];
  return typeof stars === "number" ? stars : null;
};

const allProjects = computed(() => {
  return projects.value
    .map((project, index) => {
      return {
        key: `${project.name}-${index}`,
        project,
      };
    })
    .sort((a, b) => {
      const starsA = getProjectStars(a.project);
      const starsB = getProjectStars(b.project);
      const rankA = starsA === null ? -1 : starsA;
      const rankB = starsB === null ? -1 : starsB;

      return rankB - rankA;
    });
});

const totalProjects = computed(() => allProjects.value.length);

const formatStars = (value) => {
  return numberFormatter.format(value);
};

const loadStars = async () => {
  const repoPaths = [
    ...new Set(
      projects.value
        .map((project) => getProjectRepoPath(project))
        .filter(Boolean),
    ),
  ];

  if (repoPaths.length === 0) {
    return;
  }

  const results = await Promise.all(
    repoPaths.map(async (repoPath) => {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${repoPath}`,
          {
            headers: {
              Accept: "application/vnd.github+json",
            },
          },
        );

        if (!response.ok) {
          return [repoPath, null];
        }

        const repo = await response.json();
        return [
          repoPath,
          typeof repo.stargazers_count === "number"
            ? repo.stargazers_count
            : null,
        ];
      } catch {
        return [repoPath, null];
      }
    }),
  );

  const nextStars = {};
  for (const [repoPath, stars] of results) {
    if (typeof stars === "number") {
      nextStars[repoPath] = stars;
    }
  }

  starsByRepo.value = nextStars;
};

onMounted(() => {
  void loadStars();
});
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
    <header
      class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1
          class="font-serif text-5xl leading-tight text-slate-900 sm:text-6xl"
        >
          GeoPressure Suite
        </h1>
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
          ></a>

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
              :src="entry.project.logo"
              :alt="`${entry.project.name} logo`"
              class="logo-image"
              loading="lazy"
            />

            <div class="flex items-start justify-between gap-3">
              <h3 class="text-xl font-semibold text-slate-900">
                {{ entry.project.name }}
              </h3>

              <div class="flex items-center">
                <span
                  v-if="getProjectStars(entry.project) !== null"
                  class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                >
                  <i class="bi bi-star-fill text-[10px]" aria-hidden="true"></i>
                  {{ formatStars(getProjectStars(entry.project)) }}
                </span>
              </div>
            </div>

            <p class="mt-0.5 text-sm leading-relaxed text-slate-600">
              {{ entry.project.description }}
            </p>
          </div>
        </article>
      </div>

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
