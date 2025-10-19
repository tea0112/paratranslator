import { useState, useEffect } from 'react'
import { Quiz } from '../types/quiz.types'

interface QuizPracticeProps {
  quiz: Quiz | null
  onClose: () => void
}

function QuizPractice({ quiz, onClose }: QuizPracticeProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Map<number, string | string[] | Record<string, string>>>(new Map())
  const [showAnswer, setShowAnswer] = useState(false) // Global answer visibility
  const [shuffledOptions, setShuffledOptions] = useState<Map<number, string[]>>(new Map())
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)

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
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
        setShowAnswer(false)
      }
      // Right arrow for next
      if (e.key === 'ArrowRight' && quiz && currentIndex < quiz.quiz.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
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

  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0, details: [] }
    
    let correct = 0
    const details: Array<{ questionNum: number; question: string; type: string; status: 'correct' | 'incorrect' | 'skipped'; id: number }> = []
    
    quiz.quiz.forEach((question, index) => {
      const userAns = userAnswers.get(question.id)
      
      if (!userAns) {
        details.push({
          questionNum: index + 1,
          question: question.question || question.statement || 'Question',
          type: question.type,
          status: 'skipped',
          id: question.id
        })
        return
      }
      
      const answer = question.answer
      let isCorrect = false
      
      // Check if answer is correct
      if (typeof answer === 'object' && !Array.isArray(answer) && typeof userAns === 'object' && !Array.isArray(userAns)) {
        isCorrect = Object.keys(answer).every(key => answer[key] === userAns[key])
      } else if (Array.isArray(answer)) {
        if (Array.isArray(userAns)) {
          isCorrect = answer.length === userAns.length && answer.every(a => userAns.includes(a))
        } else if (typeof userAns === 'string') {
          isCorrect = answer.length === 1 && answer[0] === userAns
        }
      } else if (typeof answer === 'string' && typeof userAns === 'string') {
        isCorrect = userAns.trim().toLowerCase() === answer.toLowerCase()
      }
      
      if (isCorrect) correct++
      
      details.push({
        questionNum: index + 1,
        question: question.question || question.statement || 'Question',
        type: question.type,
        status: isCorrect ? 'correct' : 'incorrect',
        id: question.id
      })
    })
    
    const total = quiz.quiz.length
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    
    return { correct, total, percentage, details }
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
    setShowStatistics(true)
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">🧪 Quiz Practice</h2>
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitted}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitted ? '✓ Submitted' : 'Submit Quiz'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
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

      {/* Question Card - Scrollable */}
      <div className="flex-1 overflow-y-auto mb-4">
      <div className="bg-white rounded-xl shadow-md p-6">
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

      {/* Statistics Modal */}
      {showStatistics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">📊 Quiz Results</h2>
            
            {(() => {
              const stats = calculateScore()
              return (
                <>
                  {/* Score Display */}
                  <div className="text-center mb-8">
                    <div className="inline-block">
                      <div className={`text-6xl font-bold mb-2 ${
                        stats.percentage >= 80 ? 'text-green-600' : 
                        stats.percentage >= 60 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {stats.percentage}%
                      </div>
                      <p className="text-xl text-gray-600">
                        {stats.correct} out of {stats.total} correct
                      </p>
                    </div>
                  </div>

                  {/* Performance Message */}
                  <div className="text-center mb-6">
                    {stats.percentage >= 90 && (
                      <p className="text-xl text-green-600 font-semibold">🎉 Excellent! Outstanding performance!</p>
                    )}
                    {stats.percentage >= 80 && stats.percentage < 90 && (
                      <p className="text-xl text-green-600 font-semibold">✨ Great job! Well done!</p>
                    )}
                    {stats.percentage >= 60 && stats.percentage < 80 && (
                      <p className="text-xl text-yellow-600 font-semibold">👍 Good work! Keep practicing!</p>
                    )}
                    {stats.percentage < 60 && (
                      <p className="text-xl text-orange-600 font-semibold">💪 Keep learning! Review the material and try again!</p>
                    )}
                  </div>

                  {/* Question Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Question Breakdown:</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        <span className="text-gray-700">Correct: <strong>{stats.correct}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">❌</span>
                        <span className="text-gray-700">Incorrect: <strong>{stats.total - stats.correct}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📝</span>
                        <span className="text-gray-700">Answered: <strong>{userAnswers.size}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⏭️</span>
                        <span className="text-gray-700">Skipped: <strong>{stats.total - userAnswers.size}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results List */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Question Details:</h3>
                    <div className="max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg">
                      {stats.details.map((detail) => (
                        <div
                          key={detail.id}
                          className={`flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            detail.status === 'correct' ? 'bg-green-50' :
                            detail.status === 'incorrect' ? 'bg-red-50' :
                            'bg-gray-50'
                          }`}
                          onClick={() => {
                            setShowStatistics(false)
                            setCurrentIndex(detail.questionNum - 1)
                          }}
                        >
                          <span className="text-2xl">
                            {detail.status === 'correct' ? '✅' : 
                             detail.status === 'incorrect' ? '❌' : 
                             '⏭️'}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700">Q{detail.questionNum}</span>
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                {detail.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{detail.question}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            detail.status === 'correct' ? 'bg-green-200 text-green-800' :
                            detail.status === 'incorrect' ? 'bg-red-200 text-red-800' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {detail.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Click on a question to review it</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setShowStatistics(false)
                        setCurrentIndex(0)
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Review Answers
                    </button>
                    <button
                      onClick={() => {
                        setShowStatistics(false)
                        setUserAnswers(new Map())
                        setShowAnswer(false)
                        setIsSubmitted(false)
                        setCurrentIndex(0)
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Retry Quiz
                    </button>
                    <button
                      onClick={() => {
                        setShowStatistics(false)
                        onClose()
                      }}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizPractice
