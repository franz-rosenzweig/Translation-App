"use client";

export default function SimpleHeader() {
  return (
    <div className="bg-panel border-b border-default pt-7 pb-3 sm:pt-9 sm:pb-4 px-4 flex items-center justify-between">
      {/* Draggable area for Electron */}
      <div className="drag-region flex-1 cursor-move" />
      
      {/* Optional: Add any header actions here if needed */}
      <div className="no-drag">
        {/* Future header actions can go here */}
      </div>
    </div>
  );
}
