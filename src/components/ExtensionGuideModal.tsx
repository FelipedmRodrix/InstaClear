import React, { useState } from 'react';
import { Download, ShieldCheck, Check, Copy, ExternalLink, Chrome, AlertCircle, FileCode, Monitor } from 'lucide-react';
import { downloadExtensionZip, EXTENSION_FILES } from '../services/extensionPackage';

export const ExtensionGuideModal: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('manifest.json');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadExtensionZip();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(EXTENSION_FILES[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Extensão Opcional do Navegador (Manifest V3)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
              Desenvolvida em conformidade estrita com o padrão <strong>Google Manifest V3</strong>. A extensão serve como auxiliar visual flutuante nas páginas dos perfis no Instagram, sem armazenar senhas, cookies ou disparar automações perigosas.
            </p>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Gerando ZIP...' : 'Baixar Extensão (.zip)'}</span>
          </button>
        </div>

        {/* Security Principles Checklist */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800">
            <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Zero Acesso a Senhas
            </div>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              A extensão nunca solicita, lê ou armazena senhas, tokens de sessão ou cookies confidenciais da sua conta.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800">
            <div className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Confirmação Individual
            </div>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              Cada unfollow é executado manualmente por você no Instagram. Nenhuma requisição em lote é disparada.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800">
            <div className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 100% Código Aberto & Local
            </div>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              Todo o código-fonte está visível abaixo para inspeção antes de você instalar no seu navegador.
            </p>
          </div>
        </div>
      </div>

      {/* Step by step Windows installation */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Monitor className="w-4 h-4 text-rose-600" />
          Como instalar no Windows (Google Chrome, Edge ou Brave)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px]">1</span>
              Baixar e Extrair
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              Clique em <strong>"Baixar Extensão (.zip)"</strong> acima e extraia os arquivos em uma pasta de sua escolha (ex: <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">C:\InstaClean-Extensao</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px]">2</span>
              Página de Extensões
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              Abra seu navegador e acesse na barra de endereços: <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">chrome://extensions</code> ou <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded">edge://extensions</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px]">3</span>
              Modo Desenvolvedor
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              No canto superior direito da página de extensões, ative a chave seletora <strong>"Modo do desenvolvedor"</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px]">4</span>
              Carregar sem Compactação
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              Clique em <strong>"Carregar sem compactação"</strong> e selecione a pasta extraída. A extensão estará instalada!
            </p>
          </div>
        </div>
      </div>

      {/* Source Code Viewer */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-850">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {Object.keys(EXTENSION_FILES).map((fname) => (
              <button
                key={fname}
                onClick={() => setSelectedFile(fname)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  selectedFile === fname
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                {fname}
              </button>
            ))}
          </div>

          <button
            onClick={copyCode}
            className="px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar código'}</span>
          </button>
        </div>

        <div className="p-4 bg-neutral-950 overflow-x-auto max-h-96">
          <pre className="font-mono text-xs text-neutral-200 leading-relaxed selection:bg-rose-500/30">
            <code>{EXTENSION_FILES[selectedFile]}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
