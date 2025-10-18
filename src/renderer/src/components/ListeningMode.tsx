function ListeningMode(): React.JSX.Element {
  return (
    <div className="flex justify-center p-4 md:p-8">
      <div className="w-full bg-white rounded-xl shadow-md p-6 md:p-10 lg:p-12 xl:p-16">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Listening Mode</h1>
          <p className="text-gray-500 mt-2">
            Listen to audio and see translations
          </p>
        </header>

        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">🎧</div>
            <p className="text-xl text-gray-600">Coming Soon</p>
            <p className="text-gray-500 mt-2">
              Listening mode features will be available here
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListeningMode
