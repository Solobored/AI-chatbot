import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Wifi, WifiOff, Download } from 'lucide-react';
import ChatHeader from '@/components/ChatHeader';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import SessionSidebar from '@/components/SessionSidebar';
import { chatAPI, ChatSession, AIMode, ChatMessage as ChatMessageType, AnalysisResult } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export default function Index() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [modes, setModes] = useState<AIMode[]>([]);
  const [currentMode, setCurrentMode] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [saveHistory, setSaveHistory] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize data on component mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const initializeApp = async () => {
    try {
      // Check backend connection
      const isConnected = await chatAPI.healthCheck();
      setIsBackendConnected(isConnected);

      if (isConnected) {
        // Load modes
        const modesData = await chatAPI.getModes();
        setModes(modesData);

        // Load sessions
        const sessionsData = await chatAPI.getSessions();
        setSessions(sessionsData);

        // Set current session to the most recent one
        if (sessionsData.length > 0) {
          const mostRecent = sessionsData.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0];
          setCurrentSessionId(mostRecent.id);
          setCurrentMode(mostRecent.mode);
        }
      } else {
        // Load default modes for offline use
        const defaultModes = await chatAPI.getModes();
        setModes(defaultModes);
      }
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize application');
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const messagesData = await chatAPI.getSessionMessages(sessionId);
      const formattedMessages: Message[] = [];
      
      messagesData.forEach(msg => {
        formattedMessages.push({
          id: `user-${msg.id}`,
          text: msg.user_message,
          isUser: true,
          timestamp: msg.timestamp,
        });
        formattedMessages.push({
          id: `ai-${msg.id}`,
          text: msg.ai_response,
          isUser: false,
          timestamp: msg.timestamp,
        });
      });
      
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatAPI.sendMessage(
        messageText, 
        currentSessionId || undefined, 
        currentMode, 
        saveHistory
      );
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: response.response,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsBackendConnected(true);

      // Update current session ID if it was created
      if (!currentSessionId && response.session_id) {
        setCurrentSessionId(response.session_id);
        // Refresh sessions list
        const sessionsData = await chatAPI.getSessions();
        setSessions(sessionsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      if (errorMessage.includes('Backend server is not running')) {
        setIsBackendConnected(false);
      }
      
      // Add error message to chat
      const errorBotMessage: Message = {
        id: `error-${Date.now()}`,
        text: `Sorry, I encountered an error: ${errorMessage}`,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuickSession = async () => {
    try {
      const newSession = await chatAPI.createQuickSession();
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setCurrentMode(newSession.mode);
      setMessages([]);
      toast.success(`Created new chat: ${newSession.name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleCreateSpecialSession = async (name: string, mode: string, description: string) => {
    try {
      const newSession = await chatAPI.createSession(name, mode, true);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setCurrentMode(newSession.mode);
      setMessages([]);
      toast.success(`Created special session: ${name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create special session';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleAnalyzeRequest = async (description: string): Promise<AnalysisResult> => {
    try {
      return await chatAPI.analyzeRequest(description);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze request';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await chatAPI.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If we deleted the current session, switch to another one
      if (sessionId === currentSessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
          setCurrentMode(remainingSessions[0].mode);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
      
      toast.success('Session deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleExportSession = async (sessionId: string) => {
    try {
      const exportData = await chatAPI.exportSession(sessionId);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-session-${exportData.session.name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Session exported successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export session';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setCurrentMode(session.mode);
      setSidebarOpen(false); // Close sidebar on mobile
    }
  };

  const handleModeChange = (mode: string) => {
    setCurrentMode(mode);
  };

  const handleToggleSaveHistory = (enabled: boolean) => {
    setSaveHistory(enabled);
    setError(null);
  };

  const handleToggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    // Apply dark mode to document
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleEraseData = async () => {
    try {
      const result = await chatAPI.eraseAllData();
      setMessages([]);
      setSessions([]);
      setCurrentSessionId(result.new_session_id);
      setError(null);
      
      // Refresh sessions list
      const sessionsData = await chatAPI.getSessions();
      setSessions(sessionsData);
      
      toast.success('All chat data has been successfully erased');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to erase data';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 flex font-inter`}>
      {/* Session Sidebar */}
      <SessionSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        modes={modes}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelectSession={handleSelectSession}
        onCreateQuickSession={handleCreateQuickSession}
        onCreateSpecialSession={handleCreateSpecialSession}
        onAnalyzeRequest={handleAnalyzeRequest}
        onDeleteSession={handleDeleteSession}
        onExportSession={handleExportSession}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ChatHeader
          currentSession={currentSession}
          modes={modes}
          currentMode={currentMode}
          saveHistory={saveHistory}
          darkMode={darkMode}
          onModeChange={handleModeChange}
          onToggleSaveHistory={handleToggleSaveHistory}
          onToggleDarkMode={handleToggleDarkMode}
          onEraseData={handleEraseData}
          isBackendConnected={isBackendConnected}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Connection Status Alert */}
              {!isBackendConnected && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <Alert className="border-amber-200 bg-amber-50">
                    <WifiOff className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Backend Offline:</strong> The Flask server is not running. 
                      You can still use the interface, but AI responses won't work until you start the backend server.
                      <br />
                      <span className="text-sm mt-1 block">
                        Run: <code className="bg-amber-100 px-1 rounded">cd backend && python app.py</code>
                      </span>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6"
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Welcome Message */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wifi className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {currentSession ? `Welcome to ${currentSession.name}` : 'Welcome to Private AI Chatbot'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Your conversations are processed locally with complete privacy. 
                    No data leaves your machine.
                  </p>
                  {isBackendConnected && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Backend connected and ready
                    </p>
                  )}
                  {modes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Current mode: <strong>{modes.find(m => m.id === currentMode)?.name}</strong>
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>💬 Click "New Chat" for quick general conversations</p>
                        <p>✨ Click "Special Request" for AI-powered mode selection</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Chat Messages */}
              <div className="space-y-1">
                <AnimatePresence>
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message.text}
                      isUser={message.isUser}
                      timestamp={message.timestamp}
                    />
                  ))}
                </AnimatePresence>
                
                {/* Loading Indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 mb-4"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={!isBackendConnected}
          />
        </main>
      </div>
    </div>
  );
}