/**
 * Parsed resource entry from an awesome-list markdown file.
 */
export interface ParsedResource {
  title: string
  url: string
  description: string
  categoryPath: string[]
  lineNumber: number
}

/**
 * Parsed section from an awesome-list markdown file.
 */
export interface ParsedSection {
  level: number
  name: string
  resources: ParsedResource[]
  children: ParsedSection[]
}

/**
 * Result of parsing an awesome-list markdown file.
 */
export interface ParseResult {
  title: string
  description: string
  sections: ParsedSection[]
  resources: ParsedResource[]
}

// Sections to skip during parsing
const SKIP_SECTIONS = new Set([
  "contents",
  "table of contents",
  "toc",
  "license",
  "contributing",
  "contribute",
  "contributors",
  "acknowledgements",
  "acknowledgments",
  "related",
  "footnotes",
])

// Patterns indicating non-resource links (badges, shields, etc.)
const BADGE_PATTERNS = [
  /shields\.io/i,
  /badge/i,
  /img\.shields/i,
  /travis-ci/i,
  /circleci/i,
  /coveralls/i,
  /codeclimate/i,
  /awesome\.re/i,
  /github\.com\/sindresorhus\/awesome/i,
  /#contributing/i,
  /#license/i,
  /#contents/i,
]

/**
 * Parse a resource line in the format:
 * - [Title](URL) - Description
 * - [Title](URL)
 */
function parseResourceLine(
  line: string,
  lineNumber: number,
  categoryPath: string[]
): ParsedResource | null {
  // Match: - [Title](URL) - Description  OR  - [Title](URL)
  const match = line.match(
    /^\s*[-*]\s+\[([^\]]+)\]\(([^)]+)\)(?:\s+[-–—]\s+(.*))?$/
  )

  if (!match) {
    return null
  }

  const [, title, url, description] = match

  if (!title || !url) {
    return null
  }

  // Skip badge/shield links
  for (const pattern of BADGE_PATTERNS) {
    if (pattern.test(url)) {
      return null
    }
  }

  // Skip anchor links (internal references)
  if (url.startsWith("#")) {
    return null
  }

  // Skip non-http links
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return null
  }

  return {
    title: title.trim(),
    url: url.trim(),
    description: (description ?? "").trim(),
    categoryPath: [...categoryPath],
    lineNumber,
  }
}

/**
 * Check if a heading name should be skipped.
 */
function shouldSkipSection(name: string): boolean {
  return SKIP_SECTIONS.has(name.toLowerCase().trim())
}

/**
 * Parse awesome-list markdown into structured sections and resources.
 *
 * Parsing rules:
 * 1. # = list title (first h1)
 * 2. > blockquote after title = description
 * 3. ## Contents = skip (TOC section)
 * 4. ## = category
 * 5. ### = subcategory (under current ##)
 * 6. #### = sub-subcategory (under current ###)
 * 7. - [Title](URL) - Description = resource entry
 * 8. - [Title](URL) (no dash description) = resource with empty description
 * 9. Skip: badges, shields.io links, license sections, contributing sections
 * 10. Handle edge cases: empty sections, duplicate URLs, malformed links
 */
export function parseAwesomeListMarkdown(markdown: string): ParseResult {
  const lines = markdown.split("\n")
  let title = ""
  let description = ""
  const sections: ParsedSection[] = []
  const allResources: ParsedResource[] = []
  const seenUrls = new Set<string>()

  // Track current section hierarchy
  let currentCategory: ParsedSection | null = null
  let currentSubcategory: ParsedSection | null = null
  let currentSubSubcategory: ParsedSection | null = null
  let inSkippedSection = false
  let skippedSectionLevel = 0
  let titleFound = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue
    const lineNumber = i + 1
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) {
      continue
    }

    // Parse # title (first h1 only)
    if (!titleFound && /^#\s+/.test(trimmed)) {
      title = trimmed.replace(/^#\s+/, "").trim()
      titleFound = true
      continue
    }

    // Parse blockquote description (only right after title)
    if (titleFound && !description && /^>\s*/.test(trimmed)) {
      description = trimmed.replace(/^>\s*/, "").trim()
      continue
    }

    // Parse headings
    const headingMatch = trimmed.match(/^(#{2,4})\s+(.+)$/)
    if (headingMatch?.[1] && headingMatch[2]) {
      const level = headingMatch[1].length
      const name = headingMatch[2].trim()

      // Check if this section should be skipped
      if (shouldSkipSection(name)) {
        inSkippedSection = true
        skippedSectionLevel = level
        continue
      }

      // If we encounter a heading at same or higher level as skipped section, stop skipping
      if (inSkippedSection && level <= skippedSectionLevel) {
        inSkippedSection = false
      }

      if (inSkippedSection) {
        continue
      }

      if (level === 2) {
        // ## = category
        currentCategory = {
          level: 2,
          name,
          resources: [],
          children: [],
        }
        sections.push(currentCategory)
        currentSubcategory = null
        currentSubSubcategory = null
      } else if (level === 3 && currentCategory) {
        // ### = subcategory
        currentSubcategory = {
          level: 3,
          name,
          resources: [],
          children: [],
        }
        currentCategory.children.push(currentSubcategory)
        currentSubSubcategory = null
      } else if (level === 4 && currentSubcategory) {
        // #### = sub-subcategory
        currentSubSubcategory = {
          level: 4,
          name,
          resources: [],
          children: [],
        }
        currentSubcategory.children.push(currentSubSubcategory)
      }

      continue
    }

    // Skip content in skipped sections
    if (inSkippedSection) {
      continue
    }

    // Parse resource lines (only if we're inside a category)
    if (!currentCategory) {
      continue
    }

    // Build category path for this resource
    const categoryPath: string[] = []
    if (currentCategory) {
      categoryPath.push(currentCategory.name)
    }
    if (currentSubcategory) {
      categoryPath.push(currentSubcategory.name)
    }
    if (currentSubSubcategory) {
      categoryPath.push(currentSubSubcategory.name)
    }

    const resource = parseResourceLine(trimmed, lineNumber, categoryPath)
    if (!resource) {
      continue
    }

    // Skip duplicate URLs
    if (seenUrls.has(resource.url)) {
      continue
    }
    seenUrls.add(resource.url)

    // Add to the deepest current section
    if (currentSubSubcategory) {
      currentSubSubcategory.resources.push(resource)
    } else if (currentSubcategory) {
      currentSubcategory.resources.push(resource)
    } else {
      currentCategory.resources.push(resource)
    }

    allResources.push(resource)
  }

  return {
    title,
    description,
    sections,
    resources: allResources,
  }
}
