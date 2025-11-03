import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AIMode, AnalysisResult } from '@/services/api';

interface SpecialRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (name: string, mode: string, description: string) => void;
  onAnalyzeRequest: (description: string) => Promise<AnalysisResult>;
  modes: AIMode[];
}

export default function SpecialRequestModal({
  isOpen,
  onClose,
  onCreateSession,
  onAnalyzeRequest,
  modes,
}: SpecialRequestModalProps) {
  const [description, setDescription] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'describe' | 'review'>('describe');

  const handleAnalyze = async () => {
    if (!description.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await onAnalyzeRequest(description);
      setAnalysis(result);
      setSessionName(result.suggested_name);
      setSelectedMode(result.suggested_mode);
      setStep('review');
    } catch (error) {
      console.error('Failed to analyze request:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreate = async () => {
    if (!sessionName.trim() || !selectedMode) return;

    setIsCreating(true);
    try {
      await onCreateSession(sessionName, selectedMode, description);
      handleClose();
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setSessionName('');
    setSelectedMode('');
    setAnalysis(null);
    setStep('describe');
    onClose();
  };

  const handleBack = () => {
    setStep('describe');
    setAnalysis(null);
  };

  const getModeInfo = (modeId: string) => {
    return modes.find(mode => mode.id === modeId) || modes[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Create Special Request
          </DialogTitle>
          <DialogDescription>
            Describe what you need help with, and I'll suggest the best AI mode and session name for you.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'describe' && (
            <motion.div
              key="describe"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="description">What do you need help with?</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your request in detail. For example:
• I need help debugging a React component that's not rendering properly
• I want to create a business plan for my startup idea
• Help me write a creative story about time travel
• I need assistance with Python data analysis"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-gray-500">
                  Be specific about your needs so I can suggest the best AI mode for you.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={!description.trim() || isAnalyzing}
                  className="flex-1 gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Analyze Request
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isAnalyzing}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'review' && analysis && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Analysis Results */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">AI Analysis Complete</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-blue-800">Suggested Mode:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {analysis.mode_info.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      {analysis.mode_info.description}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-blue-800">Suggested Name:</span>
                    <p className="text-sm text-blue-700 mt-1 font-medium">
                      "{analysis.suggested_name}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Customization */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-name">Session Name</Label>
                  <Input
                    id="session-name"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Enter session name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode-select">AI Mode</Label>
                  <select
                    id="mode-select"
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {modes.map(mode => (
                      <option key={mode.id} value={mode.id}>
                        {mode.name} - {mode.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <Label className="text-sm font-medium text-gray-700">Your Request:</Label>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreate}
                  disabled={!sessionName.trim() || !selectedMode || isCreating}
                  className="flex-1 gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Session
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isCreating}
                >
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}