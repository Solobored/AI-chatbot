import { ChevronDown, Bot, Code, Briefcase, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AIMode } from '@/services/api';

interface ModeSelectorProps {
  modes: AIMode[];
  currentMode: string;
  onModeChange: (mode: string) => void;
  disabled?: boolean;
}

const modeIcons = {
  general: Bot,
  coding: Code,
  business: Briefcase,
  creative: PenTool,
};

const modeColors = {
  general: 'bg-blue-100 text-blue-800 border-blue-200',
  coding: 'bg-green-100 text-green-800 border-green-200',
  business: 'bg-purple-100 text-purple-800 border-purple-200',
  creative: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function ModeSelector({ 
  modes, 
  currentMode, 
  onModeChange, 
  disabled = false 
}: ModeSelectorProps) {
  const currentModeInfo = modes.find(mode => mode.id === currentMode) || modes[0];
  const IconComponent = modeIcons[currentMode as keyof typeof modeIcons] || Bot;
  const colorClass = modeColors[currentMode as keyof typeof modeColors] || modeColors.general;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="gap-2 min-w-[160px] justify-between"
        >
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4" />
            <span className="font-medium">{currentModeInfo?.name}</span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {modes.map((mode) => {
          const ModeIcon = modeIcons[mode.id as keyof typeof modeIcons] || Bot;
          const isSelected = mode.id === currentMode;
          
          return (
            <DropdownMenuItem
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`p-3 cursor-pointer ${isSelected ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-start gap-3 w-full">
                <div className={`p-1.5 rounded-md ${modeColors[mode.id as keyof typeof modeColors] || modeColors.general}`}>
                  <ModeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{mode.name}</span>
                    {isSelected && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}