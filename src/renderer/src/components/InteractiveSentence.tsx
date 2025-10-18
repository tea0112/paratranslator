import { InteractiveSentenceProps } from '../types/translator.types'

function InteractiveSentence({
  sentence,
  isActive,
  onClick
}: InteractiveSentenceProps): React.JSX.Element {
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
      {sentence.english}{' '}
    </span>
  )
}

export default InteractiveSentence
