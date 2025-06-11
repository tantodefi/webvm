import { create } from 'zustand';
import Anthropic from '@anthropic-ai/sdk';

interface AnthropicMessage {
  role: 'user' | 'assistant' | 'error';
  content: string | any[];
  timestamp: number;
}

interface AnthropicStore {
  apiKey: string | null;
  apiState: 'KEY_REQUIRED' | 'READY' | 'LOADING';
  messages: AnthropicMessage[];
  currentMessage: string;
  isLoading: boolean;
  enableThinking: boolean;
  client: Anthropic | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  addMessage: (text: string, handleTool?: (tool: any) => Promise<any>) => Promise<void>;
  clearMessageHistory: () => void;
  setCurrentMessage: (message: string) => void;
  toggleThinking: () => void;
  forceStop: () => void;
}

let stopFlag = false;

export const useAnthropicStore = create<AnthropicStore>((set, get) => ({
  apiKey: null,
  apiState: 'KEY_REQUIRED',
  messages: [],
  currentMessage: '',
  isLoading: false,
  enableThinking: false,
  client: null,

  setApiKey: (key: string) => {
    const client = new Anthropic({ 
      apiKey: key,
      // @ts-ignore - dangerouslyAllowBrowser is required for browser usage
      dangerouslyAllowBrowser: true 
    });
    
    localStorage.setItem('anthropic-api-key', key);
    
    set({ 
      apiKey: key,
      client,
      apiState: 'READY',
      messages: []
    });
  },

  clearApiKey: () => {
    localStorage.removeItem('anthropic-api-key');
    set({
      apiKey: null,
      client: null,
      apiState: 'KEY_REQUIRED',
      messages: []
    });
  },

  addMessage: async (text: string, handleTool?: (tool: any) => Promise<any>) => {
    const { client, messages, enableThinking } = get();
    
    if (!client) return;

    const userMessage: AnthropicMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    // Add user message
    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      currentMessage: ''
    }));

    try {
      stopFlag = false;
      const updatedMessages = [...messages, userMessage];
      
      // Convert messages to Anthropic format
      const anthropicMessages = updatedMessages
        .filter(msg => msg.role !== 'error')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: typeof msg.content === 'string' ? msg.content : msg.content
        }));

      const config: any = {
        max_tokens: 2048,
        messages: anthropicMessages,
        system: "You are an AI assistant helping users with WebVM, a Linux virtual machine running in the browser. Be helpful and concise.",
        model: 'claude-3-5-sonnet-20241022'
      };

      if (enableThinking) {
        config.thinking = { type: "enabled", budget_tokens: 1024 };
      }

      const response = await client.messages.create(config);

      if (stopFlag) {
        set({ isLoading: false });
        return;
      }

      // Add assistant response
      const assistantMessage: AnthropicMessage = {
        role: 'assistant',
        content: response.content[0].type === 'text' ? response.content[0].text : response.content,
        timestamp: Date.now()
      };

      set(state => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false
      }));

    } catch (error: any) {
      console.error('Anthropic API error:', error);
      
      let errorMessage = 'An error occurred while communicating with Claude.';
      
      if (error.status === 401) {
        errorMessage = 'Invalid API key. Please check your Claude API key.';
        get().clearApiKey();
      } else if (error.error?.error?.message) {
        errorMessage = error.error.error.message;
      }

      const errorMsg: AnthropicMessage = {
        role: 'error',
        content: errorMessage,
        timestamp: Date.now()
      };

      set(state => ({
        messages: [...state.messages, errorMsg],
        isLoading: false
      }));
    }
  },

  clearMessageHistory: () => {
    set({ messages: [] });
  },

  setCurrentMessage: (message: string) => {
    set({ currentMessage: message });
  },

  toggleThinking: () => {
    set(state => ({ enableThinking: !state.enableThinking }));
  },

  forceStop: () => {
    stopFlag = true;
    set({ isLoading: false });
  }
}));

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const savedApiKey = localStorage.getItem('anthropic-api-key');
  if (savedApiKey) {
    useAnthropicStore.getState().setApiKey(savedApiKey);
  }
}

export function getMessageDetails(msg: AnthropicMessage) {
  let icon = "";
  let messageContent = "";
  
  if (msg.role === 'error') {
    icon = "fa-exclamation-triangle";
    messageContent = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
  } else if (msg.role === 'assistant') {
    icon = "fa-robot";
    messageContent = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
  } else {
    icon = "fa-user";
    messageContent = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
  }

  return {
    icon,
    messageContent,
    isToolUse: false,
    isToolResult: false,
    isThinking: false
  };
} 