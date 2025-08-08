"use client";

import * as Toast from "@radix-ui/react-toast";
import { useEffect, useState } from "react";

type ToastProps = {
  title?: string;
  description: string;
  type?: "success" | "error" | "info";
  duration?: number;
};

let toastCount = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([]);

  const addToast = ({
    title,
    description,
    type = "info",
    duration = 5000,
  }: ToastProps) => {
    const id = toastCount++;
    setToasts((prev) => [...prev, { id, title, description, type, duration }]);
    
    // Auto remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return { toasts, addToast };
}

export default function Toasts({ toasts }: { toasts: Array<ToastProps & { id: number }> }) {
  return (
    <Toast.Provider>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          className={`
            fixed bottom-4 right-4 p-4 rounded shadow-lg
            ${
              toast.type === "error"
                ? "bg-red-500/20 text-red-200"
                : toast.type === "success"
                ? "bg-green-500/20 text-green-200"
                : "bg-neutral-800 text-white"
            }
          `}
          duration={toast.duration}
        >
          {toast.title && (
            <Toast.Title className="text-sm font-medium mb-1">
              {toast.title}
            </Toast.Title>
          )}
          <Toast.Description className="text-sm">
            {toast.description}
          </Toast.Description>
        </Toast.Root>
      ))}
      <Toast.Viewport />
    </Toast.Provider>
  );
}
