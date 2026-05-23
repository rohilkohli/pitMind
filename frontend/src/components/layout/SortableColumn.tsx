import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal } from "lucide-react";

interface SortableColumnProps {
  id: string;
  children: React.ReactNode;
}

export function SortableColumn({ id, children }: SortableColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    height: "100%",
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          background: "var(--f1-red)",
          color: "#fff",
          padding: "2px 12px",
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          cursor: "grab",
          opacity: 0,
          transition: "opacity 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        className="group-hover:opacity-100"
      >
        <GripHorizontal size={14} />
      </div>

      {children}
    </div>
  );
}
