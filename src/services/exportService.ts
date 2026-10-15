import { InstagramAccount, ImportAuditReport } from '../types/instagram';

export function exportToCSV(accounts: InstagramAccount[]): void {
  const headers = ['Username', 'Nome de Exibição', 'Link do Perfil', 'Situação', 'Seguido Em', 'Protegido', 'Notas'];
  
  const rows = accounts.map((acc) => [
    acc.username,
    acc.displayName || acc.username,
    acc.profileUrl,
    acc.status,
    acc.followedAt ? new Date(acc.followedAt).toLocaleDateString('pt-BR') : 'Desconhecido',
    acc.isWhitelisted ? 'Sim' : 'Não',
    acc.notes || '',
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadBlob(new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }), 'instaclean_contas.csv');
}

export function exportToJSON(accounts: InstagramAccount[], report: ImportAuditReport | null): void {
  const data = {
    app: 'InstaClean',
    exportedAt: new Date().toISOString(),
    report,
    accounts,
  };

  const jsonString = JSON.stringify(data, null, 2);
  downloadBlob(new Blob([jsonString], { type: 'application/json' }), 'instaclean_backup.json');
}

export function exportToTxtList(accounts: InstagramAccount[]): void {
  const text = accounts.map((a) => a.username).join('\n');
  downloadBlob(new Blob([text], { type: 'text/plain' }), 'instaclean_usernames.txt');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
