import { readFileSync } from 'fs';
import { join } from 'path';
import * as semver from 'semver';
import { simpleGit, SimpleGit } from 'simple-git';
import type { UpdateCheckResult, ChangelogResult, ConflictCheckResult, GitHubRelease } from './update.types.js';

// Constants
const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'Labyrica';
const REPO_NAME = 'slatestack';

// Upstream remote configuration for updates
const UPSTREAM_REPO = 'https://github.com/Labyrica/slatestack.git';
const UPSTREAM_NAME = 'slatestack-upstream';
const UPSTREAM_BRANCH = 'main';

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

/**
 * Create a simple-git instance for the current working directory
 */
function getGit(): SimpleGit {
  return simpleGit(process.cwd(), {
    binary: 'git',
    maxConcurrentProcesses: 1,
  });
}

/**
 * Ensure the upstream remote exists and has the correct URL
 */
async function ensureUpstreamRemote(git: SimpleGit): Promise<void> {
  const remotes = await git.getRemotes(true);
  const upstream = remotes.find((r) => r.name === UPSTREAM_NAME);

  if (!upstream) {
    // Add the upstream remote
    await git.addRemote(UPSTREAM_NAME, UPSTREAM_REPO);
  } else if (upstream.refs.fetch !== UPSTREAM_REPO) {
    // URL changed (shouldn't happen), update it
    await git.remote(['set-url', UPSTREAM_NAME, UPSTREAM_REPO]);
  }
}

/**
 * Check for merge conflicts before update using git merge-tree (read-only)
 * This does NOT modify the working directory - it simulates a merge
 */
export async function checkConflicts(): Promise<ConflictCheckResult> {
  const git = getGit();

  // Ensure upstream remote exists
  await ensureUpstreamRemote(git);

  // Fetch latest from upstream
  await git.fetch(UPSTREAM_NAME, UPSTREAM_BRANCH);

  // Get current branch
  const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
  const upstreamRef = `${UPSTREAM_NAME}/${UPSTREAM_BRANCH}`;

  try {
    // Use merge-tree to simulate merge (read-only operation)
    // --write-tree: write the result tree (exits 0 if clean, 1 if conflicts)
    // --name-only: list file names that would be affected
    const result = await git.raw([
      'merge-tree',
      '--write-tree',
      '--name-only',
      currentBranch.trim(),
      upstreamRef
    ]);

    // Exit code 0 = clean merge possible
    // First line is tree OID, remaining lines are affected files (not conflicts)
    return {
      hasConflicts: false,
      conflicts: [],
      canAutoMerge: true,
    };
  } catch (error: unknown) {
    // simple-git throws on non-zero exit code
    // Exit code 1 = conflicts exist
    const gitError = error as { exitCode?: number; message?: string };

    if (gitError.exitCode === 1) {
      // Parse conflict information from error message
      // The output format includes conflicted file paths after the tree OID
      const conflicts: Array<{ file: string; type: string }> = [];

      if (gitError.message) {
        // Output format: first line is tree OID (partial), rest are conflicted files
        const lines = gitError.message.split('\n').filter((line) => line.trim());

        // Skip the first line (tree OID) and any stderr prefixes
        for (const line of lines) {
          const trimmed = line.trim();
          // Skip tree OID lines (40 char hex) and error messages
          if (trimmed && !trimmed.match(/^[a-f0-9]{40}$/i) && !trimmed.startsWith('CONFLICT')) {
            // File paths are listed after conflicts
            if (trimmed.includes('/') || trimmed.includes('.')) {
              conflicts.push({
                file: trimmed,
                type: 'content',
              });
            }
          }
          // Parse CONFLICT lines for more detail
          if (trimmed.startsWith('CONFLICT')) {
            const match = trimmed.match(/CONFLICT \(([^)]+)\): .* in (.+)/);
            if (match) {
              conflicts.push({
                file: match[2],
                type: match[1],
              });
            }
          }
        }
      }

      return {
        hasConflicts: true,
        conflicts,
        canAutoMerge: false,
      };
    }

    // Other exit codes are actual errors
    throw error;
  }
}
