'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ClothingItem {
  name: string
  thumbnail: string
  price: string
  link: string
}

interface Component {
  name: string
  dominant_color: string
  clothing_items: ClothingItem[]
}

interface ResultsData {
  annotated_image_base64: string
  components: Component[]
}

interface ResultsContextType {
  results: ResultsData | null
  setResults: (data: ResultsData) => void
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined)

interface ResultsProviderProps {
  children: ReactNode
}

export const ResultsProvider: React.FC<ResultsProviderProps> = ({ children }) => {
  const [results, setResults] = useState<ResultsData | null>(null)

  return (
    <ResultsContext.Provider value={{ results, setResults }}>
      {children}
    </ResultsContext.Provider>
  )
}

export const useResults = (): ResultsContextType => {
  const context = useContext(ResultsContext)
  if (!context) {
    throw new Error('useResults must be used within a ResultsProvider')
  }
  return context
}
