import Tabs from './components/Tabs'
import ParagraphTranslator from './components/ParagraphTranslator'
import ListeningMode from './components/ListeningMode'

function App(): React.JSX.Element {
  const tabs = [
    {
      id: 'reading',
      label: 'Reading',
      content: <ParagraphTranslator />
    },
    {
      id: 'listening',
      label: 'Listening',
      content: <ListeningMode />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs tabs={tabs} />
    </div>
  )
}

export default App
