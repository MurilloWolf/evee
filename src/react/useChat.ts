import { useSyncExternalStore } from "react";
import type { ChatSDK } from "../core/createChat";

/** Subscribes a component to the chat state. */
export function useChat(chat: ChatSDK) {
  return useSyncExternalStore(chat.subscribe, chat.getState, chat.getState);
}
