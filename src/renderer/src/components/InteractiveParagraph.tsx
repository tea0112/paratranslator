import { useState } from 'react'
import * as Diff from 'diff'
import InteractiveSentence from './InteractiveSentence'
import { InteractiveParagraphProps } from '../types/translator.types'

function InteractiveParagraph({
  sentences,
  onSentenceClick,
  onHideTranslation,
  activeSentence,
  paragraphIndex,
  searchQuery,
  caseSensitive,
  showTranslation,
  onTranslationEdit
}: InteractiveParagraphProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedTranslation, setEditedTranslation] = useState('')
  const [originalTranslation, setOriginalTranslation] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingSentenceIndex, setPendingSentenceIndex] = useState<number | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartEdit = (translation: string) => {
    setOriginalTranslation(translation)
    setEditedTranslation(translation)
    setEditMode(true)
    setShowConfirmDialog(false)
  }

  const handleRequestConfirm = (sentenceIndex: number) => {
    if (editedTranslation !== originalTranslation) {
      setPendingSentenceIndex(sentenceIndex)
      setShowConfirmDialog(true)
    } else {
      setEditMode(false)
    }
  }

  const handleConfirmEdit = () => {
    if (pendingSentenceIndex !== null && onTranslationEdit) {
      onTranslationEdit(paragraphIndex, pendingSentenceIndex, editedTranslation)
    }
    setEditMode(false)
    setShowConfirmDialog(false)
    setPendingSentenceIndex(null)
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setShowConfirmDialog(false)
    setEditedTranslation('')
    setPendingSentenceIndex(null)
  }

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false)
    setPendingSentenceIndex(null)
  }

  const renderDiff = () => {
    const diff = Diff.diffWords(originalTranslation, editedTranslation)
    
    return (
      <div className="p-4 bg-gray-50 border border-gray-300 rounded text-sm font-mono leading-relaxed">
        {diff.map((part, index) => {
          if (part.added) {
            return (
              <span
                key={index}
                className="bg-green-200 text-green-900 px-1 rounded"
                title="Added"
              >
                {part.value}
              </span>
            )
          }
          if (part.removed) {
            return (
              <span
                key={index}
                className="bg-red-200 text-red-900 line-through px-1 rounded"
                title="Removed"
              >
                {part.value}
              </span>
            )
          }
          return <span key={index}>{part.value}</span>
        })}
      </div>
    )
  }

  // Calculate match offset for each sentence
  const getMatchOffsetForSentence = (sentenceIndex: number): number => {
    if (!searchQuery || !searchQuery.trim()) return 0
    
    let offset = 0
    for (let i = 0; i < sentenceIndex; i++) {
      const text = sentences[i].english
      const pattern = caseSensitive ? searchQuery : searchQuery.toLowerCase()
      const searchText = caseSensitive ? text : text.toLowerCase()
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const matches = searchText.match(new RegExp(escapedPattern, 'g'))
      if (matches) offset += matches.length
    }
    return offset
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
                searchQuery={searchQuery}
                caseSensitive={caseSensitive}
                matchOffset={getMatchOffsetForSentence(index)}
              />
              {/* Show translation inline with buttons */}
              {isActive && showTranslation && (
                <span className="inline-flex items-center gap-2 ml-3 mr-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                  {!editMode ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onHideTranslation()
                        }}
                        className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm not-italic"
                        title="Hide translation"
                      >
                        ✕
                      </button>
                      <span className="italic">→ {sentence.vietnamese}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(sentence.vietnamese)
                        }}
                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm not-italic"
                        title="Edit translation"
                      >
                        ✏️
                      </button>
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
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-start gap-2">
                        <span className="text-xs not-italic text-gray-600 mt-2">Edit:</span>
                        <textarea
                          value={editedTranslation}
                          onChange={(e) => setEditedTranslation(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-3 py-2 border border-blue-300 rounded text-sm not-italic text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
                          autoFocus
                          spellCheck={false}
                          style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        {editedTranslation !== originalTranslation && (
                          <span className="text-xs not-italic text-orange-600 font-semibold mr-auto">
                            ⚠️ Changed
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRequestConfirm(index)
                          }}
                          className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm not-italic"
                          title="Confirm changes"
                        >
                          ✓ Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancelEdit()
                          }}
                          className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm not-italic"
                          title="Cancel editing"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </span>
              )}
            </span>
          )
        })}
      </p>

      {/* Confirmation Dialog with Diff */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Translation Change</h3>
            <p className="text-sm text-orange-600 mb-4 flex items-center gap-2">
              <span>⚠️</span>
              <span>Changes are not saved yet. Review and confirm to save.</span>
            </p>
            
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-red-200 rounded"></span>
                  <span>Removed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-green-200 rounded"></span>
                  <span>Added</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-gray-200 rounded"></span>
                  <span>Unchanged</span>
                </div>
              </div>

              {/* Diff Display */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">Changes:</span>
                </div>
                {renderDiff()}
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded text-center">
                  <div className="text-xs text-red-700 font-semibold">Original Length</div>
                  <div className="text-lg font-bold text-red-900">{originalTranslation.length}</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-center">
                  <div className="text-xs text-blue-700 font-semibold">Difference</div>
                  <div className="text-lg font-bold text-blue-900">
                    {editedTranslation.length > originalTranslation.length ? '+' : ''}{editedTranslation.length - originalTranslation.length}
                  </div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded text-center">
                  <div className="text-xs text-green-700 font-semibold">New Length</div>
                  <div className="text-lg font-bold text-green-900">{editedTranslation.length}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancelConfirm()
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title="Go back to editor without saving"
              >
                ← Back to Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleConfirmEdit()
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                title="Save changes to file"
              >
                ✓ Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveParagraph
