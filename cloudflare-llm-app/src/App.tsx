import { useState, useEffect } from 'react';
import { ModelSelector } from './components/ModelSelector';
import { ChatWindow } from './components/ChatWindow';
import type { Message } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('@cf/meta/llama-3-8b-instruct');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful, respectful, and honest AI assistant. Always answer as clearly and concisely as possible.'
  );
  const [temperature, setTemperature] = useState(0.6);
  const [isLoading, setIsLoading] = useState(false);

  // Load chat session from local storage on mount
  useEffect(() => {
    const storedMessages = localStorage.getItem('cf_chat_messages');
    const storedModel = localStorage.getItem('cf_chat_model');
    const storedSystem = localStorage.getItem('cf_chat_system');
    const storedTemp = localStorage.getItem('cf_chat_temp');

    if (storedMessages) setMessages(JSON.parse(storedMessages));
    if (storedModel) setSelectedModelId(storedModel);
    if (storedSystem) setSystemPrompt(storedSystem);
    if (storedTemp) setTemperature(Number(storedTemp));
  }, []);

  const saveStateToLocalStorage = (
    newMessages: Message[],
    model: string,
    system: string,
    temp: number
  ) => {
    localStorage.setItem('cf_chat_messages', JSON.stringify(newMessages));
    localStorage.setItem('cf_chat_model', model);
    localStorage.setItem('cf_chat_system', system);
    localStorage.setItem('cf_chat_temp', String(temp));
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    saveStateToLocalStorage(updatedMessages, selectedModelId, systemPrompt, temperature);

    try {
      // Pages Function endpoint is served at /api/chat relative to host
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          model: selectedModelId,
          systemPrompt,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: data.response || 'No response returned from the model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveStateToLocalStorage(finalMessages, selectedModelId, systemPrompt, temperature);
    } catch (err: any) {
      console.error('Error calling Cloudflare Pages Function:', err);
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to connect to Workers AI backend. Please verify your wrangler configurations or local dev bindings.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveStateToLocalStorage(finalMessages, selectedModelId, systemPrompt, temperature);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Reset this playground session? History will be cleared.')) {
      setMessages([]);
      localStorage.removeItem('cf_chat_messages');
    }
  };

  const handleSelectModel = (id: string) => {
    setSelectedModelId(id);
    localStorage.setItem('cf_chat_model', id);
  };

  const handleSystemPromptChange = (val: string) => {
    setSystemPrompt(val);
    localStorage.setItem('cf_chat_system', val);
  };

  const handleTempChange = (val: number) => {
    setTemperature(val);
    localStorage.setItem('cf_chat_temp', String(val));
  };

  return (
    <div className="app-container">
      <ModelSelector
        selectedModelId={selectedModelId}
        onSelectModel={handleSelectModel}
        systemPrompt={systemPrompt}
        onChangeSystemPrompt={handleSystemPromptChange}
        temperature={temperature}
        onChangeTemperature={handleTempChange}
      />
      <ChatWindow
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onClearChat={handleClearChat}
      />
    </div>
  );
}

export default App;
