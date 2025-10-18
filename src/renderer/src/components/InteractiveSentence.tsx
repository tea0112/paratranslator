import { InteractiveSentenceProps } from '../types/translator.types'
import { useState } from 'react'

function InteractiveSentence({
  sentence,
  isActive,
  onClick
}: InteractiveSentenceProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(sentence.english)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`interactive-sentence ${isActive ? 'active' : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick()
          }
        }}
      >
        {sentence.english}
      </span>
      {isActive && (
        <button
          onClick={handleCopy}
          className="ml-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Copy sentence"
        >
          {copied ? '✓' : '📋'}
        </button>
      )}
      {' '}
    </span>
  )
}

export default InteractiveSentence
