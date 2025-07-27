"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface QuizQuestion {
  id: string
  question: string
  type: "multiple_choice" | "text" | "multi_select"
  options?: string[]
  max_selections?: number
}

interface QuizResponse {
  question_id: string
  response: string | string[]
}

export default function PreferencesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<QuizResponse[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [textInput, setTextInput] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [quizStatus, setQuizStatus] = useState<{
    hasQuiz: boolean
    isCompleted: boolean
    canRetake: boolean
  }>({ hasQuiz: false, isCompleted: false, canRetake: false })

  useEffect(() => {
    fetchQuizStatus()
    fetchQuestions()
  }, [])

  // Reset text input when question changes
  useEffect(() => {
    setTextInput('')
    setSelectedOptions([])
    
    // Load existing response for current question
    const existingResponse = responses.find(r => r.question_id === questions[currentQuestionIndex]?.id)
    if (existingResponse) {
      if (Array.isArray(existingResponse.response)) {
        setSelectedOptions(existingResponse.response)
      } else {
        setTextInput(existingResponse.response)
      }
    }
  }, [currentQuestionIndex, questions])

  const fetchQuizStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/style/quiz-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json()
      setQuizStatus(data)
    } catch (error) {
      console.error("Error fetching quiz status:", error)
      toast({
        title: "Error",
        description: "Failed to fetch quiz status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/style/quiz-questions`)
      const data = await response.json()
      setQuestions(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch quiz questions. Please try again.",
        variant: "destructive",
      })
    }
  }

  const startQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/style/quiz/retake`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setCurrentQuestionIndex(0)
        setResponses([])
        setSelectedOptions([])
        setTextInput('')
        setQuizStatus({ hasQuiz: true, isCompleted: false, canRetake: true });
        fetchQuestions();
        toast({
          title: "Quiz Started",
          description: "Let's discover your style preferences!",
        })
      } else {
        const errorData = await response.json();
        toast({
          title: "Error Starting Quiz",
          description: errorData.detail || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive",
      })
    }
  }

  const saveResponse = (answer: string | string[]) => {
    const currentQuestion = questions[currentQuestionIndex]
    const newResponse = {
      question_id: currentQuestion.id,
      response: answer,
    }

    // Update or add response
    setResponses(prev => {
      const existingIndex = prev.findIndex(r => r.question_id === currentQuestion.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = newResponse
        return updated
      } else {
        return [...prev, newResponse]
      }
    })
  }

  const submitResponse = async (answer: string | string[]) => {
    const currentQuestion = questions[currentQuestionIndex]
    
    // Save response locally
    saveResponse(answer)

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/style/quiz/submit-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          response: answer,
        }),
      })

      if (response.ok) {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
          await completeQuiz()
        }
      }
    } catch (error) {
      console.error("Error submitting response:", error)
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMultiSelect = (option: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    const maxSelections = currentQuestion.max_selections

    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option)
      } else {
        // Check if we're at max selections
        if (maxSelections && prev.length >= maxSelections) {
          return prev
        }
        return [...prev, option]
      }
    })
  }

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex]
    
    if (currentQuestion.type === "text") {
      if (textInput.trim()) {
        submitResponse(textInput.trim())
      }
    } else if (currentQuestion.type === "multi_select") {
      if (selectedOptions.length > 0) {
        submitResponse(selectedOptions)
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const completeQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/style/quiz/complete`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setQuizStatus({ hasQuiz: true, isCompleted: true, canRetake: true });
        toast({
          title: "Quiz Completed!",
          description: "Your style profile has been created.",
        })
      }
    } catch (error) {
      console.error("Error completing quiz:", error)
      toast({
        title: "Error",
        description: "Failed to complete quiz. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <p>Loading quiz...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!quizStatus.hasQuiz || quizStatus.isCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Style Preferences</h1>
          {quizStatus.isCompleted ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Your Style Profile</h2>
              <p className="text-gray-600 mb-6">
                You've already completed the style quiz. Your preferences have been saved and are being used to personalize your experience.
              </p>
              <button
                onClick={startQuiz}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Retake Quiz
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Discover Your Style</h2>
              <p className="text-gray-600 mb-6">
                Take our style quiz to help us understand your preferences and provide personalized recommendations.
              </p>
              <button
                onClick={startQuiz}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Start Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const hasResponse = responses.some(r => r.question_id === currentQuestion.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{currentQuestion.question}</h2>

          {currentQuestion.type === "multiple_choice" ? (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => submitResponse(option)}
                  className="w-full text-left p-4 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : currentQuestion.type === "multi_select" ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleMultiSelect(option)}
                    className={`w-full text-left p-4 border rounded-md transition-colors ${
                      selectedOptions.includes(option)
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {currentQuestion.max_selections && (
                <p className="text-sm text-gray-500">
                  Selected: {selectedOptions.length}/{currentQuestion.max_selections}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-3 border rounded-md"
                rows={4}
                placeholder="Type your answer here..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (textInput.trim()) {
                      submitResponse(textInput.trim())
                    }
                  }
                }}
              />
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentQuestion.type === "multi_select" && (
                <Button
                  onClick={() => submitResponse(selectedOptions)}
                  disabled={selectedOptions.length === 0}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Submit Selection
                </Button>
              )}
              
              {currentQuestion.type === "text" && (
                <Button
                  onClick={handleNext}
                  disabled={!textInput.trim()}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Next
                </Button>
              )}

              {currentQuestionIndex === questions.length - 1 && hasResponse && (
                <Button
                  onClick={completeQuiz}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Complete Quiz
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
} 