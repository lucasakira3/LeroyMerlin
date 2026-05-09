'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'

interface VoiceButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export default function VoiceButton({ onTranscript, disabled = false }: VoiceButtonProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      setIsSupported(true)
    }
  }, [])

  if (!isSupported) return null

  const handleClick = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionAPI()

    recognition.lang = 'pt-BR'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isListening ? 'Parar gravação de voz' : 'Buscar por voz'}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
        isListening
          ? 'bg-lm-green text-white animate-pulse'
          : 'text-gray-400 hover:text-lm-green hover:bg-green-50'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Mic size={18} />
    </button>
  )
}
