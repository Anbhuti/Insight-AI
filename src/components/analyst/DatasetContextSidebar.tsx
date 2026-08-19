import React, { useState } from 'react';
import { Dataset } from '../../types/dataset';
import { DatasetProfile, ColumnProfile } from '../../types/dataProfile';
import { Conversation } from '../../types/chat';
import {
  FileSpreadsheet,
  Layers,
  Search,
  Hash,
  Type as TypeIcon,
  Calendar,
  ToggleLeft,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  Trash2,
  Table as TableIcon,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  Check,
} from 'lucide-react';

interface DatasetContextSidebarProps {
  dataset: Dataset | null;
  profile: DatasetProfile | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onOpenDatasetSelector: () => void;
  onInsertColumnTag?: (columnName: string) => void;
  onViewSampleModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const DatasetContextSidebar: React.FC<DatasetContextSidebarProps> = ({
  dataset,
  profile,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenDatasetSelector,
  onInsertColumnTag,
  onViewSampleModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [columnSearch, setColumnSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'columns' | 'history' | 'issues'>('columns');
  const [copiedCol, setCopiedCol] = useState<string | null>(null);

  const columns = profile?.columns || [];
  const filteredColumns = columns.filter((c) =>
    c.name.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const criticalIssues = profile?.issues || [];

  const handleCopyTag = (colName: string) => {
    if (onInsertColumnTag) {
      onInsertColumnTag(colName);
    }
    setCopiedCol(colName);
    setTimeout(() => setCopiedCol(null), 1500);
  };

  const renderColumnIcon = (type: string) => {
    switch (type) {
      case 'numeric':
      case 'integer':
      case 'decimal':
        return <Hash className="w-3.5 h-3.5 text-blue-600" />;
      case 'date':
      case 'datetime':
        return <Calendar className="w-3.5 h-3.5 text-purple-600" />;
      case 'boolean':
        return <ToggleLeft className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <TypeIcon className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const qualityScore = profile?.qualityScore || dataset?.qualityScore || 85;
  const qualityGrade =
    qualityScore >= 90 ? 'Excellent' : qualityScore >= 75 ? 'Good' : qualityScore >= 60 ? 'Fair' : 'Poor';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`w-80 shrink-0 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 z-40 ${
          isOpenMobile
            ? 'fixed inset-y-0 left-0 shadow-2xl flex'
            : 'hidden lg:flex'
        }`}
      >
        {/* Active Dataset Overview Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Context
            </span>
            <button
              onClick={onOpenDatasetSelector}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Switch Dataset</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {dataset ? (
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    dataset.fileType === 'csv'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-900 truncate" title={dataset.name}>
                    {dataset.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{dataset.rowCount?.toLocaleString() || 0} rows</span>
                    <span>•</span>
                    <span>{dataset.columnCount || 0} cols</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                    <span className="text-slate-400">table:</span>
                    <span className="text-indigo-600 font-semibold truncate">dataset_{dataset.datasetId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}</span>
                  </div>
                </div>
              </div>

              {/* Quality & Sample Stats Badge */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      qualityScore >= 80 ? 'bg-emerald-500' : qualityScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-[11px] font-semibold text-slate-700">
                    Quality: {qualityScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                    SQL Ready
                  </span>
                  <button
                    onClick={onViewSampleModal}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <p className="text-xs font-bold text-amber-800">No Dataset Selected</p>
              <button
                onClick={onOpenDatasetSelector}
                className="mt-2 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
              >
                Choose Dataset
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Nav Tabs */}
        <div className="flex items-center border-b border-slate-100 bg-white px-2 pt-2 gap-1">
          <button
            onClick={() => setActiveTab('columns')}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'columns'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Columns ({columns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chats ({conversations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'issues'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Issues ({criticalIssues.length})</span>
          </button>
        </div>

        {/* Tab 1: Columns Explorer */}
        {activeTab === 'columns' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search schema columns..."
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredColumns.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  {columns.length === 0 ? 'No profile columns loaded' : 'No matching columns'}
                </div>
              ) : (
                filteredColumns.map((col) => (
                  <div
                    key={col.name}
                    onClick={() => handleCopyTag(col.name)}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all cursor-pointer group flex items-center justify-between gap-2"
                    title={`Click to insert @${col.name} into prompt`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                        {renderColumnIcon(col.logicalType)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                          {col.name}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{col.logicalType}</span>
                          <span>•</span>
                          <span className="font-mono text-[9px] uppercase text-indigo-600 bg-indigo-50/80 px-1 py-0.2 rounded font-semibold">
                            {col.logicalType === 'integer' ? 'INTEGER' : col.logicalType === 'decimal' || col.logicalType === 'numeric' ? 'REAL' : col.logicalType === 'boolean' ? 'BOOLEAN' : col.logicalType === 'date' || col.logicalType === 'datetime' ? 'DATE' : 'TEXT'}
                          </span>
                          <span>•</span>
                          <span>{col.missingPercentage}% null</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {copiedCol === col.name ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Tagged
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                          + @mention
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Conversation History */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-100">
              <button
                onClick={onNewConversation}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Conversation</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No past conversations for this dataset.</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group relative flex flex-col gap-1 ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                          : 'bg-white border-slate-200/70 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold truncate">{conv.title}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this conversation history?')) {
                              onDeleteConversation(conv.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer p-1"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {conv.lastMessageSnippet && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {conv.lastMessageSnippet}
                        </p>
                      )}
                      <span className="text-[9px] text-slate-400 mt-1">
                        {new Date(conv.updatedAt).toLocaleDateString()} • {conv.messageCount} messages
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Data Quality Issues */}
        {activeTab === 'issues' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {criticalIssues.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Clean Dataset</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  No critical structural or quality issues detected.
                </p>
              </div>
            ) : (
              criticalIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200/80 text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        issue.severity === 'critical'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : issue.severity === 'high'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">{issue.category.replace('_', ' ')}</span>
                  </div>
                  <h5 className="font-bold text-slate-800">{issue.title}</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{issue.description}</p>
                  <div className="pt-1 text-[10px] text-indigo-600 font-semibold">
                    Tip: {issue.recommendation}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </aside>
    </>
  );
};
