'use client';

import { useState } from 'react';
import { Card, Button } from './DemoComponents';
import { useAnthropicStore, getMessageDetails } from '../utils/anthropic';

export default function AnthropicTab() {
  const {
    apiState,
    messages,
    currentMessage,
    isLoading,
    enableThinking,
    setApiKey,
    clearApiKey,
    addMessage,
    clearMessageHistory,
    setCurrentMessage,
    toggleThinking,
    forceStop
  } = useAnthropicStore();

  const [apiKeyInput, setApiKeyInput] = useState('');

  const handleKeyEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    const value = e.currentTarget.value;
    if (value === '') return;
    setApiKey(value);
    setApiKeyInput('');
  };

  const handleMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const textArea = e.currentTarget;
    const value = textArea.value;
    if (value === '') return;
    
    addMessage(value);
  };

  const handleResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textArea = e.target;
    textArea.style.height = 'auto';
    textArea.style.height = textArea.scrollHeight + 'px';
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--app-foreground)]">Claude AI Integration</h2>
        <p className="text-sm text-[var(--app-foreground-muted)]">
          FarTerm is integrated with Claude by Anthropic AI. You can prompt the AI to help with your terminal tasks.
        </p>
        <p className="text-sm text-[var(--app-foreground-muted)]">
          You need to provide your API key. The key is only saved locally to your browser.
        </p>
      </div>
      
      <Card className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-[var(--app-foreground)]">Conversation History</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleThinking}
              className="text-xs"
            >
              {enableThinking ? '🧠 Thinking On' : '🧠 Thinking Off'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessageHistory}
              className="text-xs"
            >
              🗑️ Clear
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-[var(--app-gray)] rounded-lg p-3">
          {messages.length === 0 ? (
            <div className="text-center text-[var(--app-foreground-muted)] text-sm py-8">
              No messages yet. Start a conversation with Claude!
            </div>
          ) : (
            messages.map((message, index) => {
              const details = getMessageDetails(message);
              return (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-[var(--app-accent)] text-[var(--app-background)]'
                        : message.role === 'error'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-[var(--app-card-bg)] text-[var(--app-foreground)] border border-[var(--app-card-border)]'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <i className={`fas ${details.icon} text-sm mt-0.5 shrink-0`}></i>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {details.messageContent}
                      </p>
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--app-card-bg)] text-[var(--app-foreground)] border border-[var(--app-card-border)] p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                  <div className="text-sm">Claude is thinking...</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-[var(--app-card-border)] pt-4">
          {apiState === 'KEY_REQUIRED' ? (
            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--app-foreground)]">
                Enter your Claude API Key:
              </label>
              <textarea
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={handleKeyEnter}
                onInput={handleResize}
                placeholder="sk-ant-..."
                className="w-full p-3 text-sm bg-[var(--app-gray)] text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] border border-[var(--app-card-border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
                rows={1}
              />
              <p className="text-xs text-[var(--app-foreground-muted)]">
                Press Enter to save your API key. Get your key from{' '}
                <a 
                  href="https://console.anthropic.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--app-accent)] hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          ) : isLoading ? (
            <Button
              onClick={forceStop}
              variant="outline"
              size="sm"
              className="w-full"
            >
              ✋ Stop Generation
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-400">✅ API Key Set</span>
                <Button
                  onClick={clearApiKey}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Change Key
                </Button>
              </div>
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleMessage}
                onInput={handleResize}
                placeholder="Ask Claude about Linux commands, programming, or anything else..."
                className="w-full p-3 text-sm bg-[var(--app-gray)] text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] border border-[var(--app-card-border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />
              <p className="text-xs text-[var(--app-foreground-muted)]">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 