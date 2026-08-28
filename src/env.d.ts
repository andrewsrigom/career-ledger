/// <reference types="astro/client" />

interface Window {
  __careerArchitecture?: {
    setProgress(progress: number): void;
    setActiveLayer(index: number): void;
    destroy(): void;
  };
}
