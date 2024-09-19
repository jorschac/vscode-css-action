import { DiagnosticCollection } from "vscode";

declare global {
  interface CachePool {
    [filePath: string]: DiagnosticCollection | undefined;
  }

  interface DiagnosticCachePool {
    cachePool: CachePool;
    /**
     * cached Files
     */
    cachedPaths: Set<string>;
  }

  interface Setter<C, T> {
    (context: C, load: T, key?: string): void;
  }

  interface Getter<C, T> {
    (context: C, key?: string): T | undefined;
  }
}

export {};
