import React from 'react'

function MessageList({ messages }) {
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
                ' max-w-[75%] px-4 py-2 text-sm'
              }
            >
              {message.text}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MessageList




