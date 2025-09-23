import React, { useState } from 'react'

function ChatInput({ onSendMessage }) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text) return
    if (onSendMessage) onSendMessage(text)
    setInputValue('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 p-3 flex items-center gap-2 bg-white"
    >
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
        disabled={!inputValue.trim()}
      >
        Send
      </button>
    </form>
  )
}

export default ChatInput

