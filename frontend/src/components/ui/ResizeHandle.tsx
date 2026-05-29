import * as Resizable from "react-resizable-panels";
const { Separator } = Resizable;

interface ResizeHandleProps {
  direction?: "horizontal" | "vertical";
  className?: string;
  id?: string;
}

export function ResizeHandle({ direction = "horizontal", className = "", id }: ResizeHandleProps) {
  return (
    <Separator
      id={id}
      className={`relative flex items-center justify-center bg-transparent transition-all group ${
        direction === "horizontal"
          ? "w-1 hover:w-2 cursor-col-resize h-full mx-1"
          : "h-1 hover:h-2 cursor-row-resize w-full my-1"
      } ${className}`}
    >
      {/* The visible line */}
      <div
        className={`absolute bg-f1-border group-hover:bg-f1-red transition-all duration-300 ${
          direction === "horizontal"
            ? "w-[1px] group-hover:w-[2px] h-[80%]"
            : "h-[1px] group-hover:h-[2px] w-[80%]"
        }`}
        style={{
          background: "linear-gradient(to bottom, transparent, var(--border-active), transparent)",
        }}
      />

      {/* Handle Grip Indicator */}
      <div
        className={`absolute bg-f1-border group-hover:bg-f1-red transition-all duration-300 rounded-full ${
          direction === "horizontal"
            ? "w-[2px] group-hover:w-[3px] h-[32px]"
            : "h-[2px] group-hover:h-[3px] w-[32px]"
        }`}
        style={direction === "horizontal" ? { boxShadow: "0 0 10px rgba(225, 6, 0, 0.2)" } : {}}
      />

      {/* Subtle background glow on hover */}
      <div
        className={`absolute bg-f1-red/0 group-hover:bg-f1-red/10 transition-all duration-300 ${
          direction === "horizontal" ? "w-full h-full" : "h-full w-full"
        }`}
      />
    </Separator>
  );
}
