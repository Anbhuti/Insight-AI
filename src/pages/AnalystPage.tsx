import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dataset } from '../types/dataset';
import { DatasetProfile } from '../types/dataProfile';
import { ChatMessage, Conversation } from '../types/chat';
import { getDatasets } from '../services/datasetService';
import { getDatasetProfile, profileDataset } from '../services/profilingService';
import {
  buildDatasetContext,
  getDatasetStarterPrompts,
  askAnalyst,
  createConversation,
  getConversations,
  getConversationMessages,
  saveMessage,
  updateMessageFeedback,
  deleteConversation,
} from '../services/aiAnalystService';
import { runSQLAgent } from '../services/sqlAgentService';
import { DatasetContextSidebar } from '../components/analyst/DatasetContextSidebar';
import { AnalystChatView } from '../components/analyst/AnalystChatView';
import { DatasetSelectorModal } from '../components/analyst/DatasetSelectorModal';
import { SampleDataModal } from '../components/analyst/SampleDataModal';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface AnalystPageProps {
  initialDatasetId?: string;
  initialPrompt?: string;
  onNavigateToDatasets?: () => void;
}

export const AnalystPage: React.FC<AnalystPageProps> = ({
  initialDatasetId,
  initialPrompt,
  onNavigateToDatasets,
}) => {
  const { user } = useAuth();

  // Core State
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [datasetProfile, setDatasetProfile] = useState<DatasetProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasProcessedInitialPrompt, setHasProcessedInitialPrompt] = useState(false);

  // UI State
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [externalTagToInsert, setExternalTagToInsert] = useState<string>('');
  const [profilingProgress, setProfilingProgress] = useState<number | null>(null);

  // 1. Load User Datasets
  const fetchDatasets = useCallback(async () => {
    if (!user) return;
    setLoadingDatasets(true);
    try {
      const list = await getDatasets(user.uid);
      setDatasets(list);

      // Select initial dataset
      if (list.length > 0) {
        const target = initialDatasetId
          ? list.find((d) => d.datasetId === initialDatasetId) || list[0]
          : list[0];
        setSelectedDataset(target);
      }
    } catch (e) {
      console.error('Failed to load datasets for Analyst:', e);
    } finally {
      setLoadingDatasets(false);
    }
  }, [user, initialDatasetId]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  // 2. Load Profile for Selected Dataset
  const loadProfile = useCallback(
    async (dataset: Dataset) => {
      if (!user) return;
      setLoadingProfile(true);
      try {
        const prof = await getDatasetProfile(user.uid, dataset.datasetId);
        setDatasetProfile(prof);
      } catch (e) {
        console.error('Failed to load profile for dataset:', e);
      } finally {
        setLoadingProfile(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (selectedDataset) {
      loadProfile(selectedDataset);
    } else {
      setDatasetProfile(null);
    }
  }, [selectedDataset, loadProfile]);

  // 3. Load or Create Conversations for Selected Dataset
  const loadConversationsForDataset = useCallback(
    async (dataset: Dataset) => {
      if (!user) return;
      try {
        const convList = await getConversations(user.uid, dataset.datasetId);
        setConversations(convList);

        if (convList.length > 0) {
          const first = convList[0];
          setActiveConversation(first);
          const msgs = await getConversationMessages(user.uid, first.id);
          setMessages(msgs);
        } else {
          // Auto create first clean conversation
          const newConv = await createConversation(
            user.uid,
            dataset.datasetId,
            dataset.name,
            `Analysis of ${dataset.name}`
          );
          setConversations([newConv]);
          setActiveConversation(newConv);
          setMessages([]);
        }
      } catch (e) {
        console.error('Failed to load conversations:', e);
      }
    },
    [user]
  );

  useEffect(() => {
    if (selectedDataset) {
      loadConversationsForDataset(selectedDataset);
    }
  }, [selectedDataset, loadConversationsForDataset]);

  // Handle auto-injecting initialPrompt if passed (e.g. from Anomaly Page)
  useEffect(() => {
    if (initialPrompt && !hasProcessedInitialPrompt && selectedDataset && activeConversation && !isGenerating) {
      setHasProcessedInitialPrompt(true);
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, hasProcessedInitialPrompt, selectedDataset, activeConversation, isGenerating]);

  // Handle switching conversation
  const handleSelectConversation = async (conversationId: string) => {
    if (!user) return;
    const found = conversations.find((c) => c.id === conversationId);
    if (!found) return;
    setActiveConversation(found);
    const msgs = await getConversationMessages(user.uid, conversationId);
    setMessages(msgs);
  };

  // Handle creating new conversation
  const handleNewConversation = async () => {
    if (!user || !selectedDataset) return;
    const count = conversations.length + 1;
    const newConv = await createConversation(
      user.uid,
      selectedDataset.datasetId,
      selectedDataset.name,
      `Investigation #${count} - ${selectedDataset.name}`
    );
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv);
    setMessages([]);
  };

  // Handle deleting conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!user) return;
    await deleteConversation(user.uid, conversationId);
    const remaining = conversations.filter((c) => c.id !== conversationId);
    setConversations(remaining);

    if (activeConversation?.id === conversationId) {
      if (remaining.length > 0) {
        handleSelectConversation(remaining[0].id);
      } else if (selectedDataset) {
        handleNewConversation();
      }
    }
  };

  // Handle Sending Chat Message
  const handleSendMessage = async (text: string) => {
    if (!user || !selectedDataset || isGenerating) return;

    let conv = activeConversation;
    if (!conv) {
      conv = await createConversation(
        user.uid,
        selectedDataset.datasetId,
        selectedDataset.name,
        text.substring(0, 30) + '...'
      );
      setConversations([conv]);
      setActiveConversation(conv);
    }

    const userMessageId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      conversationId: conv.id,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      status: 'complete',
    };

    // Update UI immediately with user message
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    await saveMessage(user.uid, conv.id, userMsg);

    setIsGenerating(true);

    try {
      // Build history
      const history = updatedMessages.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

      // Try Real SQL Analytics Agent first for exact calculation & execution
      try {
        const sqlResponse = await runSQLAgent(
          selectedDataset,
          datasetProfile,
          text,
          history
        );

        if (sqlResponse && sqlResponse.status !== 'failed' && sqlResponse.sql) {
          const assistantMessageId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
          const assistantMsg: ChatMessage = {
            id: assistantMessageId,
            conversationId: conv.id,
            role: 'assistant',
            content: sqlResponse.explanation.answer,
            suggestedFollowUps: sqlResponse.explanation.keyPoints || [],
            visualization: sqlResponse.visualization as any,
            timestamp: new Date().toISOString(),
            status: 'complete',
            isSQLQuery: true,
            sqlQuery: sqlResponse.sql,
            sqlColumns: sqlResponse.columns,
            sqlRows: sqlResponse.rows,
            sqlRowCount: sqlResponse.rowCount,
            sqlExecutionTimeMs: sqlResponse.executionTimeMs,
            sqlMethodology: sqlResponse.explanation.methodology,
            sqlColumnsUsed: sqlResponse.explanation.columnsUsed,
            sqlDataQualityNotes: sqlResponse.explanation.dataQualityNotes,
            sqlRepairAttempts: sqlResponse.repairAttempts,
          };

          setMessages((prev) => [...prev, assistantMsg]);
          await saveMessage(user.uid, conv.id, assistantMsg);
          return;
        }
      } catch (sqlError) {
        console.warn('SQL Agent fallback to Profile Analyst:', sqlError);
      }

      // Fallback to Profile/General AI Analyst
      const datasetContext = buildDatasetContext(selectedDataset, datasetProfile);
      const response = await askAnalyst({
        userId: user.uid,
        datasetId: selectedDataset.datasetId,
        conversationId: conv.id,
        message: text,
        history,
        datasetContext,
      });

      const assistantMessageId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const assistantMsg: ChatMessage = {
        id: assistantMessageId,
        conversationId: conv.id,
        role: 'assistant',
        content: response.content,
        suggestedFollowUps: response.suggestedFollowUps,
        visualization: response.visualization,
        timestamp: new Date().toISOString(),
        status: 'complete',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessage(user.uid, conv.id, assistantMsg);
    } catch (error: any) {
      console.error('Failed to get AI analyst response:', error);
      const errMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        conversationId: conv.id,
        role: 'assistant',
        content: `I encountered an issue analyzing your query: ${error.message || 'Unknown network error'}. Please verify server connection and try again.`,
        timestamp: new Date().toISOString(),
        status: 'error',
        errorMessage: error.message,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Regenerate Last Response
  const handleRegenerateLast = () => {
    if (messages.length === 0 || isGenerating) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const actualIdx = messages.length - 1 - lastUserIdx;
    const lastUserPrompt = messages[actualIdx].content;
    handleSendMessage(lastUserPrompt);
  };

  // Handle Feedback
  const handleFeedback = async (messageId: string, feedback: 'like' | 'dislike') => {
    if (!user || !activeConversation) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
    );
    await updateMessageFeedback(user.uid, activeConversation.id, messageId, feedback);
  };

  // Handle 1-click profiling for unprofiled dataset
  const handleProfileDataset = async (dataset: Dataset) => {
    if (!user) return;
    setProfilingProgress(10);
    try {
      const profile = await profileDataset(dataset, (prog) => {
        setProfilingProgress(prog.percentage);
      });
      setSelectedDataset({ ...dataset, status: 'profiled', qualityScore: profile.qualityScore });
      setDatasetProfile(profile);
      fetchDatasets();
    } catch (e) {
      console.error('Failed to profile dataset:', e);
    } finally {
      setProfilingProgress(null);
    }
  };

  const starterPrompts = React.useMemo(() => {
    if (!selectedDataset) return [];
    return getDatasetStarterPrompts(selectedDataset, datasetProfile);
  }, [selectedDataset, datasetProfile]);

  if (loadingDatasets) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading AI Analyst Workspace...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Profiling Progress Overlay if running inline */}
      {profilingProgress !== null && (
        <div className="p-3 bg-indigo-600 text-white text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Profiling {selectedDataset?.name}... {profilingProgress}%</span>
          </div>
          <div className="w-32 bg-indigo-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${profilingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 relative">
        {/* 1. Left Context Sidebar */}
        <DatasetContextSidebar
          dataset={selectedDataset}
          profile={datasetProfile}
          conversations={conversations}
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onOpenDatasetSelector={() => setIsSelectorModalOpen(true)}
          onInsertColumnTag={(col) => setExternalTagToInsert(col)}
          onViewSampleModal={() => setIsSampleModalOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* 2. Main Chat View */}
        <AnalystChatView
          dataset={selectedDataset}
          profile={datasetProfile}
          conversation={activeConversation}
          messages={messages}
          isLoading={isGenerating}
          onSendMessage={handleSendMessage}
          onRegenerateLast={handleRegenerateLast}
          onFeedback={handleFeedback}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenDatasetSelector={() => setIsSelectorModalOpen(true)}
          starterPrompts={starterPrompts}
          externalInputText={externalTagToInsert}
          onClearExternalInput={() => setExternalTagToInsert('')}
        />
      </div>

      {/* Dataset Selector Modal */}
      <DatasetSelectorModal
        isOpen={isSelectorModalOpen}
        onClose={() => setIsSelectorModalOpen(false)}
        datasets={datasets}
        selectedDatasetId={selectedDataset?.datasetId || null}
        onSelectDataset={(d) => setSelectedDataset(d)}
        onProfileDataset={handleProfileDataset}
        onNavigateToUpload={onNavigateToDatasets}
      />

      {/* Sample Data Viewer Modal */}
      <SampleDataModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        dataset={selectedDataset}
        profile={datasetProfile}
      />
    </div>
  );
};
