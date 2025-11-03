import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Download, 
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChatSession, AIMode, AnalysisResult } from '@/services/api';
import SpecialRequestModal from './SpecialRequestModal';
import EditableSessionName from './EditableSessionName';

interface SessionSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  modes: AIMode[];
  isOpen: boolean;
  onToggle: () => void;
  onSelectSession: (sessionId: string) => void;
  onCreateQuickSession: () => void;
  onCreateSpecialSession: (name: string, mode: string, description: string) => void;
  onAnalyzeRequest: (description: string) => Promise<AnalysisResult>;
  onUpdateSessionName: (sessionId: string, newName: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => void;
  onExportSession: (sessionId: string) => void;
}

export default function SessionSidebar({
  sessions,
  currentSessionId,
  modes,
  isOpen,
  onToggle,
  onSelectSession,
  onCreateQuickSession,
  onCreateSpecialSession,
  onAnalyzeRequest,
  onUpdateSessionName,
  onDeleteSession,
  onExportSession,
}: SessionSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSpecialModal, setShowSpecialModal] = useState(false);

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getModeInfo = (modeId: string) => {
    return modes.find(mode => mode.id === modeId) || modes[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  // Separate regular and special sessions
  const regularSessions = filteredSessions.filter(s => !s.is_special);
  const specialSessions = filteredSessions.filter(s => s.is_special);

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed top-20 left-4 z-50 bg-white shadow-md"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-20 z-40 lg:hidden"
              onClick={onToggle}
            />

            {/* Sidebar Content */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Chat Sessions</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="lg:hidden"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={onCreateQuickSession}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </Button>
                  
                  <Button
                    onClick={() => setShowSpecialModal(true)}
                    variant="outline"
                    className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Special Request
                  </Button>
                </div>
              </div>

              {/* Sessions List */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {filteredSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No sessions found</p>
                      {searchTerm && (
                        <p className="text-xs mt-1">Try a different search term</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Regular Sessions */}
                      {regularSessions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 px-2 py-1 mb-2">
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Regular Chats</span>
                            <Badge variant="secondary" className="text-xs">
                              {regularSessions.length}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {regularSessions.map((session) => {
                              const modeInfo = getModeInfo(session.mode);
                              const isActive = session.id === currentSessionId;
                              
                              return (
                                <SessionItem
                                  key={session.id}
                                  session={session}
                                  modeInfo={modeInfo}
                                  isActive={isActive}
                                  onSelect={onSelectSession}
                                  onUpdateName={onUpdateSessionName}
                                  onDelete={onDeleteSession}
                                  onExport={onExportSession}
                                  formatDate={formatDate}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Special Sessions */}
                      {specialSessions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 px-2 py-1 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Special Requests</span>
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                              {specialSessions.length}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {specialSessions.map((session) => {
                              const modeInfo = getModeInfo(session.mode);
                              const isActive = session.id === currentSessionId;
                              
                              return (
                                <SessionItem
                                  key={session.id}
                                  session={session}
                                  modeInfo={modeInfo}
                                  isActive={isActive}
                                  onSelect={onSelectSession}
                                  onUpdateName={onUpdateSessionName}
                                  onDelete={onDeleteSession}
                                  onExport={onExportSession}
                                  formatDate={formatDate}
                                  isSpecial
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Special Request Modal */}
      <SpecialRequestModal
        isOpen={showSpecialModal}
        onClose={() => setShowSpecialModal(false)}
        onCreateSession={onCreateSpecialSession}
        onAnalyzeRequest={onAnalyzeRequest}
        modes={modes}
      />
    </>
  );
}

interface SessionItemProps {
  session: ChatSession;
  modeInfo: AIMode;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
  onUpdateName: (sessionId: string, newName: string) => Promise<void>;
  onDelete: (sessionId: string) => void;
  onExport: (sessionId: string) => void;
  formatDate: (dateString: string) => string;
  isSpecial?: boolean;
}

function SessionItem({
  session,
  modeInfo,
  isActive,
  onSelect,
  onUpdateName,
  onDelete,
  onExport,
  formatDate,
  isSpecial = false,
}: SessionItemProps) {
  return (
    <motion.div
      layout
      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? isSpecial
            ? 'bg-purple-50 border border-purple-200'
            : 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50'
      }`}
      onClick={() => onSelect(session.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isSpecial && <Zap className="w-3 h-3 text-purple-600 flex-shrink-0" />}
            <EditableSessionName
              sessionId={session.id}
              currentName={session.name}
              isActive={isActive}
              isSpecial={isSpecial}
              onUpdateName={onUpdateName}
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className={`text-xs ${
                isSpecial 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {modeInfo.name}
            </Badge>
            <span className="text-xs text-gray-500">
              {session.message_count} msgs
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(session.updated_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onExport(session.id);
            }}
            className="h-6 w-6 p-0"
            title="Export session"
          >
            <Download className="w-3 h-3" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                title="Delete session"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Session</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{session.name}"? 
                  This will permanently remove all messages in this session.
                  {/* Note: No longer mention "if this is the only session" since we always allow deletion */}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(session.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
}