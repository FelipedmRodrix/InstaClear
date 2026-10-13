import JSZip from 'jszip';

export interface ExtensionFile {
  filename: string;
  content: string;
}

export const EXTENSION_FILES: Record<string, string> = {
  'manifest.json': JSON.stringify(
    {
      manifest_version: 3,
      name: 'InstaClean Companion - Auxiliar de Revisão',
      version: '1.0.0',
      description: 'Extensão auxiliar segura e opcional para auxiliar a visualização de perfis e revisão assistida no Instagram.',
      permissions: ['activeTab'],
      host_permissions: ['https://*.instagram.com/*'],
      action: {
        default_popup: 'popup.html',
        default_title: 'InstaClean Companion',
      },
      content_scripts: [
        {
          matches: ['https://*.instagram.com/*'],
          js: ['content.js'],
          run_at: 'document_idle',
        },
      ],
    },
    null,
    2
  ),

  'content.js': `// InstaClean Companion Content Script
// ATENÇÃO: Esta extensão é 100% segura. Ela NÃO captura senhas, NÃO manipula cookies,
// NÃO executa cliques automáticos e NÃO envia requisições a APIs privadas.

(function () {
  if (window.__instacleanInjected) return;
  window.__instacleanInjected = true;

  // Cria um banner discreto no canto superior direito para orientar o usuário
  const banner = document.createElement('div');
  banner.id = 'instaclean-helper-banner';
  banner.style.cssText = \`
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 16px 20px;
    max-width: 360px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    font-size: 13px;
    line-height: 1.5;
  \`;

  banner.innerHTML = \`
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <strong style="color: #f43f5e; font-size: 14px; display: flex; align-items: center; gap: 6px;">
        🛡️ InstaClean Auxiliar
      </strong>
      <button id="instaclean-close-btn" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:16px;">✕</button>
    </div>
    <p style="margin: 0 0 10px 0; color: #cbd5e1;">
      Você está no modo de revisão assistida. Verifique se deseja manter ou deixar de seguir esta conta.
    </p>
    <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px; font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
      💡 Dica: Clique no botão <strong>"Seguindo"</strong> acima e confirme <strong>"Deixar de seguir"</strong>.
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="instaclean-done-btn" style="flex:1; background:#f43f5e; color:white; border:none; padding:8px 12px; border-radius:6px; font-weight:600; cursor:pointer; font-size:12px;">
        ✓ Marcar como Concluído
      </button>
    </div>
  \`;

  document.body.appendChild(banner);

  document.getElementById('instaclean-close-btn')?.addEventListener('click', () => {
    banner.style.display = 'none';
  });

  document.getElementById('instaclean-done-btn')?.addEventListener('click', () => {
    // Comunica de volta se a aba de origem tiver o InstaClean aberto
    window.postMessage({ type: 'INSTACLEAN_CONFIRMED', username: window.location.pathname.replace(/\\//g, '') }, '*');
    const btn = document.getElementById('instaclean-done-btn');
    if (btn) {
      btn.innerText = '✓ Confirmado!';
      btn.style.background = '#10b981';
      setTimeout(() => { banner.style.display = 'none'; }, 1500);
    }
  });
})();
`,

  'popup.html': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>InstaClean Companion</title>
  <style>
    body {
      width: 300px;
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      font-size: 13px;
    }
    h2 {
      margin: 0 0 8px 0;
      font-size: 15px;
      color: #f43f5e;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    p {
      color: #94a3b8;
      line-height: 1.4;
      margin: 0 0 12px 0;
    }
    .status-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      background: #10b98122;
      color: #10b981;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <h2>🛡️ InstaClean Companion</h2>
  <div class="status-box">
    Status: <span class="badge">Ativo e Seguro</span>
    <p style="margin: 6px 0 0 0; font-size: 11px; color: #cbd5e1;">
      Modo assistido pronto. Todas as ações de unfollow dependem exclusivamente da sua confirmação manual.
    </p>
  </div>
  <p>Abra o InstaClean no navegador para iniciar a revisão assistida perfil a perfil.</p>
</body>
</html>
`,

  'README.md': `# InstaClean Companion (Extensão Opcional Manifest V3)

Esta extensão opcional auxilia o fluxo assistido entre o InstaClean e o Instagram.

## Garantia de Privacidade e Segurança
- 100% Local no seu computador.
- NÃO captura senhas.
- NÃO manipula cookies ou tokens de sessão.
- NÃO realiza unfollows automáticos em massa (o que bloquearia sua conta).
- NÃO faz requisições externas para nenhum servidor.

## Como instalar no Windows (Google Chrome, Microsoft Edge ou Brave):

1. Extraia o conteúdo deste arquivo ZIP em uma pasta do seu computador (por exemplo: \`C:\\InstaClean-Extension\`).
2. Abra seu navegador (Chrome ou Edge).
3. Na barra de endereços, digite:
   - Para Chrome: \`chrome://extensions\`
   - Para Edge: \`edge://extensions\`
4. No canto superior direito, ative a chave **"Modo do desenvolvedor"** (Developer mode).
5. Clique no botão **"Carregar sem compactação"** (Load unpacked) que aparecerá no topo.
6. Selecione a pasta onde você extraiu os arquivos desta extensão.
7. Pronto! A extensão estará instalada e pronta para apoiar seu fluxo no InstaClean.
`,
};

/**
 * Creates and triggers download of the Manifest V3 extension as a ZIP
 */
export async function downloadExtensionZip(): Promise<void> {
  const zip = new JSZip();

  for (const [filename, content] of Object.entries(EXTENSION_FILES)) {
    zip.file(filename, content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'instaclean-extensao-manifest-v3.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
