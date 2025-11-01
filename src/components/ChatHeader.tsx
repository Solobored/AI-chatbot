import { useState } from 'react';
import { MessageCircle, Settings, Trash2, Database, WifiOff, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ModeSelector from './ModeSelector';
import { ChatSession, AIMode } from '@/services/api';

interface ChatHeaderProps {
  currentSession: ChatSession | null;
  modes: AIMode[];
  currentMode: string;
  saveHistory: boolean;
  darkMode: boolean;
  onModeChange: (mode: string) => void;
  onToggleSaveHistory: (enabled: boolean) => void;
  onToggleDarkMode: (enabled: boolean) => void;
  onEraseData: () => void;
  isBackendConnected: boolean;
}

export default function ChatHeader({ 
  currentSession,
  modes,
  currentMode,
  saveHistory, 
  darkMode,
  onModeChange,
  onToggleSaveHistory, 
  onToggleDarkMode,
  onEraseData,
  isBackendConnected 
}: ChatHeaderProps) {
  const [isErasing, setIsErasing] = useState(false);

  const handleEraseData = async () => {
    setIsErasing(true);
    try {
      await onEraseData();
    } finally {
      setIsErasing(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentSession ? currentSession.name : 'Private AI Chatbot'}
              </h1>
              <div className="flex items-center gap-2 text-sm">
                {isBackendConnected ? (
                  <>
                    <Database className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Backend Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Backend Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="hidden md:block">
            <ModeSelector
              modes={modes}
              currentMode={currentMode}
              onModeChange={onModeChange}
              disabled={!isBackendConnected}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Mode Selector */}
          <div className="md:hidden">
            <ModeSelector
              modes={modes}
              currentMode={currentMode}
              onModeChange={onModeChange}
              disabled={!isBackendConnected}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Chat Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure your chat preferences
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="save-history" className="text-sm font-medium">
                      Save Chat History
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Store conversations in local database
                    </p>
                  </div>
                  <Switch
                    id="save-history"
                    checked={saveHistory}
                    onCheckedChange={onToggleSaveHistory}
                    disabled={!isBackendConnected}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="dark-mode" className="text-sm font-medium">
                      Dark Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Toggle dark theme
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={onToggleDarkMode}
                  />
                </div>

                <div className="pt-2 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full gap-2"
                        disabled={!isBackendConnected || isErasing}
                      >
                        <Trash2 className="w-4 h-4" />
                        {isErasing ? 'Erasing...' : 'Erase All Data'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Erase All Chat Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all
                          saved chat sessions and messages from your local database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleEraseData}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Erase All Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}