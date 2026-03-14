import { UniversalKnowledgeStore } from "@/engine/store";

const globalForStore = global as unknown as { store: UniversalKnowledgeStore };

export const store =
  globalForStore.store || new UniversalKnowledgeStore();

if (process.env.NODE_ENV !== "production") globalForStore.store = store;
