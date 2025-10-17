import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DocumentFile, ChatMessage } from './types';
import { generateAnswerStream } from './services/geminiService';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';
import ChatInterface from './components/ChatInterface';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import { SunIcon, MoonIcon, XCircleIcon, ChatBubbleBottomCenterTextIcon, ArrowRightOnRectangleIcon } from './components/Icons';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';


// Declare global libraries loaded from script tags in index.html
declare const pdfjsLib: any;
declare const mammoth: any;


// Custom hook for file processing
const useFileProcessor = () => {
  const processFiles = useCallback(async (files: File[]): Promise<DocumentFile[]> => {
    const processedDocs: DocumentFile[] = [];

    for (const file of files) {
      let content: string;
      let readable = false;

      try {
        if (file.type === 'text/plain') {
          content = await file.text();
          readable = true;
        } else if (file.type === 'application/pdf' && typeof pdfjsLib !== 'undefined') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          const numPages = pdf.numPages;
          let pdfText = '';
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map((item: any) => item.str).join(' ');
            pdfText += '\n'; // Add newline between pages
          }
          content = pdfText;
          readable = true;
        } else if ((file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) && typeof mammoth !== 'undefined') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
          readable = true;
        } else {
          content = `File type "${file.type || 'unknown'}" is not supported. Please upload TXT, PDF, or DOCX files.`;
          readable = false;
        }
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
        content = `Could not read file content. Error: ${error instanceof Error ? error.message : String(error)}`;
        readable = false;
      }

      processedDocs.push({
        name: file.name,
        content,
        type: file.type,
        readable,
      });
    }
    return processedDocs;
  }, []);

  return { processFiles };
};

// Custom hook for RAG streaming and state management
const useRAG = (documents: DocumentFile[]) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleSendMessage = useCallback(async (message: string) => {
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: message }]);
        
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const stream = generateAnswerStream(documents, message, signal);
            let fullResponse = "";
            let modelMessage: ChatMessage = { role: 'model', content: '' };

            setMessages(prev => [...prev, modelMessage]);

            for await (const chunk of stream) {
                if (signal.aborted) break;
                fullResponse += chunk;

                // Update the last message in the array with the new content
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        // Extract citations
                        const citationRegex = /\[Source: (.*?)\]/g;
                        const citations = [...fullResponse.matchAll(citationRegex)].map(match => match[1]);
                        const contentWithoutCitations = fullResponse.replace(citationRegex, '').trim();

                        lastMessage.content = contentWithoutCitations;
                        lastMessage.citations = citations.length > 0 ? citations : undefined;
                    }
                    return newMessages;
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setMessages(prev => [...prev, { role: 'model', content: `Error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [documents]);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    return { messages, setMessages, isLoading, handleSendMessage, stopGeneration };
}


type Theme = 'light' | 'dark';

const ThemeToggle: React.FC<{ theme: Theme, setTheme: (theme: Theme) => void }> = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>
    );
};


const RAGApplication: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const { messages, setMessages, isLoading, handleSendMessage, stopGeneration } = useRAG(documents);
  const { processFiles } = useFileProcessor();
  const { logout } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // PDF worker setup
  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js`;
    }
  }, []);
  
  // Session persistence on load
  useEffect(() => {
    try {
        const savedDocs = localStorage.getItem('rag_documents');
        const savedMessages = localStorage.getItem('rag_messages');
        if (savedDocs) setDocuments(JSON.parse(savedDocs));
        if (savedMessages) setMessages(JSON.parse(savedMessages));
    } catch(e) {
        console.error("Failed to load session from localStorage", e);
        localStorage.removeItem('rag_documents');
        localStorage.removeItem('rag_messages');
    }
  }, []);

  // Session persistence on change
  useEffect(() => {
    try {
        localStorage.setItem('rag_documents', JSON.stringify(documents));
    } catch(e) {
        console.error("Failed to save documents to localStorage", e);
    }
  }, [documents]);

  useEffect(() => {
    try {
        localStorage.setItem('rag_messages', JSON.stringify(messages));
    } catch(e) {
        console.error("Failed to save messages to localStorage", e);
    }
  }, [messages]);


  const handleFilesAdded = useCallback(async (files: File[]) => {
    const newDocs = await processFiles(files);
    setDocuments(prevDocs => {
      const existingNames = new Set(prevDocs.map(d => d.name));
      const uniqueNewDocs = newDocs.filter(d => !existingNames.has(d.name));
      return [...prevDocs, ...uniqueNewDocs];
    });
  }, [processFiles]);

  const handleRemoveDocument = useCallback((name: string) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.name !== name));
  }, []);

  const handleClearDocuments = () => {
    if (window.confirm("Are you sure you want to remove all uploaded documents?")) {
        setDocuments([]);
    }
  }

  const handleNewChat = () => {
    if (window.confirm("Are you sure you want to start a new chat? The current conversation will be cleared.")) {
        setMessages([]);
    }
  }


  return (
    <div className="min-h-screen font-sans transition-colors duration-300">
      <main className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 flex items-center space-x-2">
             <ThemeToggle theme={theme} setTheme={setTheme} />
             <button
                onClick={logout}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Logout"
                title="Logout"
             >
                <ArrowRightOnRectangleIcon className="w-6 h-6" />
             </button>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Knowledge-base Search Engine</h1>
          <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">Upload documents and ask questions with AI</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1 p-6 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">1. Upload</h2>
                 {documents.length > 0 && (
                     <button onClick={handleClearDocuments} className="flex items-center text-xs text-red-500 dark:text-red-400 hover:underline" title="Clear all documents">
                         <XCircleIcon className="w-4 h-4 mr-1"/>
                         Clear
                     </button>
                 )}
            </div>
            <FileUploader onFilesAdded={handleFilesAdded} />
            <FileList documents={documents} onRemoveDocument={handleRemoveDocument} onPreviewDocument={setPreviewDoc} />
          </aside>

          <section className="lg:col-span-2 min-h-[70vh]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">2. Ask Questions</h2>
                {messages.length > 0 && (
                    <button onClick={handleNewChat} className="flex items-center text-xs text-indigo-500 dark:text-indigo-400 hover:underline" title="Start a new chat">
                        <ChatBubbleBottomCenterTextIcon className="w-4 h-4 mr-1"/>
                        New Chat
                    </button>
                )}
            </div>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isReady={documents.length > 0}
              onStop={stopGeneration}
            />
          </section>
        </div>
      </main>
      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
};

const App: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <RAGApplication /> : <LoginPage />;
}

export default App;
