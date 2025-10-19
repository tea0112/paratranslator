import { InteractiveSentenceProps } from '../types/translator.types'
import { useRef, useEffect } from 'react'

function InteractiveSentence({
  sentence,
  isActive,
  onClick,
  searchQuery,
  caseSensitive,
  onMatchRender,
  matchOffset = 0
}: InteractiveSentenceProps): React.JSX.Element {
  const matchRefsArray = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    // Pass match elements to parent for scrolling
    if (onMatchRender && matchRefsArray.current.length > 0) {
      matchRefsArray.current.forEach((ref) => {
        if (ref) onMatchRender(ref)
      })
    }
  }, [searchQuery, onMatchRender])

  const renderTextWithHighlight = (text: string) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return text
    }

    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(`(${escapedQuery})`, flags)
    const parts = text.split(regex)
    
    let matchIndex = matchOffset
    matchRefsArray.current = []

    return parts.map((part, index) => {
      const isMatch = caseSensitive 
        ? part === searchQuery
        : part.toLowerCase() === searchQuery.toLowerCase()

      if (isMatch) {
        const currentMatchIdx = matchIndex
        matchIndex++
        return (
          <mark
            key={index}
            ref={(el) => {
              matchRefsArray.current.push(el)
            }}
            className="bg-yellow-300 px-1 rounded"
            data-match-index={currentMatchIdx}
          >
            {part}
          </mark>
        )
      }
      return part
    })
  }

  return (
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
      {renderTextWithHighlight(sentence.english)}{' '}
    </span>
  )
}

export default InteractiveSentence
