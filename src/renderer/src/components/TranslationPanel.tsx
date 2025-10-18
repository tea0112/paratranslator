import { TranslationPanelProps } from '../types/translator.types'

function TranslationPanel({ translation }: TranslationPanelProps): React.JSX.Element {
  return (
    <div className="sticky top-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Translation</h2>
      <p className="text-gray-600 text-lg italic min-h-[50px]">
        {translation || 'Click a sentence to see it here.'}
      </p>
    </div>
  )
}

export default TranslationPanel
