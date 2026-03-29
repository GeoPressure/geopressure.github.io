import { promises as fs } from "node:fs";
import path from "node:path";

const ORG = "GeoPressure";
const API_BASE = "https://api.github.com";
const DEFAULT_LOGO = "/logos/geopressure.png";
const OUTPUT_FILE = path.resolve("src/data/projects.json");
const LOGO_DIR = path.resolve("public/logos");
const EXCLUDED_REPOS = new Set([".github", "geopressure.github.io"]);

const normalizeKey = (value) => {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const getHeaders = () => {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "geopressure-project-sync",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `GitHub API request failed (${response.status}) for ${url}\n${details}`,
    );
  }

  return response.json();
};

const loadOrgRepos = async () => {
  const repos = [];
  let page = 1;

  while (true) {
    const url = `${API_BASE}/orgs/${ORG}/repos?type=public&sort=full_name&per_page=100&page=${page}`;
    const batch = await fetchJson(url);

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    repos.push(...batch);

    if (batch.length < 100) {
      break;
    }

    page += 1;
  }

  return repos;
};

const loadLogoMap = async () => {
  const entries = await fs.readdir(LOGO_DIR, { withFileTypes: true });
  const pairs = entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const ext = path.extname(entry.name);
      const base = path.basename(entry.name, ext);
      return {
        key: normalizeKey(base),
        file: entry.name,
      };
    })
    .filter((entry) => entry.key.length > 0)
    .sort((a, b) => a.file.localeCompare(b.file));

  const map = new Map();
  for (const pair of pairs) {
    if (!map.has(pair.key)) {
      map.set(pair.key, pair.file);
    }
  }

  return map;
};

const toProject = (repo, logoMap) => {
  if (!Number.isFinite(repo?.stargazers_count)) {
    throw new Error(`Missing numeric stargazers_count for ${repo?.full_name}`);
  }

  const logoMatch = logoMap.get(normalizeKey(repo.name));
  const homepage = String(repo.homepage ?? "").trim();

  return {
    name: repo.name,
    description: String(repo.description ?? "").trim(),
    logo: logoMatch ? `/logos/${logoMatch}` : DEFAULT_LOGO,
    homepage: homepage || repo.html_url,
    github: repo.html_url,
    stars: repo.stargazers_count,
    fullName: repo.full_name,
    owner: repo.owner?.login ?? ORG,
    repo: repo.name,
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    language: repo.language,
    license: repo.license?.spdx_id ?? null,
    defaultBranch: repo.default_branch ?? null,
    openIssues: Number.isFinite(repo.open_issues_count)
      ? repo.open_issues_count
      : 0,
    forks: Number.isFinite(repo.forks_count) ? repo.forks_count : 0,
    watchers: Number.isFinite(repo.watchers_count) ? repo.watchers_count : 0,
    sizeKb: Number.isFinite(repo.size) ? repo.size : 0,
    createdAt: repo.created_at ?? null,
    updatedAt: repo.updated_at ?? null,
    pushedAt: repo.pushed_at ?? null,
    visibility: repo.visibility ?? "public",
    isTemplate: Boolean(repo.is_template),
    hasPages: Boolean(repo.has_pages),
    hasWiki: Boolean(repo.has_wiki),
    hasProjects: Boolean(repo.has_projects),
    hasDiscussions: Boolean(repo.has_discussions),
    hasIssues: Boolean(repo.has_issues),
  };
};

const main = async () => {
  const [repos, logoMap] = await Promise.all([loadOrgRepos(), loadLogoMap()]);

  const filtered = repos.filter((repo) => {
    return (
      repo.visibility === "public" &&
      !repo.archived &&
      !repo.fork &&
      !EXCLUDED_REPOS.has(repo.name)
    );
  });

  const projects = filtered
    .map((repo) => toProject(repo, logoMap))
    .sort((a, b) => {
      if (b.stars !== a.stars) {
        return b.stars - a.stars;
      }
      return a.name.localeCompare(b.name);
    });

  const output = {
    generatedAt: new Date().toISOString().slice(0, 10),
    projects,
  };

  await fs.writeFile(`${OUTPUT_FILE}`, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`Wrote ${projects.length} projects to ${OUTPUT_FILE}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
