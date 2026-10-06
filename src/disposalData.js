export const disposalTypes = ['Metais e cabos', 'Equipamentos eletroeletrônicos', 'Plásticos', 'Material com óleo ou contaminação', 'Outros / classificação pendente'];
// Prefer an explicit catalog classification; name matching is only a demo fallback.
export function suggestDisposalType(material) {
  if (disposalTypes.includes(material.tipoMaterial)) return material.tipoMaterial;
  const description = [material.descricao, material.categoria].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(contaminad[oa]s?|oleo|oleos[oa]s?)\b/.test(description)) return 'Material com óleo ou contaminação';
  if (/\b(disjuntor|disjuntores|rele|reles|contator|contatores|eletroeletronicos?|eletronicos?)\b/.test(description)) return 'Equipamentos eletroeletrônicos';
  if (/\b(cabos?|cobre|aluminio|alicate|alicates|bracadeiras?|galvanizad[oa]s?|metais|metal)\b/.test(description)) return 'Metais e cabos';
  if (/\b(plastic[oa]s?|pvc|polietileno)\b/.test(description)) return 'Plásticos';
  return '';
}

export const destinations = [
  { id: 'metal', name: 'Ponto de segregação de metais', location: 'Galpão demonstrativo · Área de recicláveis · Baia M', types: ['Metais e cabos'], route: 'Reciclagem', guidance: 'Separar cabos e metais por composição e consultar o parceiro de reciclagem homologado.' },
  { id: 'electronics', name: 'Ponto de logística reversa', location: 'Galpão demonstrativo · Área de eletroeletrônicos · Baia E', types: ['Equipamentos eletroeletrônicos'], route: 'Logística reversa', guidance: 'Manter componentes separados e consultar fabricante ou operador homologado para recebimento.' },
  { id: 'plastic', name: 'Ponto de segregação de plásticos', location: 'Galpão demonstrativo · Área de recicláveis · Baia P', types: ['Plásticos'], route: 'Reciclagem', guidance: 'Avaliar composição e contaminação antes de encaminhar ao parceiro de reciclagem.' },
  { id: 'special', name: 'Área de avaliação especializada', location: 'Galpão demonstrativo · Área de quarentena · Baia Q', types: ['Material com óleo ou contaminação', 'Outros / classificação pendente'], route: 'Destinação especializada', guidance: 'Solicitar classificação e orientação da equipe ambiental antes de qualquer encaminhamento externo.' },
];
