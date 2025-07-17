import { WrapletManager } from "./types/WrapletManager";
import DefaultWrapletManager from "./DefaultWrapletManager";

let globalWrapletManager: WrapletManager | null = null;

export function getGlobalWrapletManager(): WrapletManager {
  if (!globalWrapletManager) {
    globalWrapletManager = new DefaultWrapletManager();
  }
  return globalWrapletManager;
}
