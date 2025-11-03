import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditableSessionNameProps {
  sessionId: string;
  currentName: string;
  isActive: boolean;
  isSpecial?: boolean;
  onUpdateName: (sessionId: string, newName: string) => Promise<void>;
  className?: string;
}

export default function EditableSessionName({
  sessionId,
  currentName,
  isActive,
  isSpecial = false,
  onUpdateName,
  className = '',
}: EditableSessionNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentName);
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(currentName);
  }, [currentName]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue || trimmedValue === currentName) {
      setIsEditing(false);
      setEditValue(currentName);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateName(sessionId, trimmedValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update session name:', error);
      setEditValue(currentName);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(currentName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-1 flex-1 min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-6 text-sm px-2 py-1 min-w-0 flex-1"
          disabled={isUpdating}
          maxLength={100}
        />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isUpdating || !editValue.trim()}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isUpdating}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0 group/name">
      <h3 
        className={`font-medium text-sm truncate cursor-pointer hover:text-blue-600 transition-colors ${
          isActive 
            ? isSpecial 
              ? 'text-purple-900' 
              : 'text-blue-900'
            : 'text-gray-900'
        } ${className}`}
        onClick={handleStartEdit}
        title="Click to edit session name"
      >
        {currentName}
      </h3>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStartEdit}
        className="h-4 w-4 p-0 opacity-0 group-hover/name:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
        title="Edit session name"
      >
        <Edit2 className="w-3 h-3" />
      </Button>
    </div>
  );
}