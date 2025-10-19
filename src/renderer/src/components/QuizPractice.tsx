import { useState, useEffect } from 'react'
import { Quiz } from '../types/quiz.types'

interface QuizPracticeProps {
  quiz: Quiz | null
  onClose: () => void
}

function QuizPractice({ quiz, onClose }: QuizPracticeProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Map<number, string | string[] | Record<string, string>>>(new Map())
  const [showAnswer, setShowAnswer] = useState(false)
  const [shuffledOptions, setShuffledOptions] = useState<Map<number, string[]>>(new Map())

  // Shuffle options for multiple choice questions
  useEffect(() => {
    if (!quiz) return

    const shuffled = new Map<number, string[]>()
    quiz.quiz.forEach((q) => {
      if (q.type === 'Multiple Choice' && q.options) {
        const options = [...q.options]
        // Fisher-Yates shuffle
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[options[i], options[j]] = [options[j], options[i]]
        }
        shuffled.set(q.id, options)
      }
    })
    setShuffledOptions(shuffled)
  }, [quiz])

  // Keyboard navigation: Arrow keys for Previous/Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Left arrow for previous
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
          setShowAnswer(false)
        }
      }
      // Right arrow for next
      if (e.key === 'ArrowRight') {
        if (quiz && currentIndex < quiz.quiz.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setShowAnswer(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, quiz])

  if (!quiz || quiz.quiz.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No quiz loaded</p>
      </div>
    )
  }

  const currentQuestion = quiz.quiz[currentIndex]
  const totalQuestions = quiz.quiz.length
  const userAnswer = userAnswers.get(currentQuestion.id)

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
    }
  }

  const handleAnswerChange = (answer: string | string[] | Record<string, string>) => {
    const newAnswers = new Map(userAnswers)
    newAnswers.set(currentQuestion.id, answer)
    setUserAnswers(newAnswers)
  }

  const checkAnswer = (): boolean => {
    if (!userAnswer) return false
    const correctAnswer = currentQuestion.answer

    // Handle object answers (matching tasks)
    if (typeof correctAnswer === 'object' && !Array.isArray(correctAnswer) && typeof userAnswer === 'object' && !Array.isArray(userAnswer)) {
      const correctKeys = Object.keys(correctAnswer)
      const userKeys = Object.keys(userAnswer)
      
      if (correctKeys.length !== userKeys.length) return false
      
      return correctKeys.every(key => correctAnswer[key] === userAnswer[key])
    }

    // Handle array answers (multiple choice)
    if (Array.isArray(correctAnswer)) {
      // If user answer is also an array (multi-select)
      if (Array.isArray(userAnswer)) {
        return correctAnswer.length === userAnswer.length && 
               correctAnswer.every(a => userAnswer.includes(a))
      }
      // If user answer is a string (single select radio button)
      if (typeof userAnswer === 'string') {
        return correctAnswer.length === 1 && correctAnswer[0] === userAnswer
      }
    }
    
    // Handle string answers (short answer, gap-fill)
    if (typeof correctAnswer === 'string' && typeof userAnswer === 'string') {
      return userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()
    }

    return false
  }

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case 'Multiple Choice': {
        const options = shuffledOptions.get(currentQuestion.id) || currentQuestion.options || []
        const isMultiSelect = Array.isArray(currentQuestion.answer) && currentQuestion.answer.length > 1
        
        if (isMultiSelect) {
          // Checkbox for multi-select
          const selectedOptions = Array.isArray(userAnswer) ? userAnswer : []
          return (
            <div className="space-y-3">
              <p className="text-sm text-blue-600 font-medium mb-2">Select all that apply</p>
              {options.map((option, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={selectedOptions.includes(option)}
                    onChange={(e) => {
                      const newSelected = e.target.checked
                        ? [...selectedOptions, option]
                        : selectedOptions.filter(o => o !== option)
                      handleAnswerChange(newSelected)
                    }}
                    className="mt-1"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>
          )
        } else {
          // Radio button for single-select
          return (
            <div className="space-y-3">
              {options.map((option, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={userAnswer === option}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="mt-1"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>
          )
        }
      }

      case 'Short-Answer Questions':
      case 'Completion Tasks (Gap-fill)':
        return (
          <div>
            {currentQuestion.sentence && (
              <p className="mb-4 text-gray-700 italic">{currentQuestion.sentence}</p>
            )}
            <input
              type="text"
              value={(userAnswer as string) || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )

      case 'Identifying Information/Views':
        return (
          <div className="space-y-4">
            {currentQuestion.statement && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-gray-800">{currentQuestion.statement}</p>
              </div>
            )}
            <div className="flex gap-3">
              {['True', 'False', 'Not Given'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswerChange(option)}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    userAnswer === option
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )

      case 'Matching Tasks': {
        const userMatches = (userAnswer as Record<string, string>) || {}
        const headings = currentQuestion.headings || []
        const paragraphs = currentQuestion.paragraphs || []
        
        return (
          <div className="space-y-6">
            <p className="text-sm text-blue-600 font-medium">Match each heading to the correct paragraph</p>
            
            {/* Paragraphs Reference Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Reference - Paragraphs:</h4>
              <div className="space-y-2">
                {paragraphs.map((paragraph, pIdx) => (
                  <div key={pIdx} className="text-sm text-gray-700">
                    <span className="font-medium">{paragraph.split(':')[0]}:</span>
                    <span className="ml-1">{paragraph.split(':').slice(1).join(':')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Matching Section */}
            <div className="space-y-3">
              {headings.map((heading, idx) => (
                <div key={idx} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <p className="font-medium text-gray-800 mb-3">{heading}</p>
                  <select
                    value={userMatches[heading] || ''}
                    onChange={(e) => {
                      const newMatches = { ...userMatches, [heading]: e.target.value }
                      handleAnswerChange(newMatches)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Select a paragraph --</option>
                    {paragraphs.map((paragraph, pIdx) => {
                      const label = paragraph.split(':')[0] // Extract "Paragraph A", "Paragraph B", etc.
                      return (
                        <option key={pIdx} value={label}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )
      }

      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Question type "{currentQuestion.type}" not yet supported</p>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quiz Practice</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Close Quiz
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalQuestions}
              value={currentIndex + 1}
              onChange={(e) => {
                const num = parseInt(e.target.value)
                if (num >= 1 && num <= totalQuestions) {
                  setCurrentIndex(num - 1)
                  setShowAnswer(false)
                }
              }}
              onWheel={(e) => {
                e.preventDefault()
                const delta = e.deltaY > 0 ? 1 : -1
                const newIndex = currentIndex + delta
                if (newIndex >= 0 && newIndex < totalQuestions) {
                  setCurrentIndex(newIndex)
                  setShowAnswer(false)
                }
              }}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              title="Type or scroll to change question"
            />
          </div>
          <span className="text-sm text-gray-600">
            Answered: {userAnswers.size} / {totalQuestions}
          </span>
        </div>
        <div 
          className="w-full bg-gray-200 rounded-full h-3 cursor-pointer hover:bg-gray-300 transition-colors"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percentage = x / rect.width
            const questionIndex = Math.floor(percentage * totalQuestions)
            const clampedIndex = Math.max(0, Math.min(questionIndex, totalQuestions - 1))
            setCurrentIndex(clampedIndex)
            setShowAnswer(false)
          }}
          onWheel={(e) => {
            e.preventDefault()
            const delta = e.deltaY > 0 ? 1 : -1
            const newIndex = currentIndex + delta
            if (newIndex >= 0 && newIndex < totalQuestions) {
              setCurrentIndex(newIndex)
              setShowAnswer(false)
            }
          }}
          title="Click to jump to question • Scroll to navigate"
        >
          <div
            className="bg-blue-500 h-3 rounded-full transition-all pointer-events-none"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          Use <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">←</kbd> <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">→</kbd> arrow keys • Click or scroll progress bar • Scroll on input
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
            {currentQuestion.type}
          </span>
          {currentQuestion.instruction && (
            <p className="text-sm text-gray-500 italic mb-3">{currentQuestion.instruction}</p>
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-6">{currentQuestion.question}</h3>

        {renderQuestionContent()}

        {/* Answer Section */}
        {showAnswer && (
          <div className={`mt-6 p-4 rounded-lg border ${
            checkAnswer() 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <p className="font-semibold mb-2">
              {checkAnswer() ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            <div className="text-gray-700">
              <strong>Correct Answer:</strong>
              {Array.isArray(currentQuestion.answer) ? (
                <span className="ml-2">{currentQuestion.answer.join(', ')}</span>
              ) : typeof currentQuestion.answer === 'object' ? (
                <ul className="mt-2 ml-4 space-y-1">
                  {Object.entries(currentQuestion.answer).map(([key, value]) => (
                    <li key={key} className="text-sm">
                      <span className="font-medium">{key}</span> → {value}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="ml-2">{currentQuestion.answer}</span>
              )}
            </div>
            {userAnswer && !checkAnswer() && (
              <div className="text-gray-600 mt-3">
                <strong>Your Answer:</strong>
                {Array.isArray(userAnswer) ? (
                  <span className="ml-2">{userAnswer.join(', ')}</span>
                ) : typeof userAnswer === 'object' ? (
                  <ul className="mt-2 ml-4 space-y-1">
                    {Object.entries(userAnswer).map(([key, value]) => (
                      <li key={key} className="text-sm">
                        <span className="font-medium">{key}</span> → {value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="ml-2">{userAnswer}</span>
                )}
              </div>
            )}
            {currentQuestion.explanation && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-gray-700">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous question (← Left Arrow)"
        >
          ← Previous
        </button>

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === totalQuestions - 1}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next question (→ Right Arrow)"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default QuizPractice
