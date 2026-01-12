"use client";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";

export function PublishNewUnit() {
  return (
    <Button className="bg-[#A6C94A] hover:bg-[#8eb13d] text-black font-semibold">
      <Plus className="mr-2 h-4 w-4" /> Publicar Unidad
    </Button>
  );
}
