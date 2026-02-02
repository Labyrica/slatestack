import { readFileSync } from 'fs';
import { join } from 'path';
import * as semver from 'semver';
import type { UpdateCheckResult, ChangelogResult, GitHubRelease } from './update.types.js';

// Constants
const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'Labyrica';
const REPO_NAME = 'slatestack';

// Cache for GitHub API responses (avoid rate limiting - 60 req/hour unauthenticated)
let releaseCache: { data: GitHubRelease; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Read current version from version.json
 */
export function getCurrentVersion(): string {
  const versionPath = join(process.cwd(), 'version.json');
  const versionData = JSON.parse(readFileSync(versionPath, 'utf-8'));
  return versionData.version;
}

/**
 * Fetch latest release from GitHub API with caching
 */
async function fetchLatestRelease(): Promise<GitHubRelease> {
  // Check cache
  if (releaseCache && Date.now() - releaseCache.timestamp < CACHE_TTL) {
    return releaseCache.data;
  }

  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
    {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Slatestack-Update-Checker'
      }
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No releases found in upstream repository');
    }
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Try again later.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json() as GitHubRelease;
  releaseCache = { data, timestamp: Date.now() };
  return data;
}

/**
 * Check for available updates by comparing current version with latest release
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentVersion();
  const release = await fetchLatestRelease();

  // Clean version strings (remove 'v' prefix if present)
  const current = semver.clean(currentVersion);
  const latest = semver.clean(release.tag_name);

  if (!current || !latest) {
    throw new Error(`Invalid version format: current=${currentVersion}, latest=${release.tag_name}`);
  }

  const updateAvailable = semver.gt(latest, current);

  let versionDiff: 'major' | 'minor' | 'patch' | null = null;
  if (updateAvailable) {
    if (semver.major(latest) > semver.major(current)) {
      versionDiff = 'major';
    } else if (semver.minor(latest) > semver.minor(current)) {
      versionDiff = 'minor';
    } else if (semver.patch(latest) > semver.patch(current)) {
      versionDiff = 'patch';
    }
  }

  return {
    currentVersion: current,
    latestVersion: latest,
    updateAvailable,
    versionDiff,
    releaseUrl: release.html_url,
    publishedAt: release.published_at,
  };
}

/**
 * Fetch changelog (recent releases) from GitHub API
 */
export async function getChangelog(): Promise<ChangelogResult> {
  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=10`,
    {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Slatestack-Update-Checker'
      }
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Try again later.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const releases = await response.json() as GitHubRelease[];

  return {
    releases: releases
      .filter((r) => !r.draft && !r.prerelease)
      .map((r) => ({
        version: semver.clean(r.tag_name) || r.tag_name,
        name: r.name || r.tag_name,
        body: r.body || '',
        publishedAt: r.published_at,
        url: r.html_url
      }))
  };
}
