'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import ParagraphTranslator from '@/components/ParagraphTranslator'
import ListeningMode from '@/components/ListeningMode'

// Disable SSR for Tabs to prevent hydration issues with browser extensions
const Tabs = dynamic(() => import('@/components/Tabs'), { ssr: false })

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMounted(true)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [])

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

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50" suppressHydrationWarning />
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <Tabs tabs={tabs} />
    </div>
  )
}
