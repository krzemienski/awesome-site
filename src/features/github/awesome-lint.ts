/**
 * A lint error found in the awesome-list markdown.
 */
export interface LintError {
  line: number
  rule: string
  message: string
}

/**
 * A lint warning found in the awesome-list markdown.
 */
export interface LintWarning {
  line: number
  rule: string
  message: string
}

/**
 * Result of linting an awesome-list markdown string.
 */
export interface LintResult {
  valid: boolean
  errors: LintError[]
  warnings: LintWarning[]
}

/**
 * Check that the markdown has a title (# heading).
 */
function checkTitle(
  lines: string[],
  errors: LintError[]
): void {
  const hasTitle = lines.some((line) => /^#\s+\S/.test(line))
  if (!hasTitle) {
    errors.push({
      line: 1,
      rule: "has-title",
      message: "Missing title: expected a # heading at the top of the document",
    })
  }
}

/**
 * Check that the markdown has a description (> blockquote).
 */
function checkDescription(
  lines: string[],
  errors: LintError[]
): void {
  const hasBlockquote = lines.some((line) => /^>\s+\S/.test(line))
  if (!hasBlockquote) {
    errors.push({
      line: 1,
      rule: "has-description",
      message: "Missing description: expected a > blockquote after the title",
    })
  }
}

/**
 * Check that the markdown has a TOC (## Contents).
 */
function checkTOC(
  lines: string[],
  errors: LintError[]
): void {
  const hasTOC = lines.some(
    (line) => /^##\s+Contents/i.test(line)
  )
  if (!hasTOC) {
    errors.push({
      line: 1,
      rule: "has-toc",
      message: "Missing Table of Contents: expected a ## Contents section",
    })
  }
}

/**
 * Check that all TOC links resolve to actual sections.
 */
function checkTOCLinks(
  lines: string[],
  errors: LintError[]
): void {
  // Find TOC section
  let inTOC = false
  const tocLinks: Array<{ anchor: string; lineNumber: number }> = []

  // Collect all ## heading anchors
  const sectionAnchors = new Set<string>()
  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/)
    if (headingMatch) {
      const name = headingMatch[1].trim()
      if (!/^Contents$/i.test(name)) {
        const anchor = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/^-|-$/g, "")
        sectionAnchors.add(anchor)
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^##\s+Contents/i.test(line)) {
      inTOC = true
      continue
    }

    if (inTOC) {
      // TOC ends at the next ## heading
      if (/^##\s+/.test(line)) {
        inTOC = false
        continue
      }

      const linkMatch = line.match(/^\s*-\s+\[([^\]]+)\]\(#([^)]+)\)/)
      if (linkMatch) {
        tocLinks.push({ anchor: linkMatch[2], lineNumber: i + 1 })
      }
    }
  }

  for (const link of tocLinks) {
    if (!sectionAnchors.has(link.anchor)) {
      errors.push({
        line: link.lineNumber,
        rule: "toc-link-resolves",
        message: `TOC link "#${link.anchor}" does not resolve to any section`,
      })
    }
  }
}

/**
 * Check heading hierarchy: no h4 without h3, no h3 without h2.
 */
function checkHeadingHierarchy(
  lines: string[],
  errors: LintError[]
): void {
  let lastLevel = 1

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+/)
    if (match) {
      const level = match[1].length
      if (level > lastLevel + 1) {
        errors.push({
          line: i + 1,
          rule: "heading-hierarchy",
          message: `Heading level ${level} skips level ${lastLevel + 1}. Found h${level} without preceding h${level - 1}`,
        })
      }
      lastLevel = level
    }
  }
}

/**
 * Check that resources are in `- [Title](URL)` format and URLs are valid.
 */
function checkResourceFormat(
  lines: string[],
  errors: LintError[]
): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Only check lines that look like list items with links
    if (!/^\s*[-*]\s+\[/.test(line)) {
      continue
    }

    // Must match the resource pattern
    const match = trimmed.match(
      /^[-*]\s+\[([^\]]+)\]\(([^)]+)\)(?:\s+[-–—]\s+.*)?$/
    )

    if (!match) {
      errors.push({
        line: i + 1,
        rule: "resource-format",
        message:
          "Resource line does not match expected format: - [Title](URL) - Description",
      })
      continue
    }

    const url = match[2]
    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("#")
    ) {
      errors.push({
        line: i + 1,
        rule: "url-format",
        message: `URL "${url}" does not start with http:// or https://`,
      })
    }
  }
}

/**
 * Check that resources within each section are alphabetically sorted.
 */
function checkAlphabeticalOrder(
  lines: string[],
  warnings: LintWarning[]
): void {
  let currentSectionLine = 0
  let resourceTitles: Array<{ title: string; lineNumber: number }> = []

  const flushSection = () => {
    for (let j = 1; j < resourceTitles.length; j++) {
      const prev = resourceTitles[j - 1].title.toLowerCase()
      const curr = resourceTitles[j].title.toLowerCase()
      if (prev.localeCompare(curr) > 0) {
        warnings.push({
          line: resourceTitles[j].lineNumber,
          rule: "alphabetical-order",
          message: `"${resourceTitles[j].title}" should come before "${resourceTitles[j - 1].title}" (alphabetical order)`,
        })
        break // One warning per section is enough
      }
    }
    resourceTitles = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect heading -- flush previous section
    if (/^#{2,6}\s+/.test(line)) {
      flushSection()
      currentSectionLine = i + 1
      continue
    }

    // Collect resource titles
    const match = line
      .trim()
      .match(/^[-*]\s+\[([^\]]+)\]\(([^)]+)\)/)
    if (match && match[2].startsWith("http")) {
      resourceTitles.push({ title: match[1], lineNumber: i + 1 })
    }
  }

  // Flush last section
  flushSection()
}

/**
 * Check for empty sections (heading with no resources or children).
 */
function checkEmptySections(
  lines: string[],
  errors: LintError[]
): void {
  const headings: Array<{ level: number; lineNumber: number; name: string }> =
    []

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{2,6})\s+(.+)$/)
    if (match) {
      headings.push({
        level: match[1].length,
        lineNumber: i + 1,
        name: match[2].trim(),
      })
    }
  }

  for (let h = 0; h < headings.length; h++) {
    const current = headings[h]

    // Skip TOC section
    if (/^Contents$/i.test(current.name)) {
      continue
    }

    const startLine = current.lineNumber
    const endLine =
      h + 1 < headings.length ? headings[h + 1].lineNumber : lines.length + 1

    // Check if there's any content between this heading and the next
    let hasContent = false
    for (let i = startLine; i < endLine - 1; i++) {
      const trimmed = lines[i].trim()
      if (trimmed && !trimmed.startsWith("#")) {
        hasContent = true
        break
      }
    }

    // A section is not empty if it has child headings
    const hasChildHeading =
      h + 1 < headings.length &&
      headings[h + 1].level > current.level &&
      headings[h + 1].lineNumber < endLine

    if (!hasContent && !hasChildHeading) {
      errors.push({
        line: current.lineNumber,
        rule: "no-empty-sections",
        message: `Section "${current.name}" is empty (no resources or child sections)`,
      })
    }
  }
}

/**
 * Validate an awesome-list markdown string against common rules.
 * Returns a LintResult with errors and warnings.
 */
export function lintAwesomeList(markdown: string): LintResult {
  const lines = markdown.split("\n")
  const errors: LintError[] = []
  const warnings: LintWarning[] = []

  checkTitle(lines, errors)
  checkDescription(lines, errors)
  checkTOC(lines, errors)
  checkTOCLinks(lines, errors)
  checkHeadingHierarchy(lines, errors)
  checkResourceFormat(lines, errors)
  checkAlphabeticalOrder(lines, warnings)
  checkEmptySections(lines, errors)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
