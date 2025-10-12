// /src/components/ui/Tabs.tsx
export const Tabs = ({ children }: { children: React.ReactNode }) => <div className="tabs">{children}</div>;
export const TabsList = ({ children }: { children: React.ReactNode }) => <div className="tabs-list flex gap-2 border-b">{children}</div>;
export const TabsTrigger = ({ children }: { children: React.ReactNode }) => <button className="tab-trigger p-2">{children}</button>;
export const TabsContent = ({ children }: { children: React.ReactNode }) => <div className="tab-content mt-4">{children}</div>;