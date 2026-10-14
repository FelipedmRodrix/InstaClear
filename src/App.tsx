import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  loadSavedAccounts,
  saveAccounts,
  loadSavedReport,
  saveReport,
  loadActionHistory,
  saveActionHistory,
  loadReviewSession,
  saveReviewSession,
  clearAllLocalData,
} from './services/storage';
import { exportToCSV, exportToJSON, exportToTxtList } from './services/exportService';
import { InstagramAccount, ImportAuditReport, ActionHistoryEntry, ReviewSession, FilterOptions, ViewMode, ReviewStatus } from './types/instagram';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { FilterToolbar } from './components/FilterToolbar';
import { AccountCard } from './components/AccountCard';
import { AccountTable } from './components/AccountTable';
import { FileImporter } from './components/FileImporter';
import { AssistedReviewModal } from './components/AssistedReviewModal';
import { SafetyLimitDialog } from './components/SafetyLimitDialog';
import { ImportReportModal } from './components/ImportReportModal';
import { ExtensionGuideModal } from './components/ExtensionGuideModal';
import { HistoryModal } from './components/HistoryModal';
import { ClearDataDialog } from './components/ClearDataDialog';
import { ChevronLeft, ChevronRight, UploadCloud, ShieldAlert, Sparkles, Download, Layers } from 'lucide-react';
import { getUserUploadedDataset } from './services/realUserData';
import { normalizeSession } from './utils/safetyLimits';

const ITEMS_PER_PAGE = 20;

export default function App() {
  // Persistence state
  const [accounts, setAccounts] = useState<InstagramAccount[]>(() => {
    const saved = loadSavedAccounts();
    if (saved && saved.length > 0) return saved;
    // Default to the user's parsed Instagram export dataset (408 accounts not following back)
    const { accounts: realAccounts } = getUserUploadedDataset();
    return realAccounts;
  });
  const [report, setReport] = useState<ImportAuditReport | null>(() => {
    const saved = loadSavedReport();
    if (saved) return saved;
    const { report: realReport } = getUserUploadedDataset();
    return realReport;
  });
  const [history, setHistory] = useState<ActionHistoryEntry[]>(() => loadActionHistory());
  const [session, setSession] = useState<ReviewSession>(() => loadReviewSession());

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('instaclean_darkmode_v1');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('instaclean_darkmode_v1', String(isDarkMode));
  }, [isDarkMode]);

  // View state
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'import'>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    onlyNonFollowers: true,
    sortField: 'username',
    sortDirection: 'asc',
  });

  // Modal states
  const [reviewModalAccount, setReviewModalAccount] = useState<InstagramAccount | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Safety limit dialog state
  const [showSafetyLimitDialog, setShowSafetyLimitDialog] = useState<boolean>(false);
  const [pendingUnfollowAccount, setPendingUnfollowAccount] = useState<InstagramAccount | null>(null);

  // Normalize session to reset hourly/daily buckets when they roll over
  const effectiveSession = useMemo(() => normalizeSession(session), [session]);

  useEffect(() => {
    const normalized = normalizeSession(session);
    if (
      normalized.hourBucketStart !== session.hourBucketStart ||
      normalized.dayBucket !== session.dayBucket
    ) {
      setSession(normalized);
    }
  }, [session]);

  // Sync state changes to storage
  useEffect(() => {
    if (accounts.length > 0) {
      saveAccounts(accounts);
    }
  }, [accounts]);

  useEffect(() => {
    if (report) {
      saveReport(report);
    }
  }, [report]);

  useEffect(() => {
    saveActionHistory(history);
  }, [history]);

  useEffect(() => {
    saveReviewSession(session);
  }, [session]);

  // Derived status counts
  const statusCounts = useMemo(() => {
    const counts: Record<ReviewStatus | 'all', number> = {
      all: accounts.length,
      pending: 0,
      in_review: 0,
      completed: 0,
      kept: 0,
      ignored: 0,
      error: 0,
    };
    for (const acc of accounts) {
      counts[acc.status] = (counts[acc.status] || 0) + 1;
    }
    return counts;
  }, [accounts]);

  // Filtered and sorted accounts
  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    // Filter by search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.username.toLowerCase().includes(q) ||
          (a.displayName && a.displayName.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter((a) => a.status === filters.status);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (filters.sortField === 'username') {
        comparison = a.username.localeCompare(b.username);
      } else if (filters.sortField === 'followedAt') {
        const timeA = a.followedAt || 0;
        const timeB = b.followedAt || 0;
        comparison = timeA - timeB;
      } else if (filters.sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return filters.sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [accounts, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAccounts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAccounts, currentPage]);

  // Handle page reset on filter change
  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Selection actions
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Seleciona/desmarca todos os perfis da página atual
  const handleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginatedAccounts.forEach((acc) => next.add(acc.id));
      return next;
    });
  };

  const currentPageCount = paginatedAccounts.length;
  const isPageSelected =
    currentPageCount > 0 && paginatedAccounts.every((acc) => selectedIds.has(acc.id));
  const selectedPageCount = paginatedAccounts.filter((acc) => selectedIds.has(acc.id)).length;

  // Abre em novas guias apenas os selecionados da página atual e já marca como Verificado
  const handleOpenSelectedPageTabs = () => {
    const pageAccounts = paginatedAccounts.filter((acc) => selectedIds.has(acc.id));
    if (pageAccounts.length === 0) return;

    pageAccounts.forEach((acc) => {
      window.open(acc.profileUrl, '_blank', 'noopener,noreferrer');
    });

    const openedIds = new Set(pageAccounts.map((acc) => acc.id));
    const updated = accounts.map((acc) =>
      openedIds.has(acc.id)
        ? {
            ...acc,
            status: 'completed' as ReviewStatus,
            statusUpdatedAt: Date.now(),
            isWhitelisted: false,
          }
        : acc
    );
    setAccounts(updated);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      openedIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleBatchAction = (action: 'keep' | 'ignore' | 'reset_pending' | 'complete') => {
    if (selectedIds.size === 0) return;

    const targetStatus: ReviewStatus =
      action === 'keep' ? 'kept' : action === 'ignore' ? 'ignored' : action === 'complete' ? 'completed' : 'pending';

    const updated = accounts.map((acc) => {
      if (selectedIds.has(acc.id)) {
        return {
          ...acc,
          status: targetStatus,
          statusUpdatedAt: Date.now(),
          isWhitelisted: action === 'keep',
        };
      }
      return acc;
    });

    setAccounts(updated);
    setSelectedIds(new Set());
  };

  // Account status updates with history recording
  const updateAccountStatus = useCallback(
    (accountId: string, newStatus: ReviewStatus, actionDescription: string, isWhitelisted = false) => {
      let previousStatus: ReviewStatus = 'pending';
      let targetUsername = '';

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === accountId) {
            previousStatus = acc.status;
            targetUsername = acc.username;
            return {
              ...acc,
              status: newStatus,
              statusUpdatedAt: Date.now(),
              isWhitelisted,
            };
          }
          return acc;
        })
      );

      // Record history
      const historyEntry: ActionHistoryEntry = {
        id: `${Date.now()}_${accountId}`,
        timestamp: Date.now(),
        username: targetUsername || accountId,
        previousStatus,
        newStatus,
        actionDescription,
      };

      setHistory((prev) => [...prev, historyEntry]);

      // Update session if unfollow confirmed
      if (newStatus === 'completed') {
        setSession((prev) => {
          const normalized = normalizeSession(prev);
          return {
            ...normalized,
            completedThisSession: normalized.completedThisSession + 1,
            unfollowsThisHour: normalized.unfollowsThisHour + 1,
            unfollowsToday: normalized.unfollowsToday + 1,
            lastActionTimestamp: Date.now(),
          };
        });
      }
    },
    []
  );

  // Assisted Review Flow
  const pendingAccountsList = useMemo(() => {
    return accounts.filter((a) => a.status === 'pending');
  }, [accounts]);

  const currentReviewIndex = useMemo(() => {
    if (!reviewModalAccount) return 0;
    const idx = pendingAccountsList.findIndex((a) => a.id === reviewModalAccount.id);
    return idx >= 0 ? idx : 0;
  }, [pendingAccountsList, reviewModalAccount]);

  const handleStartReview = () => {
    if (pendingAccountsList.length > 0) {
      setReviewModalAccount(pendingAccountsList[0]);
      setIsReviewModalOpen(true);
    } else if (accounts.length > 0) {
      setReviewModalAccount(accounts[0]);
      setIsReviewModalOpen(true);
    }
  };

  const handleOpenReviewForAccount = (acc: InstagramAccount) => {
    setReviewModalAccount(acc);
    setIsReviewModalOpen(true);
  };

  const handleConfirmUnfollow = (account: InstagramAccount) => {
    const normalized = normalizeSession(session);
    const hourlyExceeded = normalized.unfollowsThisHour >= normalized.hourlySafetyLimit;
    const dailyExceeded = normalized.unfollowsToday >= normalized.dailySafetyLimit;

    if (hourlyExceeded || dailyExceeded) {
      setPendingUnfollowAccount(account);
      setShowSafetyLimitDialog(true);
      return;
    }

    performUnfollow(account);
  };

  const performUnfollow = (account: InstagramAccount) => {
    updateAccountStatus(
      account.id,
      'completed',
      'Confirmado que deixou de seguir no Instagram'
    );
    advanceToNextReviewAccount();
  };

  const handleConfirmUnfollowWithLimit = () => {
    if (pendingUnfollowAccount) {
      performUnfollow(pendingUnfollowAccount);
      setPendingUnfollowAccount(null);
      setShowSafetyLimitDialog(false);
    }
  };

  const handleKeepFollowing = (account: InstagramAccount) => {
    updateAccountStatus(
      account.id,
      'kept',
      'Marcado para manter seguindo (VIP)',
      true
    );
    advanceToNextReviewAccount();
  };

  const handleSkipReview = () => {
    advanceToNextReviewAccount();
  };

  const handleIgnoreAccount = (account: InstagramAccount) => {
    updateAccountStatus(
      account.id,
      'ignored',
      'Marcado como ignorado na revisão'
    );
    advanceToNextReviewAccount();
  };

  const advanceToNextReviewAccount = () => {
    const nextIdx = currentReviewIndex + 1;
    if (nextIdx < pendingAccountsList.length) {
      setReviewModalAccount(pendingAccountsList[nextIdx]);
    } else {
      setIsReviewModalOpen(false);
    }
  };

  const handlePrevReviewAccount = () => {
    const prevIdx = currentReviewIndex - 1;
    if (prevIdx >= 0 && prevIdx < pendingAccountsList.length) {
      setReviewModalAccount(pendingAccountsList[prevIdx]);
    }
  };

  const handleNextReviewAccount = () => {
    const nextIdx = currentReviewIndex + 1;
    if (nextIdx < pendingAccountsList.length) {
      setReviewModalAccount(pendingAccountsList[nextIdx]);
    }
  };

  // Toggle between 'pending' and 'completed' (Verificado)
  const handleToggleStatus = (account: InstagramAccount) => {
    const newStatus: ReviewStatus = account.status === 'completed' ? 'pending' : 'completed';
    updateAccountStatus(
      account.id,
      newStatus,
      newStatus === 'completed' ? 'Marcado como verificado' : 'Retornado para pendente',
      false
    );
  };

  // Quick toggle keep from card
  const handleQuickToggleKeep = (account: InstagramAccount) => {
    const newStatus: ReviewStatus = account.status === 'kept' ? 'pending' : 'kept';
    updateAccountStatus(
      account.id,
      newStatus,
      newStatus === 'kept' ? 'Marcado para manter seguindo' : 'Retornado para pendente',
      newStatus === 'kept'
    );
  };

  // Undo history entry
  const handleUndo = (entry: ActionHistoryEntry) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.username.toLowerCase() === entry.username.toLowerCase()) {
          return {
            ...acc,
            status: entry.previousStatus,
            statusUpdatedAt: Date.now(),
            isWhitelisted: entry.previousStatus === 'kept',
          };
        }
        return acc;
      })
    );
    setHistory((prev) => prev.filter((h) => h.id !== entry.id));
  };

  // Clear all data
  const handleClearAllData = () => {
    clearAllLocalData();
    setAccounts([]);
    setReport(null);
    setHistory([]);
    setSelectedIds(new Set());
    setCurrentPage(1);
    setCurrentTab('import');
  };

  // Import handler
  const handleImportComplete = (newAccounts: InstagramAccount[], newReport: ImportAuditReport) => {
    const existingMap = new Map<string, InstagramAccount>();
    accounts.forEach((acc) => existingMap.set(acc.id, acc));

    const mergedAccounts = newAccounts.map((newAcc) => {
      const existing = existingMap.get(newAcc.id);
      if (existing) {
        return {
          ...newAcc,
          status: existing.status,
          statusUpdatedAt: existing.statusUpdatedAt,
          isWhitelisted: existing.isWhitelisted,
        };
      }
      return newAcc;
    });

    setAccounts(mergedAccounts);
    setReport(newReport);
    setSelectedIds(new Set());
    setCurrentPage(1);
    setIsReportModalOpen(true);
    setCurrentTab('dashboard');
  };

  const handleClearImport = () => {
    setAccounts([]);
    setReport(null);
    setSelectedIds(new Set());
    setCurrentPage(1);
    setCurrentTab('dashboard');
    clearAllLocalData();
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onExportData={() => setShowExportMenu(!showExportMenu)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onClearData={() => setIsClearDialogOpen(true)}
        hasData={accounts.length > 0}
        pendingCount={statusCounts.pending}
        onStartReview={handleStartReview}
      />

      {/* Export dropdown menu */}
      {showExportMenu && (
        <div className="fixed top-16 right-6 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-2 w-56 animate-in fade-in slide-in-from-top-2">
          <div className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 px-3 py-1.5 uppercase tracking-wider">
            Exportar Resultados
          </div>
          <button
            onClick={() => {
              exportToCSV(accounts);
              setShowExportMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Planilha CSV</span>
          </button>
          <button
            onClick={() => {
              exportToJSON(accounts, report);
              setShowExportMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup Completo JSON</span>
          </button>
          <button
            onClick={() => {
              exportToTxtList(accounts);
              setShowExportMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Lista de Nomes (.txt)</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Dashboard */}
        {currentTab === 'dashboard' && (
          <>
            {accounts.length === 0 ? (
              /* Empty state: invites to import or load sample */
              <div className="py-12">
                <FileImporter
                  onImportComplete={handleImportComplete}
                  hasExistingData={false}
                  onClearComplete={handleClearImport}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Dashboard Stats */}
                <DashboardStats
                  accounts={accounts}
                  report={report}
                  onFilterByStatus={(status) => handleFilterChange({ status })}
                  activeStatusFilter={filters.status}
                />

                {/* Toolbar */}
                <FilterToolbar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  selectedCount={selectedIds.size}
                  currentPageCount={currentPageCount}
                  isPageSelected={isPageSelected}
                  onSelectAllPage={handleSelectAllPage}
                  selectedPageCount={selectedPageCount}
                  onDeselectAll={handleDeselectAll}
                  onOpenSelectedTabs={handleOpenSelectedPageTabs}
                  onBatchAction={handleBatchAction}
                  statusCounts={statusCounts}
                />

                {/* Account list / grid */}
                {filteredAccounts.length === 0 ? (
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center space-y-3">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Nenhum perfil encontrado com os filtros atuais
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Tente alterar os termos de busca ou selecionar outra situação.
                    </p>
                    <button
                      onClick={() => handleFilterChange({ search: '', status: 'all' })}
                      className="px-4 py-2 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 cursor-pointer"
                    >
                      Redefinir filtros
                    </button>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedAccounts.map((account) => (
                        <AccountCard
                          key={account.id}
                          account={account}
                          isSelected={selectedIds.has(account.id)}
                          onToggleSelect={handleToggleSelect}
                          onQuickToggleKeep={handleQuickToggleKeep}
                          onToggleStatus={handleToggleStatus}
                          onOpenInstagramTab={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                        />
                    ))}
                  </div>
                ) : (
                  <AccountTable
                    accounts={paginatedAccounts}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onOpenReview={handleOpenReviewForAccount}
                    onQuickToggleKeep={handleQuickToggleKeep}
                    onToggleStatus={handleToggleStatus}
                    onOpenInstagramTab={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                  />
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Exibindo <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                      <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredAccounts.length)}
                      </span>{' '}
                      de <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">{filteredAccounts.length}</span> contas
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs transition-colors ${
                          currentPage === 1
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="text-xs px-3 font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
                        Página {currentPage} de {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs transition-colors ${
                          currentPage === totalPages
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Tab 2: Import */}
        {currentTab === 'import' && (
          <div className="py-6 space-y-6">
            <FileImporter
              onImportComplete={handleImportComplete}
              hasExistingData={accounts.length > 0}
              onClearComplete={handleClearImport}
            />
          </div>
        )}
      </main>

      {/* Assisted Review Modal */}
      <AssistedReviewModal
        account={reviewModalAccount}
        currentIndex={currentReviewIndex}
        totalPendingCount={pendingAccountsList.length}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onConfirmUnfollow={handleConfirmUnfollow}
        onKeepFollowing={handleKeepFollowing}
        onSkip={handleSkipReview}
        onIgnore={handleIgnoreAccount}
        onPrev={handlePrevReviewAccount}
        onNext={handleNextReviewAccount}
        hasPrev={currentReviewIndex > 0}
        hasNext={currentReviewIndex < pendingAccountsList.length - 1}
        session={effectiveSession}
      />

      {/* Safety Limit Confirmation Dialog */}
      <SafetyLimitDialog
        isOpen={showSafetyLimitDialog}
        onClose={() => {
          setShowSafetyLimitDialog(false);
          setPendingUnfollowAccount(null);
        }}
        onConfirm={handleConfirmUnfollowWithLimit}
        account={pendingUnfollowAccount}
        session={effectiveSession}
      />

      {/* Import Audit Report Modal */}
      <ImportReportModal
        report={report}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onProceedToReview={() => {
          setIsReportModalOpen(false);
          handleStartReview();
        }}
      />

      {/* Action History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onUndo={handleUndo}
        onClearHistory={() => setHistory([])}
      />

      {/* Clear Data Dialog */}
      <ClearDataDialog
        isOpen={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={handleClearAllData}
      />
    </div>
  );
}
