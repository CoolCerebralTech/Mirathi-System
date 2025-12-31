import React from 'react';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger} from '@/components/ui';
import { 
  Users, 
  Gift, 
  Scroll, 
  UserCog, 
  FileSignature 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type EditorTabValue = 
  | 'basics' 
  | 'executors' 
  | 'beneficiaries' 
  | 'assets' 
  | 'witnesses' 
  | 'review';

interface EditorTabsProps {
  activeTab: EditorTabValue;
  onTabChange: (value: string) => void;
  children?: React.ReactNode; // To render TabsContent
  className?: string;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  children,
  className 
}) => {
  const tabs = [
    { value: 'basics', label: 'Basics', icon: Scroll },
    { value: 'executors', label: 'Executors', icon: UserCog },
    { value: 'beneficiaries', label: 'Beneficiaries', icon: Gift },
    { value: 'witnesses', label: 'Witnesses', icon: Users },
    { value: 'review', label: 'Review', icon: FileSignature },
  ];

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={onTabChange} 
      className={cn("w-full flex flex-col", className)}
    >
      <div className="border-b bg-white sticky top-0 z-10 px-4 pt-2">
        <TabsList className="h-12 w-full justify-start gap-2 bg-transparent p-0 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700",
                  "data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600",
                  "rounded-none border-b-2 border-transparent px-4 py-3 h-full",
                  "flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <div className="flex-1 p-4 md:p-6 bg-slate-50/50 min-h-[500px]">
        {children}
      </div>
    </Tabs>
  );
};