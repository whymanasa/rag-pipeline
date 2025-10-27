import { useState } from 'react'
import MessageList from './components/MessageList.jsx'
import ChatInput from './components/ChatInput.jsx'


function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! I\'m your Bengaluru restaurant assistant. I can help you find restaurants, cuisines, locations, and dining recommendations. What would you like to know?', sender: 'bot' },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (userText) => {
    // Add user message immediately
    const newMessage = { id: Date.now(), text: userText, sender: 'user' }
    setMessages((prev) => [...prev, newMessage])
    setIsLoading(true)

    try {
      // Make sure the URL matches your backend server
      const response = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userText }), // Sending { "query": "..." }
      })

      if (!response.ok) {
        // Basic error handling for failed API calls
        const errorData = await response.json()
        throw new Error(`API Error: ${response.statusText} - ${errorData.error || errorData.details}`)
      }

      const data = await response.json() // Expecting { "answer": "..." }

      // Add bot's response to the chat
      const botResponse = {
        id: Date.now() + 1,
        text: data.answer, // Make sure backend sends 'answer' field
        sender: 'bot'
      }
      setMessages(prevMessages => [...prevMessages, botResponse])

    } catch (error) {
      console.error("Failed to get response from backend:", error)
      const errorMessage = {
        id: Date.now() + 1,
        text: `Sorry, I ran into an issue: ${error.message}. Please try again.`,
        sender: 'bot'
      }
      setMessages(prevMessages => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-2xl h-screen flex flex-col">
        <header className="px-4 py-3 bg-white border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">🍽️ Bengaluru Restaurant Guide</h1>
        </header>
        <MessageList messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default App
