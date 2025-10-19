import { useState, useEffect, useRef } from 'react'
import InteractiveParagraph from './InteractiveParagraph'
import QuizPractice from './QuizPractice'
import { Paragraph } from '../types/translator.types'
import { Quiz } from '../types/quiz.types'
import { DEFAULT_PARAGRAPHS } from '../data/sampleData'

function ParagraphTranslator(): React.JSX.Element {
  const [activeSentence, setActiveSentence] = useState<{
    paragraphIndex: number
    sentenceIndex: number
  } | null>(null)
  const [paragraphs, setParagraphs] = useState<Paragraph[]>(DEFAULT_PARAGRAPHS)
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const matchRefs = useRef<HTMLElement[]>([])
  
  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizMode, setQuizMode] = useState(false)
  const [quizFileName, setQuizFileName] = useState<string | null>(null)

  const handleSentenceClick = (
    paragraphIndex: number,
    sentenceIndex: number,
    sentence: { english: string; vietnamese: string }
  ): void => {
    setActiveSentence({ paragraphIndex, sentenceIndex })
  }

  const handleHideTranslation = (): void => {
    setActiveSentence(null)
  }

  // Count total matches
  const getTotalMatches = (): number => {
    if (!searchQuery.trim()) return 0
    
    let count = 0
    paragraphs.forEach((paragraph) => {
      paragraph.forEach((sentence) => {
        const text = sentence.english
        const pattern = caseSensitive ? searchQuery : searchQuery.toLowerCase()
        const searchText = caseSensitive ? text : text.toLowerCase()
        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const matches = searchText.match(new RegExp(escapedPattern, 'g'))
        if (matches) count += matches.length
      })
    })
    return count
  }

  const totalMatches = getTotalMatches()

  const navigateToMatch = (direction: 'next' | 'previous') => {
    if (totalMatches === 0) return

    let newIndex: number
    if (direction === 'next') {
      newIndex = currentMatchIndex >= totalMatches - 1 ? 0 : currentMatchIndex + 1
    } else {
      newIndex = currentMatchIndex <= 0 ? totalMatches - 1 : currentMatchIndex - 1
    }
    setCurrentMatchIndex(newIndex)
  }

  // Collect and highlight matches after render
  useEffect(() => {
    if (!searchQuery.trim()) {
      matchRefs.current = []
      return
    }

    // Collect all mark elements from the DOM
    const contentArea = document.getElementById('content-area')
    if (contentArea) {
      const marks = Array.from(contentArea.querySelectorAll('mark[data-match-index]')) as HTMLElement[]
      matchRefs.current = marks

      // Reset all matches to yellow
      marks.forEach((mark) => {
        mark.className = 'bg-yellow-300 px-1 rounded'
      })

      // Highlight current match with orange
      if (marks[currentMatchIndex]) {
        marks[currentMatchIndex].className = 'bg-orange-400 px-1 rounded'
        marks[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [searchQuery, caseSensitive, currentMatchIndex, paragraphs])

  useEffect(() => {
    // Reset match index when search query changes
    setCurrentMatchIndex(0)
  }, [searchQuery, caseSensitive])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+F (or Cmd+F on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
        // Focus search input after state update
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
      // ESC to close search
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false)
        setSearchQuery('')
      }
      // Enter to go to next match, Shift+Enter for previous
      if (showSearch && e.key === 'Enter' && searchQuery.trim()) {
        e.preventDefault()
        if (e.shiftKey) {
          navigateToMatch('previous')
        } else {
          navigateToMatch('next')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSearch, searchQuery, currentMatchIndex, totalMatches])

  const handleLoadFile = async (): Promise<void> => {
    try {
      setError(null)
      
      // Check if API is available
      if (!window.api || !window.api.openFileDialog) {
        console.error('window.api:', window.api)
        console.error('Available APIs:', window.api ? Object.keys(window.api) : 'none')
        setError('File API not available. Please restart the application.')
        return
      }
      
      const filePath = await window.api.openFileDialog()

      if (!filePath) {
        return // User cancelled
      }

      const data = await window.api.readJSONFile(filePath)

      // Validate structure
      if (!Array.isArray(data)) {
        setError('Invalid file format: Expected an array of paragraphs')
        return
      }

      // Basic validation
      const isValid = data.every(
        (paragraph) =>
          Array.isArray(paragraph) &&
          paragraph.every(
            (sentence) =>
              typeof sentence === 'object' &&
              'english' in sentence &&
              'vietnamese' in sentence
          )
      )

      if (!isValid) {
        setError('Invalid file format: Each paragraph must contain sentence objects with "english" and "vietnamese" keys')
        return
      }

      setParagraphs(data as Paragraph[])
      setLoadedFileName(filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown')
      setActiveSentence(null)
    } catch (err) {
      setError(`Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleReset = (): void => {
    setParagraphs(DEFAULT_PARAGRAPHS)
    setLoadedFileName(null)
    setError(null)
    setActiveSentence(null)
  }

  const handleCopyAllEnglish = (): void => {
    const allEnglishText = paragraphs
      .map((paragraph) => paragraph.map((sentence) => sentence.english).join(' '))
      .join('\n\n')
    navigator.clipboard.writeText(allEnglishText)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleLoadQuiz = async (): Promise<void> => {
    try {
      setError(null)
      
      if (!window.api || !window.api.openFileDialog) {
        setError('File API not available. Please restart the application.')
        return
      }
      
      const filePath = await window.api.openFileDialog()
      if (!filePath) return

      const data = await window.api.readJSONFile(filePath)

      // Validate quiz structure
      if (!data || typeof data !== 'object' || !Array.isArray((data as any).quiz)) {
        setError('Invalid quiz format: Expected an object with a "quiz" array')
        return
      }

      const quizData = data as Quiz

      // Validate each question has required fields
      const isValid = quizData.quiz.every((question, index) => {
        if (!question.id || typeof question.id !== 'number') {
          setError(`Invalid question at index ${index}: Missing or invalid 'id' field`)
          return false
        }
        if (!question.type || typeof question.type !== 'string') {
          setError(`Invalid question ${question.id}: Missing or invalid 'type' field`)
          return false
        }
        // At least one content field must exist: question, sentence, statement, or (headings + paragraphs for matching)
        const hasStandardContent = question.question || question.sentence || question.statement
        const hasMatchingContent = question.headings && question.paragraphs
        
        if (!hasStandardContent && !hasMatchingContent) {
          setError(`Invalid question ${question.id}: Missing content field (question/sentence/statement or headings+paragraphs)`)
          return false
        }
        
        if (question.question && typeof question.question !== 'string') {
          setError(`Invalid question ${question.id}: 'question' field must be a string`)
          return false
        }
        if (question.sentence && typeof question.sentence !== 'string') {
          setError(`Invalid question ${question.id}: 'sentence' field must be a string`)
          return false
        }
        if (question.statement && typeof question.statement !== 'string') {
          setError(`Invalid question ${question.id}: 'statement' field must be a string`)
          return false
        }
        if (question.headings && !Array.isArray(question.headings)) {
          setError(`Invalid question ${question.id}: 'headings' field must be an array`)
          return false
        }
        if (question.paragraphs && !Array.isArray(question.paragraphs)) {
          setError(`Invalid question ${question.id}: 'paragraphs' field must be an array`)
          return false
        }
        if (question.answer === undefined || question.answer === null) {
          setError(`Invalid question ${question.id}: Missing 'answer' field`)
          return false
        }
        return true
      })

      if (!isValid) {
        return
      }

      setQuiz(quizData)
      setQuizFileName(filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown')
      setQuizMode(true)
    } catch (err) {
      setError(`Error loading quiz: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleCloseQuiz = (): void => {
    setQuizMode(false)
  }

  return (
    <div className="flex justify-center p-4 md:p-8">
      <div className="w-full bg-white rounded-xl shadow-md p-6 md:p-10 lg:p-12 xl:p-16">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Interactive Paragraphs</h1>
          <p className="text-gray-500 mt-2">
            Click on any underlined sentence to see its translation appear inline.
          </p>

          {!showSearch && !quizMode && (
            <div className="mt-4 text-sm text-gray-400">
              Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+F</kbd> to search
            </div>
          )}

          {/* File Loader */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={handleLoadFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📄 Load Text File
              </button>
              <button
                onClick={handleLoadQuiz}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                🧪 Load Quiz
              </button>
              <button
                onClick={handleCopyAllEnglish}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                title="Copy all English text"
              >
                {copiedAll ? '✓ Copied All' : '📋 Copy All English'}
              </button>
              {loadedFileName && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Reset to Sample
                </button>
              )}
            </div>

            {loadedFileName && !quizMode && (
              <div className="text-sm text-green-600 font-medium">
                📄 Text Loaded: {loadedFileName}
              </div>
            )}

            {quizFileName && quizMode && (
              <div className="text-sm text-purple-600 font-medium">
                🧪 Quiz Loaded: {quizFileName}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg max-w-xl">
                ⚠️ {error}
              </div>
            )}
          </div>
        </header>

        {quizMode ? (
          <QuizPractice quiz={quiz} onClose={handleCloseQuiz} />
        ) : (
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed" id="content-area">
            {paragraphs.map((paragraph, index) => (
              <InteractiveParagraph
                key={index}
                sentences={paragraph}
                onSentenceClick={handleSentenceClick}
                onHideTranslation={handleHideTranslation}
                activeSentence={activeSentence}
                paragraphIndex={index}
                searchQuery={searchQuery}
                caseSensitive={caseSensitive}
              />
            ))}
          </div>
        )}
      </div>

      {/* VS Code-like Floating Search Bar */}
      {showSearch && !quizMode && (
        <div className="fixed top-4 right-4 bg-white shadow-lg border border-gray-300 rounded-lg p-2 flex items-center gap-2 z-50">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find"
            className="w-64 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          
          {/* Match counter */}
          <div className="text-xs text-gray-600 whitespace-nowrap px-2">
            {searchQuery.trim() && totalMatches > 0 ? (
              <span>{currentMatchIndex + 1} of {totalMatches}</span>
            ) : searchQuery.trim() ? (
              <span className="text-red-500">No results</span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>

          {/* Previous match button */}
          <button
            onClick={() => navigateToMatch('previous')}
            disabled={totalMatches === 0}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous match (Shift+Enter)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Next match button */}
          <button
            onClick={() => navigateToMatch('next')}
            disabled={totalMatches === 0}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next match (Enter)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-300" />

          {/* Case sensitivity toggle */}
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`p-1 px-2 text-xs font-mono rounded transition-colors ${
              caseSensitive ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Match Case"
          >
            Aa
          </button>

          <div className="w-px h-5 bg-gray-300" />

          {/* Close button */}
          <button
            onClick={() => {
              setShowSearch(false)
              setSearchQuery('')
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
            title="Close (Escape)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default ParagraphTranslator
