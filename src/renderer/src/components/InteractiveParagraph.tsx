import { useState } from 'react'
import InteractiveSentence from './InteractiveSentence'
import { InteractiveParagraphProps } from '../types/translator.types'

function InteractiveParagraph({
  sentences,
  onSentenceClick,
  activeSentence,
  paragraphIndex
}: InteractiveParagraphProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <p>
        {sentences.map((sentence, index) => {
          const isActive =
            activeSentence !== null &&
            activeSentence.paragraphIndex === paragraphIndex &&
            activeSentence.sentenceIndex === index

          return (
            <span key={index}>
              <InteractiveSentence
                sentence={sentence}
                isActive={isActive}
                onClick={() => onSentenceClick(paragraphIndex, index, sentence)}
              />
              {/* Show translation inline with copy button */}
              {isActive && (
                <span className="inline-flex items-center gap-3 ml-3 mr-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm italic border border-blue-200">
                  <span>→ {sentence.vietnamese}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(sentence.english)
                    }}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm not-italic"
                    title={copied ? 'Copied!' : 'Copy English sentence'}
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </span>
              )}
            </span>
          )
        })}
      </p>
    </div>
  )
}

export default InteractiveParagraph
