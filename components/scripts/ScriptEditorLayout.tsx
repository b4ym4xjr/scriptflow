"use client";

import { useState } from "react";
import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ScriptEditorLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
}

export function ScriptEditorLayout({
  children,
  sidebar,
  header,
}: ScriptEditorLayoutProps) {
  const [activeTab, setActiveTab] = useState<"content" | "details">("content");

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="border-b bg-white px-4 sm:px-6 lg:px-8 py-3 shrink-0">
        {header}
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b shrink-0">
        <button
          onClick={() => setActiveTab("content")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "content"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "details"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Details
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <main
          className={`flex-1 flex flex-col min-w-0 bg-gray-50/50 ${
            activeTab === "details" ? "hidden md:flex" : "flex"
          }`}
        >
          <ScrollArea className="flex-1 h-full">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
              {children}
            </div>
          </ScrollArea>
        </main>

        <Separator orientation="vertical" className="w-px hidden md:block" />

        {/* Sidebar */}
        <aside
          className={`md:w-87.5 w-full bg-gray-50 flex flex-col border-l shrink-0 ${
            activeTab === "content" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b bg-gray-50/50 font-medium text-sm text-gray-500 uppercase tracking-wider hidden md:block">
            Video Details
          </div>
          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-4 space-y-6">{sidebar}</div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
