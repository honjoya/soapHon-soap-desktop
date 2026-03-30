import React, { useState, useMemo } from 'react'

interface XmlNode {
  type: 'element' | 'text' | 'declaration' | 'comment'
  tag?: string
  attrs?: string
  children?: XmlNode[]
  text?: string
  selfClosing?: boolean
  raw?: string
}

function parseXmlNodes(xml: string): XmlNode[] {
  const nodes: XmlNode[] = []
  let pos = 0

  while (pos < xml.length) {
    // Skip whitespace between tags at top level
    const wsMatch = xml.substring(pos).match(/^[\r\n]+/)
    if (wsMatch) {
      pos += wsMatch[0].length
      continue
    }

    if (xml[pos] === '<') {
      // XML declaration
      if (xml.substring(pos, pos + 5) === '<?xml') {
        const end = xml.indexOf('?>', pos)
        if (end === -1) break
        nodes.push({ type: 'declaration', raw: xml.substring(pos, end + 2) })
        pos = end + 2
        continue
      }

      // Comment
      if (xml.substring(pos, pos + 4) === '<!--') {
        const end = xml.indexOf('-->', pos)
        if (end === -1) break
        nodes.push({ type: 'comment', raw: xml.substring(pos, end + 3) })
        pos = end + 3
        continue
      }

      // Closing tag — shouldn't happen at top level in well-formed XML, skip
      if (xml[pos + 1] === '/') {
        const end = xml.indexOf('>', pos)
        pos = end === -1 ? xml.length : end + 1
        continue
      }

      // Opening tag
      const tagMatch = xml.substring(pos).match(/^<([^\s/>]+)((?:\s+[^>]*?)?)(\s*\/?)>/)
      if (!tagMatch) {
        // malformed, take rest as text
        nodes.push({ type: 'text', text: xml.substring(pos) })
        break
      }

      const fullMatch = tagMatch[0]
      const tag = tagMatch[1]
      const attrs = tagMatch[2].trim()
      const selfClosing = tagMatch[3].trim() === '/' || fullMatch.endsWith('/>')

      pos += fullMatch.length

      if (selfClosing) {
        nodes.push({ type: 'element', tag, attrs, selfClosing: true, children: [] })
        continue
      }

      // Find matching closing tag, accounting for nesting
      const { innerContent, endPos } = findClosingTag(xml, pos, tag)
      pos = endPos

      // Check if inner content is just text (no child elements)
      const trimmed = innerContent.trim()
      if (!trimmed.includes('<')) {
        nodes.push({ type: 'element', tag, attrs, children: [{ type: 'text', text: trimmed }] })
      } else {
        const children = parseXmlNodes(innerContent)
        nodes.push({ type: 'element', tag, attrs, children })
      }
    } else {
      // Text content
      const nextTag = xml.indexOf('<', pos)
      const text = nextTag === -1 ? xml.substring(pos) : xml.substring(pos, nextTag)
      if (text.trim()) {
        nodes.push({ type: 'text', text: text.trim() })
      }
      pos = nextTag === -1 ? xml.length : nextTag
    }
  }

  return nodes
}

function findClosingTag(xml: string, startPos: number, tag: string): { innerContent: string; endPos: number } {
  let depth = 1
  let pos = startPos
  // Escape special regex characters in tag name
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  while (pos < xml.length && depth > 0) {
    const nextOpen = xml.indexOf('<', pos)
    if (nextOpen === -1) break

    // Check for closing tag
    const closeMatch = xml.substring(nextOpen).match(new RegExp(`^<\\/${escapedTag}\\s*>`))
    if (closeMatch) {
      depth--
      if (depth === 0) {
        return {
          innerContent: xml.substring(startPos, nextOpen),
          endPos: nextOpen + closeMatch[0].length,
        }
      }
      pos = nextOpen + closeMatch[0].length
      continue
    }

    // Check for opening tag of same name (nesting)
    const openMatch = xml.substring(nextOpen).match(new RegExp(`^<${escapedTag}(\\s|>|\\/)`))
    if (openMatch) {
      // Check if self-closing
      const restOfTag = xml.substring(nextOpen)
      const tagEnd = restOfTag.indexOf('>')
      if (tagEnd !== -1 && restOfTag[tagEnd - 1] !== '/') {
        depth++
      }
      pos = nextOpen + tagEnd + 1
      continue
    }

    pos = nextOpen + 1
  }

  // Couldn't find closing tag, return rest
  return { innerContent: xml.substring(startPos), endPos: xml.length }
}

interface XmlNodeRendererProps {
  node: XmlNode
  indent: number
  defaultExpanded: boolean
}

function XmlNodeRenderer({ node, indent, defaultExpanded }: XmlNodeRendererProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const pad = '  '.repeat(indent)

  if (node.type === 'declaration' || node.type === 'comment') {
    return (
      <div style={{ whiteSpace: 'pre' }}>
        <span style={{ color: 'var(--text-muted)' }}>{pad}{node.raw}</span>
      </div>
    )
  }

  if (node.type === 'text') {
    return (
      <div style={{ whiteSpace: 'pre' }}>
        <span style={{ color: 'var(--yellow)' }}>{pad}{node.text}</span>
      </div>
    )
  }

  if (node.type !== 'element' || !node.tag) return null

  const hasChildren = node.children && node.children.length > 0
  const isTextOnly = hasChildren && node.children!.length === 1 && node.children![0].type === 'text'
  const hasElementChildren = hasChildren && !isTextOnly
  const attrStr = node.attrs ? ' ' + node.attrs : ''

  // Self-closing tag
  if (node.selfClosing) {
    return (
      <div style={{ whiteSpace: 'pre' }}>
        {pad}<span style={{ color: 'var(--text-muted)' }}>&lt;</span>
        <span style={{ color: 'var(--accent)' }}>{node.tag}</span>
        <span style={{ color: 'var(--green)' }}>{attrStr}</span>
        <span style={{ color: 'var(--text-muted)' }}> /&gt;</span>
      </div>
    )
  }

  // Text-only element on single line
  if (isTextOnly) {
    return (
      <div style={{ whiteSpace: 'pre' }}>
        {pad}<span style={{ color: 'var(--text-muted)' }}>&lt;</span>
        <span style={{ color: 'var(--accent)' }}>{node.tag}</span>
        <span style={{ color: 'var(--green)' }}>{attrStr}</span>
        <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
        <span style={{ color: 'var(--yellow)' }}>{node.children![0].text}</span>
        <span style={{ color: 'var(--text-muted)' }}>&lt;/</span>
        <span style={{ color: 'var(--accent)' }}>{node.tag}</span>
        <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
      </div>
    )
  }

  // Element with child elements — collapsible
  if (hasElementChildren) {
    return (
      <div>
        <div
          style={{ whiteSpace: 'pre', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setExpanded(!expanded)}
        >
          {pad}<span style={{
            display: 'inline-block', width: 14, textAlign: 'center',
            color: 'var(--text-muted)', fontSize: 10, marginRight: 2,
          }}>
            {expanded ? '▼' : '▶'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>&lt;</span>
          <span style={{ color: 'var(--accent)' }}>{node.tag}</span>
          <span style={{ color: 'var(--green)' }}>{attrStr}</span>
          <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
          {!expanded && (
            <>
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}> ... </span>
              <span style={{ color: 'var(--text-muted)' }}>&lt;/</span>
              <span style={{ color: 'var(--accent)' }}>{node.tag}</span>
              <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
            </>
          )}
        </div>

        {expanded && (
          <>
            {node.children!.map((child, i) => (
              <XmlNodeRenderer key={i} node={child} indent={indent + 1} defaultExpanded={defaultExpanded} />
            ))}
            <div style={{ whiteSpace: 'pre' }}>
              {pad}<span style={{ color: 'var(--text-muted)' }}>&lt;/</span>
              <span style={{ color: 'var(--accent)' }}>{node.tag}</span>
              <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
            </div>
          </>
        )}
      </div>
    )
  }

  // Empty element
  return (
    <div style={{ whiteSpace: 'pre' }}>
      {pad}<span style={{ color: 'var(--text-muted)' }}>&lt;</span>
      <span style={{ color: 'var(--accent)' }}>{node.tag}</span>
      <span style={{ color: 'var(--green)' }}>{attrStr}</span>
      <span style={{ color: 'var(--text-muted)' }}>&gt;&lt;/</span>
      <span style={{ color: 'var(--accent)' }}>{node.tag}</span>
      <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
    </div>
  )
}

interface CollapsibleXmlProps {
  xml: string
}

export default function CollapsibleXml({ xml }: CollapsibleXmlProps) {
  const [allExpanded, setAllExpanded] = useState(true)
  const [key, setKey] = useState(0)

  const nodes = useMemo(() => parseXmlNodes(xml), [xml])

  const toggleAll = () => {
    setAllExpanded(!allExpanded)
    setKey((k) => k + 1) // force re-render of all nodes with new default
  }

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6 }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 8, padding: '6px 12px',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
      }}>
        <button
          className="btn-sm"
          onClick={toggleAll}
          style={{ fontSize: 11 }}
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          Click on blocks to expand/collapse
        </span>
      </div>

      {/* XML tree */}
      <div style={{ padding: '8px 12px', overflow: 'auto' }} key={key}>
        {nodes.map((node, i) => (
          <XmlNodeRenderer key={i} node={node} indent={0} defaultExpanded={allExpanded} />
        ))}
      </div>
    </div>
  )
}
