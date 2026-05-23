import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, MessageSquare, Send, Bot, User, FileText, Loader2, RefreshCw, Sun, Moon } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [isIndexed, setIsIndexed] = useState(false); 
  
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! Upload a PDF document on the left, and I will help you analyze its text, structural layouts, and embedded images instantly.' }
  ]);
  const [input, setInput] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  
  const [darkMode, setDarkMode] = useState(true);

  const [sidebarWidth, setSidebarWidth] = useState(450); 
  const [isResizing, setIsResizing] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingAnswer]);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (!isResizing) return;
    
    const newWidth = Math.max(320, Math.min(e.clientX, window.innerWidth - 350));
    setSidebarWidth(newWidth);
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setIsIndexed(false);
      setUploadStatus({ type: '', message: '' });
      
      const localUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(localUrl);
    } else if (selectedFile) {
      setUploadStatus({ type: 'error', message: 'Invalid file type. Please select a genuine .PDF document.' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        setUploadStatus({ type: 'success', message: data.message });
        setIsIndexed(true); 
        setMessages(prev => [...prev, { role: 'assistant', text: `📁 "${file.name}" has been processed and indexed successfully! You can now ask me anything about it.` }]);
      } else {
        setUploadStatus({ type: 'error', message: data.detail || 'Failed to parse file.' });
      }
    } catch (err) {
      setUploadStatus({ type: 'error', message: 'Could not connect to FastAPI server.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loadingAnswer) return;

    const userQuery = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setInput('');
    setLoadingAnswer(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ Error: ${data.detail || 'Failed to retrieve response.'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Connection lost.' }]);
    } finally {
      setLoadingAnswer(false);
    }
  };

  return (
    <div className={`flex h-screen w-screen bg-brand-bg text-brand-textMain font-sans overflow-hidden transition-colors duration-300 ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      
      <div 
        style={{ width: `${sidebarWidth}px` }}
        className="shrink-0 bg-brand-bg flex flex-col justify-between transition-colors duration-300 border-r border-brand-border"
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-card/20 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-brand-accent/10 rounded-xl border border-brand-accent/20 shrink-0">
                <Bot className="w-5 h-5 text-brand-accent" />
              </div>
              <div className="truncate">
                <h1 className="font-bold text-base tracking-tight bg-gradient-to-r from-brand-textMain to-brand-textMuted bg-clip-text text-transparent truncate">
                  DocuSense AI
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isIndexed && (
                <button
                  onClick={() => setIsIndexed(false)}
                  className="p-2 rounded-xl border border-brand-border bg-brand-card text-xs font-semibold hover:bg-brand-bg text-brand-textMuted hover:text-brand-accent transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" /> Change PDF
                </button>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl border border-brand-border bg-brand-card hover:bg-brand-bg/50 transition cursor-pointer text-brand-textMuted hover:text-brand-accent shadow-sm shrink-0"
                title={darkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 min-h-0 flex flex-col justify-center">
            {!isIndexed ? (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl transition-colors duration-300 max-w-md mx-auto w-full">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-brand-textMain">
                  <FileText className="w-4 h-4 text-brand-accent" /> Document Portal
                </h2>
                
                <div className="border-2 border-dashed border-brand-border hover:border-brand-accent/50 rounded-xl p-8 text-center cursor-pointer transition relative group bg-brand-bg/30">
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="w-8 h-8 text-brand-textMuted mx-auto mb-3 group-hover:text-brand-accent transition group-hover:scale-110 duration-200" />
                  <p className="text-xs font-medium text-brand-textMain break-all">
                    {file ? file.name : "Drag & drop file or click to browse"}
                  </p>
                  <p className="text-[10px] text-brand-textMuted mt-1">Accepts document format standard .PDF</p>
                </div>

                {file && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full mt-4 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-brand-accent/10 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Document Text Vectors...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" /> Initialize Document Analysis
                      </>
                    )}
                  </button>
                )}

                {uploadStatus.message && (
                  <div className={`mt-4 p-3 rounded-xl text-xs font-medium border ${
                    uploadStatus.type === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}>
                    {uploadStatus.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full rounded-xl overflow-hidden border border-brand-border bg-brand-card shadow-inner">
                <div className="bg-brand-card px-4 py-3 border-b border-brand-border flex items-center justify-between text-xs font-medium text-brand-textMuted shrink-0">
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div className="flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-1 rounded-md font-bold text-[10px] tracking-wider shrink-0 shadow-sm">
                      PDF
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="truncate text-brand-textMain font-semibold text-sm">{file?.name}</span>
                      <span className="text-[10px] text-brand-textMuted mt-0.5">Size: {(file?.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <span className="shrink-0 bg-brand-accent/10 text-brand-accent px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-brand-accent/20">
                    Live Viewer
                  </span>
                </div>
                
                {previewUrl ? (
                  <iframe
                    src={`${previewUrl}#toolbar=1&navpanes=0&view=FitH`}
                    className="w-full h-full border-none bg-slate-100 dark:bg-slate-900"
                    title="PDF Document Preview Stream"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-xs text-brand-textMuted p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-accent mb-2" />
                    Rendering Document Preview Matrix...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-[11px] text-brand-textMuted border-t border-brand-border p-4 flex justify-between items-center bg-brand-card/10 shrink-0">
          <span>Vector Pipeline Engine</span>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-500 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Port 8000
          </span>
        </div>
      </div>

      <div 
        onMouseDown={startResizing}
        className={`w-1.5 h-full hover:bg-brand-accent/50 active:bg-brand-accent transition-colors duration-200 cursor-col-resize flex-shrink-0 border-l border-r border-brand-border bg-brand-card/40 ${isResizing ? 'bg-brand-accent' : ''}`}
      />

      <div className="flex-1 bg-brand-bg/20 flex flex-col h-full relative overflow-hidden">
        <div className="h-16 border-b border-brand-border px-6 flex items-center justify-between backdrop-blur-md transition-colors duration-300 bg-brand-card/5 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-accent" />
            <span className="text-sm font-semibold">Interactive Query Terminal</span>
          </div>
          {file && isIndexed && (
            <div className="text-xs bg-brand-card border border-brand-border px-3 py-1 rounded-full text-brand-textMuted flex items-center gap-1.5 shadow-sm max-w-[250px] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span> Core Indexed
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role !== 'user' && (
                <div className="p-2 bg-brand-accent/10 border border-brand-accent/20 rounded-xl shrink-0">
                  <Bot className="w-4 h-4 text-brand-accent" />
                </div>
              )}
              
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                msg.role === 'user' 
                  ? 'bg-brand-accent border-brand-accent text-white shadow-lg shadow-brand-accent/10 font-medium' 
                  : 'bg-brand-card border-brand-border text-brand-textMain shadow-md'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {msg.role === 'user' && (
                <div className="p-2 bg-brand-card border border-brand-border rounded-xl shrink-0">
                  <User className="w-4 h-4 text-brand-textMuted" />
                </div>
              )}
            </div>
          ))}

          {loadingAnswer && (
            <div className="flex items-start gap-4">
              <div className="p-2 bg-brand-accent/10 border border-brand-accent/20 rounded-xl shrink-0">
                <Bot className="w-4 h-4 text-brand-accent" />
              </div>
              <div className="bg-brand-card border border-brand-border rounded-2xl px-5 py-3.5 text-sm flex items-center gap-3 shadow-md text-brand-textMuted">
                <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
                <span>Analyzing vectors & scanning layout details...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-brand-border backdrop-blur-md shrink-0">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3 relative items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={file ? "Ask a question about this document layout..." : "Please upload a PDF file on the left to start chatting..."}
              disabled={!file || loadingAnswer}
              className="flex-1 bg-brand-card border border-brand-border focus:border-brand-accent/60 rounded-xl py-3 pl-4 pr-12 text-sm text-brand-textMain placeholder-brand-textMuted focus:outline-none disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || !file || loadingAnswer}
              className="absolute right-2 p-2 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}