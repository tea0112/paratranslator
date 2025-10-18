/**
 * Represents a single sentence with its translation
 */
export interface Sentence {
  english: string
  vietnamese: string
}

/**
 * Represents a paragraph containing multiple sentences
 */
export type Paragraph = Sentence[]

/**
 * Props for the ParagraphTranslator component
 */
export interface ParagraphTranslatorProps {
  paragraphs?: Paragraph[]
}

/**
 * Props for the InteractiveParagraph component
 */
export interface InteractiveParagraphProps {
  sentences: Sentence[]
  onSentenceClick: (translation: string, paragraphIndex: number, sentenceIndex: number) => void
  activeSentence: { paragraphIndex: number; sentenceIndex: number } | null
  paragraphIndex: number
}

/**
 * Props for the InteractiveSentence component
 */
export interface InteractiveSentenceProps {
  sentence: Sentence
  isActive: boolean
  onClick: () => void
}

/**
 * Props for the TranslationPanel component
 */
export interface TranslationPanelProps {
  translation: string | null
  englishText: string | null
}
