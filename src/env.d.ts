/// <reference types="astro/client" />

interface Window {
  __careerArchitecture?: {
    setProgress(progress: number): void;
    destroy(): void;
  };
}
