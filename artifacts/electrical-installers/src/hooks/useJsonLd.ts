import { useEffect } from "react";

export function useJsonLd(schema: object | null) {
  useEffect(() => {
    if (!schema) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [JSON.stringify(schema)]);
}
