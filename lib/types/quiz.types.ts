/**
 * Quiz question types
 */

export interface QuizQuestion {
  id: number
  type: string
  question: string
  instruction?: string
  options?: string[]
  sentence?: string
  answer: string | string[] | Record<string, string>
  statement?: string
  headings?: string[]
  paragraphs?: string[]
  explanation?: string
}

export interface Quiz {
  quiz: QuizQuestion[]
}

export interface QuizState {
  currentQuestionIndex: number
  userAnswers: Map<number, string | string[]>
  showAnswers: boolean
  score: number | null
}
