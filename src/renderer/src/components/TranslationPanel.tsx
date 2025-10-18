import { TranslationPanelProps } from '../types/translator.types'
import { useState } from 'react'

function TranslationPanel({ translation, englishText }: TranslationPanelProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (englishText) {
      navigator.clipboard.writeText(englishText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="sticky top-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-semibold text-gray-700">Translation</h2>
        {englishText && (
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center gap-2"
            title="Copy English sentence"
          >
            {copied ? (
              <>
                <span>✓</span>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copy English</span>
              </>
            )}
          </button>
        )}
      </div>
      <p className="text-gray-600 text-lg italic min-h-[50px]">
        {translation || 'Click a sentence to see it here.'}
      </p>
    </div>
  )
}

export default TranslationPanel
