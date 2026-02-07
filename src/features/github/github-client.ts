import { Octokit } from "@octokit/rest"
import type { GithubSearchResult } from "./github-types"

/**
 * Create an Octokit instance with optional token.
 * Public repos work without auth, private repos need GITHUB_TOKEN.
 */
function getOctokit(token?: string): Octokit {
  return new Octokit({
    auth: token ?? process.env.GITHUB_TOKEN ?? undefined,
  })
}

/**
 * Fetch file content from a GitHub repo.
 * Returns the decoded UTF-8 string content.
 */
export async function getRepoContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
  token?: string
): Promise<string> {
  const octokit = getOctokit(token)

  const response = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref: branch ?? "main",
  })

  const data = response.data
  if (Array.isArray(data)) {
    throw new Error(`Expected file content but got directory listing for ${path}`)
  }

  if (!("content" in data) || !data.content) {
    throw new Error(`No content found for ${path}`)
  }

  return Buffer.from(data.content, "base64").toString("utf-8")
}

/**
 * Fetch the README content of a GitHub repo.
 * Uses the GitHub README API which auto-detects the README file.
 */
export async function getReadme(
  owner: string,
  repo: string,
  branch?: string,
  token?: string
): Promise<string> {
  const octokit = getOctokit(token)

  const response = await octokit.repos.getReadme({
    owner,
    repo,
    ref: branch ?? undefined,
  })

  const { content, encoding } = response.data
  if (!content) {
    throw new Error(`No README content found for ${owner}/${repo}`)
  }

  if (encoding === "base64") {
    return Buffer.from(content, "base64").toString("utf-8")
  }

  return content
}

/**
 * Search GitHub for awesome lists matching a query.
 * Filters repos with "awesome" topic.
 */
export async function searchAwesomeLists(
  query: string,
  token?: string
): Promise<GithubSearchResult[]> {
  const octokit = getOctokit(token)

  const response = await octokit.search.repos({
    q: `${query} topic:awesome`,
    sort: "stars",
    order: "desc",
    per_page: 20,
  })

  return response.data.items.map((item) => ({
    fullName: item.full_name,
    description: item.description ?? null,
    url: item.html_url,
    stars: item.stargazers_count ?? 0,
    topics: item.topics ?? [],
  }))
}

/**
 * Create or update a file in a GitHub repo via commit.
 * Returns the commit SHA on success.
 */
export async function createCommit(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  message: string,
  token?: string
): Promise<string> {
  const octokit = getOctokit(token)

  // Try to get existing file SHA for updates
  let existingSha: string | undefined
  try {
    const existing = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    })
    if (!Array.isArray(existing.data) && "sha" in existing.data) {
      existingSha = existing.data.sha
    }
  } catch {
    // File doesn't exist yet, creating new
  }

  const response = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch,
    sha: existingSha,
  })

  return response.data.commit.sha ?? ""
}
