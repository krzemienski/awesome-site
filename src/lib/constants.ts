/**
 * Domain allowlist for resource URL validation.
 * Prevents SSRF attacks by restricting which domains can be analyzed.
 * Ported from legacy app (78+ domains).
 */
export const ALLOWED_DOMAINS = [
  // Code repositories
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "codeberg.org",
  "sr.ht",

  // Package registries
  "npmjs.com",
  "pypi.org",
  "crates.io",
  "rubygems.org",
  "packagist.org",
  "nuget.org",
  "pkg.go.dev",
  "hex.pm",
  "pub.dev",

  // CDNs
  "unpkg.com",
  "cdn.jsdelivr.net",
  "cdnjs.cloudflare.com",

  // Developer Q&A
  "stackoverflow.com",
  "stackexchange.com",
  "serverfault.com",
  "superuser.com",

  // Developer blogs/platforms
  "medium.com",
  "dev.to",
  "hashnode.dev",
  "hackernoon.com",
  "freecodecamp.org",
  "css-tricks.com",
  "smashingmagazine.com",

  // Documentation sites
  "developer.mozilla.org",
  "docs.microsoft.com",
  "learn.microsoft.com",
  "cloud.google.com",
  "aws.amazon.com",
  "docs.aws.amazon.com",
  "firebase.google.com",
  "developer.apple.com",
  "developers.google.com",
  "reactjs.org",
  "vuejs.org",
  "angular.io",
  "svelte.dev",
  "nextjs.org",
  "nodejs.org",
  "python.org",
  "rust-lang.org",
  "go.dev",
  "typescriptlang.org",

  // Standards organizations
  "w3.org",
  "ietf.org",
  "whatwg.org",
  "ecma-international.org",

  // Academic/research
  "arxiv.org",
  "acm.org",
  "dl.acm.org",
  "ieee.org",
  "ieeexplore.ieee.org",
  "researchgate.net",
  "scholar.google.com",

  // Tech news
  "techcrunch.com",
  "wired.com",
  "arstechnica.com",
  "theverge.com",
  "infoq.com",
  "thenewstack.io",

  // Community/social
  "reddit.com",
  "news.ycombinator.com",
  "lobste.rs",
  "twitter.com",
  "x.com",

  // Video/streaming
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "twitch.tv",
  "dailymotion.com",

  // Video streaming tech
  "bitmovin.com",
  "cloudflare.com",
  "akamai.com",
  "fastly.com",
  "wowza.com",
  "encoding.com",
  "zencoder.com",
  "mux.com",
  "jwplayer.com",
  "videojs.com",
  "brightcove.com",
  "kaltura.com",

  // Cloud providers
  "vercel.com",
  "netlify.com",
  "heroku.com",
  "digitalocean.com",
  "render.com",
  "railway.app",
  "fly.io",

  // AI/ML
  "openai.com",
  "anthropic.com",
  "huggingface.co",
  "tensorflow.org",
  "pytorch.org",
] as const

export type AllowedDomain = (typeof ALLOWED_DOMAINS)[number]

/**
 * Rate limit configuration per tier.
 * Uses sliding window algorithm with in-memory Map.
 */
export const RATE_LIMITS = {
  anonymous: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    label: "Anonymous (per IP)",
  },
  session: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    label: "Authenticated (per user)",
  },
  apiKey: {
    free: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 60,
      label: "Free tier (per hour)",
    },
    standard: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 1_000,
      label: "Standard tier (per hour)",
    },
    premium: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10_000,
      label: "Premium tier (per hour)",
    },
  },
} as const

export type ApiKeyTier = keyof typeof RATE_LIMITS.apiKey

/**
 * Pagination defaults for API responses.
 */
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
  allowedLimits: [20, 50, 100] as const,
} as const

/**
 * Cache durations in milliseconds.
 */
export const CACHE_DURATIONS = {
  searchIndex: 10 * 60 * 1000,
  categoryTree: 30 * 60 * 1000,
  adminData: 60 * 1000,
  aiResponse: 24 * 60 * 60 * 1000,
} as const
