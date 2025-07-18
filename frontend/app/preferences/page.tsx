"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface QuizQuestion {
  id: string
  question: string
  type: "multiple_choice" | "open_ended" | "multi_select"
  options?: string[]
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

  const submitResponse = async (answer: string | string[]) => {
    const currentQuestion = questions[currentQuestionIndex]
    const newResponse = {
      question_id: currentQuestion.id,
      response: answer,
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/style/quiz/submit-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newResponse),
      })

      if (response.ok) {
        setResponses([...responses, newResponse])
        setSelectedOptions([])
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
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option)
      } else {
        return [...prev, option]
      }
    })
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
        toast({
          title: "Quiz Completed!",
          description: "Your style preferences have been saved.",
        })
        router.push("/")
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading...</h2>
          <p className="mt-2 text-gray-600">Please wait while we prepare your style quiz.</p>
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
              <button
                onClick={() => submitResponse(selectedOptions)}
                disabled={selectedOptions.length === 0}
                className={`bg-blue-600 text-white px-6 py-2 rounded-md transition-colors ${
                  selectedOptions.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-700'
                }`}
              >
                Submit Selection
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                className="w-full p-3 border rounded-md"
                rows={4}
                placeholder="Type your answer here..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    const answer = (e.target as HTMLTextAreaElement).value.trim()
                    if (answer) {
                      submitResponse(answer)
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const answer = document.querySelector("textarea")?.value.trim()
                  if (answer) {
                    submitResponse(answer)
                  }
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  )
} 