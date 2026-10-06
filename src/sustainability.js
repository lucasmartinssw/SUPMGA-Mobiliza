import { destinations, disposalTypes } from './disposalData.js';
export const outcomes = [ ['reusable', 'Apto para reutilização'], ['repair', 'Manutenção / recuperação'], ['discard', 'Não reutilizável · destinação'], ['consumed', 'Consumido na obra'], ['waste', 'Desperdiçado'], ['lost', 'Não localizado / perdido'] ];
export const round = n => Math.round(n * 100) / 100;
export function pendingItems(record) { return record.status === 'Concluída' ? record.items.filter(i => i.needed > 0 && !i.review) : []; }
export function eligibleDestinations(type) { return destinations.filter(d => d.types.includes(type)); }
const validDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
export function recordReview(records, mobilizationId, itemId, review) {
  const record = records.find(m => m.id === mobilizationId);
  const item = record?.items.find(i => i.id === itemId);
  if (!record || record.status !== 'Concluída' || !item || item.review) throw Error('Este material não está pendente de triagem.');
  if (!['un', 'm'].includes(item.unit)) throw Error('Cadastre a unidade do material antes de conferir.');
  const values = outcomes.map(([k]) => review.quantities[k]);
  if (values.some(n => !Number.isFinite(n) || n < 0 || (item.unit === 'un' ? !Number.isInteger(n) : round(n) !== n)) || round(values.reduce((a,b) => a+b,0)) !== round(item.needed)) throw Error('A soma das quantidades deve corresponder ao total enviado. Unidades devem ser inteiras.');
  if (!review.responsible?.trim() || !validDate(review.date) || !review.confirmed) throw Error('Informe data, responsável e confirme a conferência.');
  if ((review.quantities.discard > 0 || review.quantities.repair > 0) && !disposalTypes.includes(review.type)) throw Error('Confira o tipo do material para sugerir os destinos.');
  if (review.unitCost !== null && (!Number.isFinite(review.unitCost) || review.unitCost < 0)) throw Error('Informe um custo unitário válido ou deixe em branco.');
  if ((review.quantities.lost > 0 || review.quantities.waste > 0) && !review.notes?.trim()) throw Error('Descreva a ocorrência de perda ou desperdício.');
  const saved = { ...review, responsible: review.responsible.trim(), reuses: [], disposal: null };
  return records.map(m => m.id === record.id ? { ...m, items: m.items.map(i => i.id === itemId ? { ...i, review: saved } : i), history: [...m.history, { action: `Triagem registrada: ${item.name || item.id}`, date: review.date, responsible: review.responsible.trim() }] } : m);
}
export function recordDisposal(records, mobId, itemId, receipt) {
  const item = records.find(m => m.id === mobId)?.items.find(i => i.id === itemId);
  if (!item?.review || item.review.quantities.discard <= 0 || item.review.disposal) throw Error('Não há destinação pendente para este material.');
  const point = eligibleDestinations(item.review.type).find(d => d.id === receipt.destinationId);
  if (!point || !receipt.responsible?.trim() || !validDate(receipt.date) || !receipt.evidence?.trim() || !receipt.confirmed) throw Error('Selecione um destino compatível e informe data, responsável e comprovante.');
  return records.map(m => m.id === mobId ? { ...m, items: m.items.map(i => i.id === itemId ? { ...i, review: { ...i.review, disposal: { ...receipt, destination: point.name, location: point.location, route: point.route, quantity: i.review.quantities.discard } } } : i), history: [...m.history, { action: `Destinação confirmada: ${item.name || item.id} · ${point.name}`, date: receipt.date, responsible: receipt.responsible.trim() }] } : m);
}
export function recordReuse(records, mobId, itemId, event) {
  const item = records.find(m => m.id === mobId)?.items.find(i => i.id === itemId);
  const target = records.find(m => m.id === event.targetId && m.status === 'Em mobilização');
  const targetItem = target?.items.find(i => i.id === itemId);
  const used = item?.review?.reuses.reduce((sum,e) => sum+e.quantity,0) || 0;
  const allocated = records.flatMap(m => m.items).flatMap(i => i.id === itemId ? i.review?.reuses || [] : []).filter(e => e.targetId === event.targetId).reduce((sum,e) => sum+e.quantity,0);
  if (!item?.review || !targetItem || mobId === event.targetId || !Number.isFinite(event.quantity) || event.quantity <= 0 || (item.unit === 'un' ? !Number.isInteger(event.quantity) : round(event.quantity) !== event.quantity) || round(used+event.quantity) > item.review.quantities.reusable || round(allocated+event.quantity) > targetItem.needed) throw Error('Confira a quantidade disponível e selecione uma mobilização em andamento com este material.');
  if (!event.responsible?.trim() || !validDate(event.date) || !event.confirmed) throw Error('Informe data, responsável e confirme a reutilização.');
  return records.map(m => m.id === mobId ? { ...m, items: m.items.map(i => i.id === itemId ? { ...i, review: { ...i.review, reuses: [...i.review.reuses, event] } } : i), history: [...m.history, { action: `Reutilização: ${event.quantity} ${item.unit} de ${item.name || item.id} em ${event.targetId}`, date: event.date, responsible: event.responsible.trim() }] } : m);
}
export function sustainabilityTotals(records) {
  const totals = { un: {}, m: {}, estimatedSavings: 0, missingCosts: 0, reviewed: 0, pending: 0, missingUnits: 0 };
  for (const record of records) {
    totals.pending += pendingItems(record).length;
    for (const item of record.items) {
      if (!item.review) continue;
      totals.reviewed++;
      const bucket = totals[item.unit];
      if (!bucket || !['un','m'].includes(item.unit)) { totals.missingUnits++; continue; }
      for (const [key] of outcomes) bucket[key] = round((bucket[key] || 0) + item.review.quantities[key]);
      const reused = item.review.reuses.reduce((sum,e) => sum+e.quantity,0);
      bucket.reused = round((bucket.reused || 0)+reused);
      bucket.disposed = round((bucket.disposed || 0)+(item.review.disposal?.quantity || 0));
      bucket.available = round((bucket.available || 0)+item.review.quantities.reusable-reused);
      if (reused > 0) { if (item.review.unitCost === null) totals.missingCosts++; else totals.estimatedSavings += reused*item.review.unitCost; }
    }
  }
  totals.estimatedSavings = round(totals.estimatedSavings);
  return totals;
}
