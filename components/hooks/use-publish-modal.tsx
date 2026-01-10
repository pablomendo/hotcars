"use client";

import { createContext, useContext, useState } from "react";

type PublishModalContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const PublishModalContext =
  createContext<PublishModalContextType | undefined>(undefined);

export function PublishUnitModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <PublishModalContext.Provider value={{ open, setOpen }}>
      {children}
    </PublishModalContext.Provider>
  );
}

export function usePublishModal() {
  const context = useContext(PublishModalContext);

  if (!context) {
    throw new Error(
      "usePublishModal must be used within PublishUnitModalProvider"
    );
  }

  return context;
}
