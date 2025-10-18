import InteractiveSentence from './InteractiveSentence'
import { InteractiveParagraphProps } from '../types/translator.types'

function InteractiveParagraph({
  sentences,
  onSentenceClick,
  activeSentence,
  paragraphIndex
}: InteractiveParagraphProps): React.JSX.Element {
  return (
    <p>
      {sentences.map((sentence, index) => (
        <InteractiveSentence
          key={index}
          sentence={sentence}
          isActive={
            activeSentence !== null &&
            activeSentence.paragraphIndex === paragraphIndex &&
            activeSentence.sentenceIndex === index
          }
          onClick={() => onSentenceClick(sentence.vietnamese, paragraphIndex, index)}
        />
      ))}
    </p>
  )
}

export default InteractiveParagraph
