import React from 'react'

function MessageList({ messages }) {
  const formatBotMessage = (text) => {
    // Split by line breaks and format
    return text.split('\n').map((line, index, array) => {
      // Handle bold text **text**
      const boldRegex = /\*\*(.*?)\*\*/g
      let formatted = line
      
      // Replace **text** with bold span
      if (line.includes('**')) {
        const parts = []
        let lastIndex = 0
        let match
        
        while ((match = boldRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index))
          }
          parts.push(<strong key={match.index}>{match[1]}</strong>)
          lastIndex = match.index + match[0].length
        }
        
        if (lastIndex < line.length) {
          parts.push(line.substring(lastIndex))
        }
        
        return <div key={index}>{parts}</div>
      }
      
      // Regular line
      return <div key={index}>{line || '\u00A0'}</div>
    })
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
      {messages.map((message) => {
        const isUser = message.sender === 'user'
        return (
          <div
            key={message.id}
            className={
              (isUser ? 'justify-end' : 'justify-start') +
              ' flex w-full'
            }
          >
            <div
              className={
                (isUser
                  ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                  : 'bg-white text-gray-900 rounded-r-lg rounded-tl-lg border border-gray-200 shadow-sm') +
                ' max-w-[75%] px-4 py-3 text-sm leading-relaxed'
              }
              style={isUser ? {} : { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {isUser ? message.text : formatBotMessage(message.text)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MessageList




