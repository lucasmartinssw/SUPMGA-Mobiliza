export const MOBILIZATIONS_KEY = 'supmgamobiliza-mobilizations-v1';
export const statuses = ['Planejada', 'Em mobilização', 'Aguardando retorno', 'Concluída'];
export const nextStatus = { Planejada: 'Em mobilização', 'Em mobilização': 'Concluída', 'Aguardando retorno': 'Concluída' };
const seeds = [
  { id: 'MOB-001', work: 'Ampliação de rede · Jardim das Flores', start: '2026-09-21', end: '2026-10-02', responsible: 'Lucas Silva', status: 'Planejada', items: [{ id: 'CAT-001', needed: 10 }, { id: 'CAT-002', needed: 20 }, { id: 'CAT-003', needed: 100 }], history: [] },
  { id: 'MOB-002', work: 'Manutenção preventiva · Centro', start: '2026-10-05', end: '2026-10-12', responsible: 'João Pedro Medeiros', status: 'Em mobilização', items: [{ id: 'CAT-004', needed: 4 }, { id: 'CAT-005', needed: 8 }], history: [] },
  { id: 'MOB-003', work: 'Adequação de rede · Vila Reis', start: '2026-09-14', end: '2026-09-18', responsible: 'Caio Dias', status: 'Concluída', items: [{ id: 'CAT-002', needed: 6 }], history: [] },
];
export function readMobilizations(draft, materials = [], override) {
  let records;
  try {
    const saved = override || JSON.parse(localStorage.getItem(MOBILIZATIONS_KEY));
    if (Array.isArray(saved) && saved.every(m => m && ['id', 'work', 'start', 'end', 'responsible'].every(k => typeof m[k] === 'string') && statuses.includes(m.status) && Array.isArray(m.items) && m.items.every(i => i && typeof i.id === 'string' && Number.isFinite(i.needed) && i.needed >= 0) && Array.isArray(m.history) && m.history.every(e => e && ['action', 'date', 'responsible'].every(k => typeof e[k] === 'string'))) && new Set(saved.map(m => m.id)).size === saved.length) records = saved;
  } catch { /* Keep the demo usable when browser storage is unavailable. */ }
  if (!records) records = seeds.map(m => ({ ...m, items: m.items.map(i => ({ ...i })), history: [] }));
  // Preserve the previously saved single-plan draft as a distinct record.
  if (draft && !draft.mobilizationId && !records.some(m => m.id === 'MOB-LEGADO')) records = [{ ...draft.plan, id: 'MOB-LEGADO', status: 'Planejada', history: [] }, ...records];
  return records.map(m => ({ ...m, items: m.items.map(i => { const material = materials.find(c => c.id === i.id); return { ...i, name: i.name || material?.name || i.id, unit: i.unit || material?.unit || '', category: i.category || material?.category || '' }; }) }));
}
export function newMobilizationId(records) {
  const numbers = records.map(m => /^MOB-(\d+)$/.exec(m.id)).filter(Boolean).map(m => Number(m[1]));
  return `MOB-${String(Math.max(0, ...numbers) + 1).padStart(3, '0')}`;
}
