import InteractiveSentence from './InteractiveSentence'
import { InteractiveParagraphProps } from '../types/translator.types'

function InteractiveParagraph({
  sentences,
  onSentenceClick,
  activeSentence,
  paragraphIndex
}: InteractiveParagraphProps): React.JSX.Element {
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
                onClick={() => onSentenceClick(sentence.vietnamese, paragraphIndex, index)}
              />
              {/* Show translation inline on mobile screens only */}
              {isActive && (
                <span className="md:hidden inline-block ml-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm italic border border-blue-200">
                  → {sentence.vietnamese}
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
