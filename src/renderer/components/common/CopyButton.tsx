import React, { useState } from 'react'

interface Props {
  getText: () => string
  label?: string
}

export default function CopyButton({ getText, label = 'Copy' }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = getText()
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      className="btn-sm"
      onClick={handleCopy}
      style={{
        color: copied ? 'var(--green)' : undefined,
        transition: 'color 0.2s',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}
