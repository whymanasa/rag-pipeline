import { useState } from 'react'
import MessageList from './components/MessageList.jsx'
import ChatInput from './components/ChatInput.jsx'


function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! Ask me anything.', sender: 'bot' },
  ])

  const handleSendMessage = (userText) => {
    const newMessage = { id: Date.now(), text: userText, sender: 'user' }
    setMessages((prev) => [...prev, newMessage])
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-2xl h-screen flex flex-col">
        <header className="px-4 py-3 bg-white border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
        </header>
        <MessageList messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}

export default App
