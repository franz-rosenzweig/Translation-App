"use client";
import * as Tabs from "@radix-ui/react-tabs";
import { ReactNode } from "react";

type Tab = { value: string; label: string; content: ReactNode };

export default function OutputTabs({ tabs, defaultValue = "edited" }: { tabs: Tab[]; defaultValue?: string }) {
  return (
    <Tabs.Root defaultValue={defaultValue} className="flex flex-col h-full">
      <Tabs.List className="flex gap-1 border-b border-neutral-800 px-2 overflow-x-auto tab-scroll">
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent hover:bg-neutral-800/50 rounded-t transition-colors"
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <div className="flex-1 overflow-auto scrollbar-thin">
        {tabs.map((t) => (
          <Tabs.Content key={t.value} value={t.value} className="p-3 h-full">
            {t.content}
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  );
}
