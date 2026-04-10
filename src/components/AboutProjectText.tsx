import { useMemo } from 'react'
import { motion } from 'framer-motion'

type TextNode =
  | { type: 'heading'; key: string; text: string }
  | { type: 'paragraph'; key: string; text: string }
  | { type: 'bullets'; key: string; items: string[] }

type Section = {
  id: string
  heading: string
  paragraphs: string[]
  bullets: string[]
}

function isBulletLine(line: string) {
  return line.trimStart().startsWith('- ')
}

function looksLikeCapsHeading(line: string) {
  const t = line.trim()
  if (t.length < 6 || t.length > 80) return false
  // If it has mostly letters in Cyrillic/Latin and no digits-heavy content,
  // treat it as a heading candidate.
  const hasLetter = /[A-Za-zА-Яа-яЁё]/.test(t)
  const mostlyLettersOrSymbols = /^[A-Za-zА-Яа-яЁё0-9\s"()&:;.\-—]+$/.test(t)
  return hasLetter && mostlyLettersOrSymbols && t === t.toUpperCase()
}

function parseProjectText(text: string): TextNode[] {
  const normalized = text.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')

  const meaningfulIndexes: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '') meaningfulIndexes.push(i)
  }
  const nextMeaningfulLine = (startIdx: number) => {
    for (let j = startIdx; j < meaningfulIndexes.length; j++) {
      const idx = meaningfulIndexes[j]
      if (idx > startIdx) return lines[idx]
    }
    return ''
  }

  const nodes: TextNode[] = []
  let i = 0
  let blockId = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''
    if (line.trim() === '') {
      i++
      continue
    }

    // Bullet list blocks
    if (isBulletLine(line)) {
      const items: string[] = []
      while (i < lines.length && isBulletLine(lines[i] ?? '')) {
        const item = (lines[i] ?? '').trim().replace(/^-+\s*/, '')
        if (item.trim() !== '') items.push(item.trim())
        i++
      }
      if (items.length > 0) nodes.push({ type: 'bullets', key: `b-${blockId++}`, items })
      continue
    }

    // Paragraph blocks: collect until blank line or next bullet list
    const paragraphLines: string[] = []
    const blockStart = i
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !isBulletLine(lines[i] ?? '')
    ) {
      paragraphLines.push((lines[i] ?? '').trim())
      i++
    }

    const paragraph = paragraphLines.join(' ').replace(/\s+/g, ' ').trim()
    if (!paragraph) continue

    const nextLine = nextMeaningfulLine(blockStart)
    const shouldBeHeading =
      paragraph.endsWith(':') ||
      looksLikeCapsHeading(paragraph) ||
      // If the next block is a bullet list, current line is usually a section heading.
      (nextLine.trim() !== '' && isBulletLine(nextLine))

    if (shouldBeHeading) nodes.push({ type: 'heading', key: `h-${blockId++}`, text: paragraph })
    else nodes.push({ type: 'paragraph', key: `p-${blockId++}`, text: paragraph })
  }

  return nodes
}

function toSections(nodes: TextNode[], overviewLabel: string) {
  const sections: Section[] = []
  let current: Section | null = null
  let idx = 0

  const ensureCurrent = () => {
    if (!current) {
      current = {
        id: `s-${idx++}`,
        heading: overviewLabel,
        paragraphs: [],
        bullets: [],
      }
    }
    return current
  }

  for (const node of nodes) {
    if (node.type === 'heading') {
      if (current && (current.paragraphs.length > 0 || current.bullets.length > 0)) {
        sections.push(current)
      }
      current = {
        id: `s-${idx++}`,
        heading: node.text,
        paragraphs: [],
        bullets: [],
      }
      continue
    }

    const target = ensureCurrent()
    if (node.type === 'paragraph') {
      target.paragraphs.push(node.text)
    } else {
      target.bullets.push(...node.items)
    }
  }

  if (current && (current.paragraphs.length > 0 || current.bullets.length > 0)) {
    sections.push(current)
  }

  return sections
}

export default function AboutProjectText({
  title,
  text,
  overviewLabel,
  expanded,
  onToggle,
  moreLabel,
  lessLabel,
  collapsedNodes = 10,
}: {
  title: string
  text: string
  overviewLabel: string
  expanded: boolean
  onToggle: () => void
  moreLabel: string
  lessLabel: string
  collapsedNodes?: number
}) {
  const nodes = useMemo(() => parseProjectText(text), [text])
  const sections = useMemo(() => toSections(nodes, overviewLabel), [nodes, overviewLabel])
  const shouldTruncate = sections.length > collapsedNodes
  const visible = expanded ? sections : sections.slice(0, collapsedNodes)
  const highlights = useMemo(() => {
    const snippets: string[] = []
    for (const s of sections) {
      for (const b of s.bullets) {
        if (snippets.length >= 3) break
        snippets.push(b)
      }
      if (snippets.length >= 3) break
    }
    if (snippets.length < 3) {
      for (const s of sections) {
        for (const p of s.paragraphs) {
          if (snippets.length >= 3) break
          snippets.push(p)
        }
        if (snippets.length >= 3) break
      }
    }
    return snippets.slice(0, 3)
  }, [sections])

  return (
    <div className="relative mt-12 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(251,191,36,0.14),transparent_60%)]" />
      <div className="relative">
        <h3 className="text-center text-xl font-semibold text-amber-300">{title}</h3>

        {highlights.length > 0 && (
          <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            {highlights.map((h, i) => (
              <div
                key={`hl-${i}`}
                className="min-w-0 flex-1 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-100/90 sm:min-w-[200px]"
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 align-middle" />
                <span className="break-words">{h}</span>
              </div>
            ))}
          </div>
        )}

        {/* Single column: top-to-bottom reading order; clear breaks between passages */}
        <div className="relative mx-auto mt-8 max-w-3xl">
          {visible.map((section, idx) => (
            <motion.article
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.4) }}
              className={
                idx === 0
                  ? 'pb-10'
                  : 'border-t border-amber-500/25 pt-10 pb-10'
              }
            >
              <h4 className="mb-4 flex items-baseline gap-3 border-l-2 border-amber-400/80 pl-4 text-base font-semibold tracking-tight text-zinc-50">
                <span className="tabular-nums text-xs font-medium text-amber-500/80">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{section.heading}</span>
              </h4>

              <div className="space-y-4 pl-4 text-sm leading-[1.7] text-zinc-400 text-pretty">
                {section.paragraphs.map((p, i) => (
                  <p key={`${section.id}-p-${i}`} className="first:mt-0 break-words hyphens-auto">
                    {p}
                  </p>
                ))}
              </div>

              {section.bullets.length > 0 && (
                <ul className="mt-5 space-y-2.5 border-l border-white/10 pl-4 text-sm leading-relaxed text-zinc-300">
                  {section.bullets.map((b, i) => (
                    <li key={`${section.id}-b-${i}`} className="flex items-start gap-2.5">
                      <span className="mt-2 inline-flex h-1 w-1 shrink-0 rounded-full bg-amber-400/90" />
                      <span className="min-w-0 break-words hyphens-auto">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.article>
          ))}
        </div>

        {shouldTruncate && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgb(var(--bg))] to-transparent" />
        )}
      </div>

      {shouldTruncate && (
        <div className="relative mt-6 flex justify-center">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center rounded-full border border-amber-500/30 bg-transparent px-4 py-2 text-xs font-medium text-amber-300 transition-colors hover:border-amber-500/60 hover:bg-amber-500/10"
          >
            {expanded ? lessLabel : moreLabel}
          </button>
        </div>
      )}
    </div>
  )
}

