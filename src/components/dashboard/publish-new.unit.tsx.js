"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePublishModal } from "@/hooks/use-publish-modal";

export function PublishNewUnit() {
  const { setOpen } = usePublishModal();

  return (
    <Button
      onClick={() => setOpen(true)}
      className="bg-[#4caf50] hover:bg-[#4caf50]/90 text-white font-bold"
    >
      <Plus className="mr-2 h-4 w-4" />
      Publicar Nueva Unidad
    </Button>
  );
}
