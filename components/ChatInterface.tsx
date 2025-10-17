import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, CopyIcon, FileIcon } from './Icons';
import { SparklesIcon, UserIcon } from '@heroicons/react/24/solid';
import { marked } from 'marked';

// Declare global Prism object for syntax highlighting
declare const Prism: any;

const LoadingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse-fast"></div>
        <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse-medium"></div>
        <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse-slow"></div>
    </div>
);


const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const renderedContent = isUser ? null : marked.parse(message.content, { breaks: true, gfm: true });

  useEffect(() => {
    if (!isUser && typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
  }, [message.content, isUser]);


  return (
    <div className={`flex items-start gap-3 my-4 animate-fade-in group ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div className={`relative max-w-xl p-3 rounded-lg ${isUser ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
        {isUser ? (
             <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
             <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderedContent as string }} />
        )}
        
        {!isUser && (
             <button onClick={handleCopy} className="absolute -top-2 -right-2 p-1 bg-slate-300 dark:bg-slate-600 rounded-full text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" title="Copy text">
                <CopyIcon className="w-4 h-4" />
            </button>
        )}
        {copied && <span className="absolute -top-8 right-0 text-xs bg-slate-800 text-white px-2 py-1 rounded">Copied!</span>}

        {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-300 dark:border-slate-600">
                <h4 className="text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Sources:</h4>
                <div className="flex flex-wrap gap-2">
                    {message.citations.map((citation, i) => (
                        <div key={i} className="flex items-center text-xs bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-full">
                           <FileIcon className="w-3 h-3 mr-1.5"/>
                           {citation}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-200" />
        </div>
      )}
    </div>
  );
};


interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isReady: boolean;
  onStop: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, isReady, onStop }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && isReady) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="flex-1 p-6 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500">
             <SparklesIcon className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600"/>
             <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300">Welcome to RAG Search</h2>
             <p className="mt-2">Upload some documents to start asking questions.</p>
          </div>
        ) : (
            <>
                {messages.map((msg, index) => <Message key={index} message={msg} />)}
                {isLoading && messages[messages.length-1].role === 'user' && (
                    <div className="flex items-start gap-3 my-4">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="max-w-xl p-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            <LoadingIndicator />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        {isLoading && (
            <div className="flex justify-center mb-2">
                <button onClick={onStop} className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-full hover:bg-red-700">
                    Stop generating
                </button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReady ? 'Ask a question about your documents...' : 'Please upload a document first'}
            disabled={!isReady || isLoading}
            className="flex-1 w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
          />
          <button
            type="submit"
            disabled={!isReady || isLoading || !input.trim()}
            className="flex-shrink-0 p-2 text-white bg-indigo-600 rounded-full disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;