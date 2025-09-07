import React, { useEffect, useRef, useState } from "react";

interface ScrollContainerProps {
  children: React.ReactNode;
  topOffset?: number; // espaço do topo ocupado por outros elementos (em px)
  bottomOffset?: number; // espaço do rodapé, se houver
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  topOffset = 0,
  bottomOffset = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  // calcula a altura disponível sempre que a tela redimensionar
  const updateHeight = () => {
    const windowHeight = window.innerHeight;
    const availableHeight = windowHeight - topOffset - bottomOffset;
    setHeight(availableHeight);
  };

  useEffect(() => {
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [topOffset, bottomOffset]);

  return (
    <div
      ref={containerRef}
      style={{
        height: `${height}px`,
        overflowY: "auto",
        padding: "8px",
        border: "1px solid #ccc",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
};
