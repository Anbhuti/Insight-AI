import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Conversation } from '../../types/chat';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { VisualizationCard } from './VisualizationCard';
import { SQLQueryCard } from './SQLQueryCard';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Hash,
  Download,
  Menu,
  ChevronRight,
  RefreshCw,
  Database,
  Code,
} from 'lucide-react';

interface AnalystChatViewProps {
  dataset: Dataset | null;
  profile: DatasetProfile | null;
  conversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onRegenerateLast: () => void;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
  onOpenMobileSidebar: () => void;
  onOpenDatasetSelector: () => void;
  starterPrompts: string[];
  externalInputText?: string;
  onClearExternalInput?: () => void;
}

export const AnalystChatView: React.FC<AnalystChatViewProps> = ({
  dataset,
  profile,
  conversation,
  messages,
  isLoading,
  onSendMessage,
  onRegenerateLast,
  onFeedback,
  onOpenMobileSidebar,
  onOpenDatasetSelector,
  starterPrompts,
  externalInputText,
  onClearExternalInput,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [thinkingPhase, setThinkingPhase] = useState('Analyzing dataset context...');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external column tags
  useEffect(() => {
    if (externalInputText) {
      setInputText((prev) => {
        const separator = prev.endsWith(' ') || prev.length === 0 ? '' : ' ';
        return `${prev}${separator}@${externalInputText} `;
      });
      if (onClearExternalInput) onClearExternalInput();
      textareaRef.current?.focus();
    }
  }, [externalInputText, onClearExternalInput]);

  // Dynamic thinking status animation
  useEffect(() => {
    if (!isLoading) return;
    const phases = [
      'Scanning dataset statistical profile...',
      'Computing correlations and distributions...',
      'Evaluating data quality & outlier impact...',
      'Synthesizing strategic business recommendations...',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setThinkingPhase(phases[idx]);
    }, 2200);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading || !dataset) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const transcript = messages
      .map(
        (m) =>
          `[${m.role.toUpperCase()} - ${new Date(m.timestamp).toLocaleTimeString()}]\n${m.content}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InsightAI_${dataset?.name || 'Analysis'}_Chat.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 min-w-0 relative">
      {/* Top Chat Bar */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200/90 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Open Context Panel"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Bot className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 truncate">
                {conversation?.title || 'AI Data Analyst'}
              </h2>
              {dataset && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {dataset.name}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Grounded in profiled facts & statistics</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={handleExportChat}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Export conversation as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {!dataset ? (
          <div className="max-w-md mx-auto text-center py-16 px-4">
            <div className="w-14 h-14 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-xs">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Select a Dataset to Start</h3>
            <p className="text-xs text-slate-500 mt-2 mb-6">
              Connect the AI Data Analyst to any of your uploaded datasets to investigate metrics,
              diagnose issues, and uncover strategic opportunities.
            </p>
            <button
              onClick={onOpenDatasetSelector}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <span>Choose Dataset</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State with Dynamic Starter Prompts */
          <div className="max-w-2xl mx-auto py-8 px-2 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Ready to analyze <span className="text-indigo-600">{dataset.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Ask questions about trends, anomalies, distributions, missing values, or request
                actionable recommendations.
              </p>

              {/* Dataset Quick Stats Pills */}
              <div className="flex items-center justify-center gap-2.5 flex-wrap mt-4 pt-4 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                  {dataset.rowCount?.toLocaleString()} Records
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                  {dataset.columnCount} Columns
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Quality Score: {dataset.qualityScore || 85}/100
                </span>
              </div>
            </div>

            {/* Suggested Starter Prompts */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                Suggested Inquiries:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(prompt)}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/40 text-left text-xs font-medium text-slate-700 hover:text-indigo-900 transition-all shadow-2xs cursor-pointer flex items-start gap-2.5 group"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="line-clamp-2">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Render Active Message Thread */
          messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 max-w-4xl mx-auto ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`flex flex-col min-w-0 max-w-[88%] sm:max-w-[80%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white shadow-xs rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 shadow-2xs rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-3 prose prose-xs sm:prose-sm max-w-none text-slate-800 prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-indigo-600 prose-table:border-collapse prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-slate-200">
                        <div className="markdown-body">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {/* SQL Execution Card with View SQL & Query Results Grid */}
                        {msg.sqlQuery && (
                          <div className="not-prose">
                            <SQLQueryCard
                              sql={msg.sqlQuery}
                              columns={msg.sqlColumns}
                              rows={msg.sqlRows}
                              rowCount={msg.sqlRowCount}
                              executionTimeMs={msg.sqlExecutionTimeMs}
                              methodology={msg.sqlMethodology}
                              columnsUsed={msg.sqlColumnsUsed}
                              dataQualityNotes={msg.sqlDataQualityNotes}
                              repairAttempts={msg.sqlRepairAttempts}
                              datasetName={dataset?.name}
                            />
                          </div>
                        )}

                        {/* Optional Chart Visualization */}
                        {msg.visualization && (
                          <div className="not-prose">
                            <VisualizationCard
                              visualization={msg.visualization}
                              profile={profile}
                            />
                          </div>
                        )}

                        {/* Error state if failed */}
                        {msg.status === 'error' && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{msg.errorMessage || 'Failed to complete analysis.'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Action Toolbar (for AI messages) */}
                  {!isUser && (
                    <div className="mt-2 flex items-center gap-1.5 text-slate-400 pl-1">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                        title="Copy analysis text"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onFeedback(msg.id, 'like')}
                        className={`p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer ${
                          msg.feedback === 'like'
                            ? 'text-emerald-600 font-bold bg-emerald-50'
                            : 'hover:text-slate-700'
                        }`}
                        title="Helpful insight"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onFeedback(msg.id, 'dislike')}
                        className={`p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer ${
                          msg.feedback === 'dislike'
                            ? 'text-rose-600 font-bold bg-rose-50'
                            : 'hover:text-slate-700'
                        }`}
                        title="Needs improvement"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-[10px] text-slate-300 ml-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Follow-up Question Chips */}
                  {!isUser &&
                    msg.suggestedFollowUps &&
                    msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-3 space-y-1.5 pl-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Suggested Deep Dives:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => onSendMessage(suggestion)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-[11px] font-medium text-slate-700 hover:text-indigo-800 transition-all shadow-2xs cursor-pointer text-left"
                            >
                              💡 {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0 mt-1">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Real-time thinking animation */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 max-w-4xl mx-auto items-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-indigo-100 shadow-2xs text-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{thinkingPhase}</span>
              </div>
              <div className="h-1.5 w-48 bg-indigo-50 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Footer */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent focus-within:bg-white transition-all shadow-2xs">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!dataset || isLoading}
              placeholder={
                dataset
                  ? `Ask InsightAI about ${dataset.name} (e.g. "What explains revenue variance across regions?")...`
                  : 'Select a dataset above to start querying...'
              }
              rows={2}
              className="w-full bg-transparent resize-none border-none p-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading || !dataset}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {/* Helper caption */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {dataset && (
              <span className="hidden sm:inline">
                Click column tags in sidebar to reference schema fields
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
