'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import InteractiveParagraph from './InteractiveParagraph'
import QuizPractice from './QuizPractice'
import { Paragraph } from '@/lib/types/translator.types'
import { Quiz } from '@/lib/types/quiz.types'
import { DEFAULT_PARAGRAPHS } from '@/lib/data/sampleData'

export default function ParagraphTranslator() {
  const [activeSentence, setActiveSentence] = useState<{
    paragraphIndex: number
    sentenceIndex: number
  } | null>(null)
  const [showTranslation, setShowTranslation] = useState(true)
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quizFileInputRef = useRef<HTMLInputElement>(null)
  
  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizMode, setQuizMode] = useState(false)
  const [quizFileName, setQuizFileName] = useState<string | null>(null)

  const handleSentenceClick = (
    paragraphIndex: number,
    sentenceIndex: number
  ): void => {
    setActiveSentence({ paragraphIndex, sentenceIndex })
    setShowTranslation(true)
  }

  const handleHideTranslation = (): void => {
    setShowTranslation(false)
  }

  const handleTranslationEdit = async (
    paragraphIndex: number,
    sentenceIndex: number,
    newTranslation: string
  ): Promise<void> => {
    const updatedParagraphs = paragraphs.map((paragraph, pIdx) => {
      if (pIdx === paragraphIndex) {
        return paragraph.map((sentence, sIdx) => {
          if (sIdx === sentenceIndex) {
            return { ...sentence, vietnamese: newTranslation }
          }
          return sentence
        })
      }
      return paragraph
    })
    
    setParagraphs(updatedParagraphs)
    setError('✓ Translation updated! Click "Download Edited" to save your changes.')
    setTimeout(() => setError(null), 5000)
  }

  const handleDownload = (): void => {
    const dataStr = JSON.stringify(paragraphs, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const fileName = loadedFileName 
      ? loadedFileName.replace('.json', '-edited.json')
      : 'paragraphs-edited.json'
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setError('✓ File downloaded successfully!')
    setTimeout(() => setError(null), 3000)
  }

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

  const navigateToMatch = useCallback((direction: 'next' | 'previous') => {
    if (totalMatches === 0) return

    let newIndex: number
    if (direction === 'next') {
      newIndex = currentMatchIndex >= totalMatches - 1 ? 0 : currentMatchIndex + 1
    } else {
      newIndex = currentMatchIndex <= 0 ? totalMatches - 1 : currentMatchIndex - 1
    }
    setCurrentMatchIndex(newIndex)
  }, [totalMatches, currentMatchIndex])

  useEffect(() => {
    if (!searchQuery.trim()) {
      matchRefs.current = []
      return
    }

    const contentArea = document.getElementById('content-area')
    if (contentArea) {
      const marks = Array.from(contentArea.querySelectorAll('mark[data-match-index]')) as HTMLElement[]
      matchRefs.current = marks

      marks.forEach((mark) => {
        mark.className = 'bg-yellow-300 px-1 rounded'
      })

      if (marks[currentMatchIndex]) {
        marks[currentMatchIndex].className = 'bg-orange-400 px-1 rounded'
        marks[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [searchQuery, caseSensitive, currentMatchIndex, paragraphs])

  // Reset match index when search parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentMatchIndex(0)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, caseSensitive])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false)
        setSearchQuery('')
      }
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
  }, [showSearch, searchQuery, navigateToMatch])

  const handleLoadFile = (): void => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (!Array.isArray(data)) {
          setError('Invalid file format: Expected an array of paragraphs')
          return
        }

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
        setLoadedFileName(file.name)
        setActiveSentence(null)
        setError(null)
      } catch (err) {
        setError(`Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
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

  const handleLoadQuiz = (): void => {
    quizFileInputRef.current?.click()
  }

  const handleQuizFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (!data || typeof data !== 'object' || !Array.isArray((data as { quiz?: unknown }).quiz)) {
          setError('Invalid quiz format: Expected an object with a "quiz" array')
          return
        }

        const quizData = data as Quiz

        const isValid = quizData.quiz.every((question, index) => {
          if (!question.id || typeof question.id !== 'number') {
            setError(`Invalid question at index ${index}: Missing or invalid 'id' field`)
            return false
          }
          if (!question.type || typeof question.type !== 'string') {
            setError(`Invalid question ${question.id}: Missing or invalid 'type' field`)
            return false
          }
          const hasStandardContent = question.question || question.sentence || question.statement
          const hasMatchingContent = question.headings && question.paragraphs
          
          if (!hasStandardContent && !hasMatchingContent) {
            setError(`Invalid question ${question.id}: Missing content field`)
            return false
          }
          
          if (question.answer === undefined || question.answer === null) {
            setError(`Invalid question ${question.id}: Missing 'answer' field`)
            return false
          }
          return true
        })

        if (!isValid) return

        setQuiz(quizData)
        setQuizFileName(file.name)
        setQuizMode(true)
        setError(null)
      } catch (err) {
        setError(`Error loading quiz: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleCloseQuiz = (): void => {
    setQuizMode(false)
  }

  return (
    <div className="flex justify-center p-4 md:p-8" suppressHydrationWarning>
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

          {/* File Inputs (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={quizFileInputRef}
            type="file"
            accept=".json"
            onChange={handleQuizFileChange}
            className="hidden"
          />

          {/* File Loader */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={handleLoadFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📄 Load Article
              </button>
              <button
                onClick={handleLoadQuiz}
                disabled={paragraphs === DEFAULT_PARAGRAPHS && !loadedFileName}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title={paragraphs === DEFAULT_PARAGRAPHS && !loadedFileName ? "Load an article first" : "Load quiz to practice"}
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
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                title="Download edited translations"
              >
                💾 Download Edited
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
          <div className="grid grid-cols-2 gap-6">
            {/* Article Section - Left Side */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📄 Article</h2>
              <div className="space-y-6 text-gray-700 text-base leading-relaxed max-h-[70vh] overflow-y-auto pr-4" id="content-area">
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
                    showTranslation={showTranslation}
                    onTranslationEdit={handleTranslationEdit}
                  />
                ))}
              </div>
            </div>

            {/* Quiz Section - Right Side */}
            <div>
              <QuizPractice quiz={quiz} onClose={handleCloseQuiz} />
            </div>
          </div>
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
                showTranslation={showTranslation}
                onTranslationEdit={handleTranslationEdit}
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
