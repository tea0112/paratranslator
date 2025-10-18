import { useState } from 'react'
import InteractiveParagraph from './InteractiveParagraph'
import TranslationPanel from './TranslationPanel'
import { Paragraph } from '../types/translator.types'
import { DEFAULT_PARAGRAPHS } from '../data/sampleData'

function ParagraphTranslator(): React.JSX.Element {
  const [translation, setTranslation] = useState<string | null>(null)
  const [activeSentence, setActiveSentence] = useState<{
    paragraphIndex: number
    sentenceIndex: number
  } | null>(null)
  const [paragraphs, setParagraphs] = useState<Paragraph[]>(DEFAULT_PARAGRAPHS)
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSentenceClick = (
    translationText: string,
    paragraphIndex: number,
    sentenceIndex: number
  ): void => {
    setTranslation(translationText)
    setActiveSentence({ paragraphIndex, sentenceIndex })
  }

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
      setTranslation(null)
      setActiveSentence(null)
    } catch (err) {
      setError(`Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleReset = (): void => {
    setParagraphs(DEFAULT_PARAGRAPHS)
    setLoadedFileName(null)
    setError(null)
    setTranslation(null)
    setActiveSentence(null)
  }

  return (
    <div className="bg-gray-100 flex justify-center p-4 md:p-8 min-h-screen">
      <div className="w-full bg-white rounded-xl shadow-md p-6 md:p-10 lg:p-12 xl:p-16">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Interactive Paragraphs</h1>
          <p className="text-gray-500 mt-2">
            Click on any underlined sentence on the left to see its translation on the right.
          </p>

          {/* File Loader */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleLoadFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Load JSON File
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

            {loadedFileName && (
              <div className="text-sm text-green-600 font-medium">
                📄 Loaded: {loadedFileName}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg max-w-xl">
                ⚠️ {error}
              </div>
            )}
          </div>
        </header>

        <div className="flex flex-col md:flex-row md:space-x-8">
          {/* Left Column: English Paragraphs */}
          <main className="md:w-3/5 space-y-6 text-gray-700 text-lg leading-relaxed">
            {paragraphs.map((paragraph, index) => (
              <InteractiveParagraph
                key={index}
                sentences={paragraph}
                onSentenceClick={handleSentenceClick}
                activeSentence={activeSentence}
                paragraphIndex={index}
              />
            ))}
          </main>

          {/* Right Column: Vietnamese Translation */}
          <aside className="md:w-2/5 mt-8 md:mt-0">
            <TranslationPanel translation={translation} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ParagraphTranslator
