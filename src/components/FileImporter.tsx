import React, { useState, useRef } from 'react';
import {
  Upload,
  FileArchive,
  HelpCircle,
  AlertTriangle,
  FileCode,
  ClipboardPaste,
  CheckCircle2,
  FolderOpen,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { parseInstagramZip, parseIndividualFiles, parseCombinedTextOrHtml, classifyFile } from '../services/zipParser';
import { ImportAuditReport, InstagramAccount } from '../types/instagram';

interface FileImporterProps {
  onImportComplete: (accounts: InstagramAccount[], report: ImportAuditReport) => void;
  hasExistingData: boolean;
  onClearComplete?: () => void;
}

export const FileImporter: React.FC<FileImporterProps> = ({ onImportComplete, hasExistingData, onClearComplete }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'dual'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [pastedContent, setPastedContent] = useState('');

  // Dual file picker state
  const [selectedFollowingFile, setSelectedFollowingFile] = useState<File | null>(null);
  const [selectedFollowersFile, setSelectedFollowersFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFilesInputRef = useRef<HTMLInputElement>(null);
  const followingInputRef = useRef<HTMLInputElement>(null);
  const followersInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    setInfoMsg(null);
    const fileList = Array.from(files);

    if (fileList.length === 0) return;

    // Check if any file is ZIP
    const zipFile = fileList.find((f) => f.name.toLowerCase().endsWith('.zip'));
    if (zipFile) {
      await handleZipFile(zipFile);
      return;
    }

    // Check if user uploaded start_here.html alone
    if (fileList.length === 1 && fileList[0].name.toLowerCase() === 'start_here.html') {
      setErrorMsg(
        'O arquivo "start_here.html" é apenas o índice/sumário do download. Para comparar seus perfis, você precisa dos arquivos "following.html" e "followers_1.html" que estão dentro da pasta "connections/followers_and_following/", ou envie o arquivo .ZIP original completo.'
      );
      return;
    }

    // Check if multiple files or single HTML/JSON file
    setIsLoading(true);
    setProgress({ percent: 20, status: 'Analisando arquivos enviados...' });

    try {
      let followingFile: File | undefined;
      const followersFiles: File[] = [];

      for (const file of fileList) {
        const type = classifyFile(file.name);
        if (type === 'following') {
          followingFile = file;
        } else if (type === 'followers') {
          followersFiles.push(file);
        } else if (fileList.length === 1) {
          // If a single combined file was provided
          const content = await file.text();
          if (content.includes('following') && (content.includes('follower') || content.includes('seguidor'))) {
            const parsed = parseCombinedTextOrHtml(content, file.name);
            if (parsed.accounts.length > 0) {
              onImportComplete(parsed.accounts, parsed.report);
              setIsLoading(false);
              return;
            }
          }
        }
      }

      if (followingFile && followersFiles.length > 0) {
        const result = await parseIndividualFiles(followingFile, followersFiles);
        if (result.accounts.length === 0 && result.report.errors.length > 0) {
          setErrorMsg(result.report.errors.join(' '));
        } else {
          onImportComplete(result.accounts, result.report);
        }
        setIsLoading(false);
        return;
      }

      if (followingFile && followersFiles.length === 0) {
        setErrorMsg(
          `Você enviou o arquivo de contas seguidas (${followingFile.name}), mas falta a lista de seguidores deste perfil (ex: followers_1.html / followers.json). Para comparar e descobrir quem não te segue de volta, envie os dois arquivos juntos ou o arquivo .ZIP completo baixado do Instagram.`
        );
        setIsLoading(false);
        return;
      }

      if (!followingFile && followersFiles.length > 0) {
        setErrorMsg(
          'Você enviou o arquivo de seguidores, mas falta o arquivo de contas seguidas (following.html / following.json). Envie os dois arquivos juntos ou o arquivo .ZIP completo.'
        );
        setIsLoading(false);
        return;
      }

      setErrorMsg(
        'Não localizamos os arquivos "following.html" (contas seguidas) e "followers_1.html" (seguidores). Certifique-se de selecionar esses arquivos ou o arquivo .ZIP completo do Instagram.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar os arquivos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZipFile = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    setProgress({ percent: 10, status: 'Abrindo arquivo .ZIP...' });

    try {
      const result = await parseInstagramZip(file, (percent, status) => {
        setProgress({ percent, status });
      });

      if (result.accounts.length === 0 && result.report.errors.length > 0) {
        setErrorMsg(result.report.errors.join(' '));
      } else {
        onImportComplete(result.accounts, result.report);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao descompactar e processar o arquivo ZIP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPasted = () => {
    if (!pastedContent.trim()) {
      setErrorMsg('Por favor, cole o conteúdo HTML ou JSON da sua exportação no campo abaixo.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = parseCombinedTextOrHtml(pastedContent, 'Conteúdo Colado');
      if (result.accounts.length === 0) {
        setErrorMsg('Nenhuma conta foi identificada no texto colado. Certifique-se de colar o HTML das páginas de seguidores e seguidos.');
      } else {
        onImportComplete(result.accounts, result.report);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao analisar o texto colado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDualCompare = async () => {
    if (!selectedFollowingFile || !selectedFollowersFile) {
      setErrorMsg('Selecione ambos os arquivos (1. quem você segue e 2. seus seguidores) para realizar o cruzamento.');
      return;
    }
    await handleFiles([selectedFollowingFile, selectedFollowersFile]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const clearImport = () => {
    // Reset FileImporter's local state
    setActiveTab('upload');
    setIsDragging(false);
    setIsLoading(false);
    setProgress({ percent: 0, status: '' });
    setErrorMsg(null);
    setInfoMsg(null);
    setPastedContent('');
    setSelectedFollowingFile(null);
    setSelectedFollowersFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (multipleFilesInputRef.current) multipleFilesInputRef.current.value = '';
    if (followingInputRef.current) followingInputRef.current.value = '';
    if (followersInputRef.current) followersInputRef.current.value = '';
    
    // Notify parent App component to clear accounts
    if (onClearComplete) {
      onClearComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl max-w-md mx-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Arquivo .ZIP ou Geral
        </button>
        <button
          onClick={() => setActiveTab('dual')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
            activeTab === 'dual'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Arquivos da Pasta
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
            activeTab === 'paste'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Colar Código HTML
        </button>
      </div>

      {/* Clear button - only shown when there's existing data */}
      {hasExistingData && onClearComplete && (
        <div className="flex justify-center">
          <button
            onClick={clearImport}
            className="px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Importação</span>
          </button>
        </div>
      )}

      {/* Tab 1: Upload (ZIP or Any dropped files) */}
      {activeTab === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white dark:bg-neutral-900 ${
            isDragging
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 scale-[1.01]'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.html,.json"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
          />

          <div className="flex flex-col items-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-purple-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <FileArchive className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Arraste e solte o arquivo ZIP ou arquivos HTML
            </h3>

            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Aceita o arquivo <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs">.zip</code> oficial da Meta ou os arquivos HTML extraídos (<code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs">following.html</code> e <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs">followers_1.html</code>).
            </p>

            {isLoading ? (
              <div className="w-full mt-6 space-y-2">
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-600 h-full transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 animate-pulse">
                  {progress.status || 'Processando exportação...'}
                </p>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Selecionar Arquivo (.ZIP / .HTML)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Dual File Selection (following.html + followers_1.html) */}
      {activeTab === 'dual' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-lg mx-auto">
            <h4 className="text-base font-bold text-neutral-900 dark:text-white">
              Selecionar arquivos individuais da pasta descompactada
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Se você já extraiu o ZIP no computador, selecione os dois arquivos da pasta <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-[11px]">connections/followers_and_following/</code>:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Following File Card */}
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] flex items-center justify-center">1</span>
                  Contas que Você Segue
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Arquivo: <code className="font-mono text-neutral-700 dark:text-neutral-300 font-semibold">following.html</code> ou <code className="font-mono">following.json</code>
                </p>
              </div>

              <input
                ref={followingInputRef}
                type="file"
                accept=".html,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFollowingFile(e.target.files[0]);
                  }
                }}
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs truncate text-neutral-600 dark:text-neutral-400 font-mono">
                  {selectedFollowingFile ? selectedFollowingFile.name : 'Nenhum arquivo selecionado'}
                </span>
                <button
                  onClick={() => followingInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold rounded-lg hover:border-rose-400 cursor-pointer shrink-0"
                >
                  {selectedFollowingFile ? 'Alterar' : 'Escolher'}
                </button>
              </div>
            </div>

            {/* Followers File Card */}
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] flex items-center justify-center">2</span>
                  Seus Seguidores
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Arquivo: <code className="font-mono text-neutral-700 dark:text-neutral-300 font-semibold">followers_1.html</code> ou <code className="font-mono">followers_1.json</code>
                </p>
              </div>

              <input
                ref={followersInputRef}
                type="file"
                accept=".html,.json"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFollowersFile(e.target.files[0]);
                  }
                }}
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs truncate text-neutral-600 dark:text-neutral-400 font-mono">
                  {selectedFollowersFile ? selectedFollowersFile.name : 'Nenhum arquivo selecionado'}
                </span>
                <button
                  onClick={() => followersInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold rounded-lg hover:border-rose-400 cursor-pointer shrink-0"
                >
                  {selectedFollowersFile ? 'Alterar' : 'Escolher'}
                </button>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleDualCompare}
              disabled={isLoading || !selectedFollowingFile || !selectedFollowersFile}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? 'Processando...' : 'Comparar Listas e Encontrar Quem Não Te Segue'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Paste Code */}
      {activeTab === 'paste' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-white">
              Colar Código HTML ou JSON Diretamente
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Abra os arquivos <code className="font-mono">following.html</code> e/ou <code className="font-mono">followers_1.html</code> no bloco de notas, copie o texto e cole abaixo:
            </p>
          </div>

          <textarea
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            placeholder="Cole aqui o conteúdo do following.html ou followers_1.html..."
            rows={8}
            className="w-full p-4 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-2xl font-mono text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={() => setPastedContent('')}
              className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              Limpar campo
            </button>
            <button
              onClick={handleProcessPasted}
              disabled={isLoading || !pastedContent.trim()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Processar Texto Colado
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {infoMsg && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{infoMsg}</div>
        </div>
      )}

      {/* Guide: How to download Instagram ZIP */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
        <button
          onClick={() => setShowHowTo(!showHowTo)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Onde encontrar os arquivos de seguidores e seguidos no download do Instagram
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Guia de pastas do arquivo ZIP oficial
              </p>
            </div>
          </div>
          <span className="text-xs text-rose-600 font-medium">
            {showHowTo ? 'Ocultar instruções' : 'Ver estrutura de pastas'}
          </span>
        </button>

        {showHowTo && (
          <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4 text-xs">
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Ao abrir o arquivo compactado do Instagram ou descompactá-lo no seu computador, os arquivos que contêm seus perfis ficam nesta pasta:
            </p>

            <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
              <div className="font-bold text-neutral-900 dark:text-white">📁 connections/</div>
              <div className="pl-4">└── 📁 followers_and_following/</div>
              <div className="pl-8 text-rose-600 dark:text-rose-400 font-bold">├── following.html  (quem você segue)</div>
              <div className="pl-8 text-emerald-600 dark:text-emerald-400 font-bold">├── followers_1.html  (seus seguidores)</div>
              <div className="pl-8 text-neutral-400">├── following_hashtags.html</div>
              <div className="pl-8 text-neutral-400">└── blocked_profiles.html</div>
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
              💡 <strong>Dica:</strong> Você pode arrastar diretamente o arquivo <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-semibold text-neutral-800 dark:text-neutral-200">.zip</code> inteiro (sem descompactar), ou se preferir descompactar, arraste os dois arquivos <code className="font-semibold">following.html</code> e <code className="font-semibold">followers_1.html</code> juntos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
