import React, { useState } from 'react';

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
export default function Disposal({ equipment, focusedId, onSchedule, go }) {
  const pending = equipment.filter(m => m.status === 'Aguardando destinação');
  const [selected, setSelected] = useState(focusedId || pending[0]?.idInterno || '');
  const [feedback, setFeedback] = useState('');
  const material = pending.find(m => m.idInterno === selected);
  const options = material ? destinations.filter(d => d.types.includes(material.tipoDescarte)) : [];
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const destination = options.find(d => d.id === data.get('destination'));
    if (!material || !destination) { setFeedback('Selecione um material e um destino compatível.'); return; }
    onSchedule(material.idInterno, destination, data.get('responsavel').trim(), data.get('data'));
    setSelected(''); setFeedback('Encaminhamento demonstrativo registrado no histórico. A entrega física ainda não foi confirmada.');
  }
  return <div className="disposal-workspace"><div className="info-banner"><div><strong>Locais demonstrativos · validação ambiental pendente</strong><p>Estes pontos representam áreas fictícias de segregação. Endereços, contatos e parceiros reais devem ser cadastrados e validados pela empresa. Registrar o encaminhamento não confirma a entrega ou o descarte.</p></div></div><div className="disposal-layout"><section className="card disposal-pending"><div className="section-heading"><h2>Materiais após a triagem</h2><span className="count">{pending.length}</span></div>{pending.map(m => <button className={`disposal-item ${selected === m.idInterno ? 'selected' : ''}`} key={m.idInterno} onClick={() => { setSelected(m.idInterno); setFeedback(''); }}><strong>{m.descricao}</strong><small>{m.idInterno} · {m.codigoEtiquetaAtual}</small><span>{m.tipoDescarte || 'Classificação pendente'}</span></button>)}{!pending.length && <div className="empty"><p>Nenhum material aguardando destinação.</p><button className="button secondary" onClick={() => go('Retorno e triagem')}>Abrir retorno e triagem</button></div>}</section><section className="card disposal-detail"><div className="section-heading"><div><span className="eyebrow">PRÓXIMO PASSO DO MATERIAL</span><h2>{material ? material.descricao : 'Selecione um material'}</h2></div></div>{material && <form key={material.idInterno} onSubmit={submit}><p className="form-hint">{material.idInterno} · {material.tipoDescarte || 'Classificação pendente'} · Local atual: {material.localizacao}. Recomendações sujeitas à avaliação da equipe ambiental.</p><fieldset><legend>Locais sugeridos para encaminhamento</legend>{(options.length ? options : destinations.filter(d => d.id === 'special')).map(d => <label className="destination-card" key={d.id}><input type="radio" name="destination" value={d.id} required disabled={!options.length} /><div><span className="pill green">{d.route}</span><h3>{d.name}</h3><p>{d.location}</p><small>{d.guidance}</small></div></label>)}</fieldset>{!options.length && <p role="alert">Classificação ausente. Solicite avaliação ambiental antes de registrar o encaminhamento.</p>}<div className="rfid-form-columns"><label>Responsável pelo encaminhamento<input name="responsavel" required pattern=".*\S.*" defaultValue="Lucas Martins" /></label><label>Data prevista<input name="data" type="date" required defaultValue={new Date().toLocaleDateString('en-CA')} /></label></div><label className="checkbox-label"><input type="checkbox" required />Confirmo o planejamento demonstrativo do encaminhamento.</label><button className="button primary" disabled={!options.length}>Registrar encaminhamento</button></form>}{!material && <p className="empty">Escolha um item na lista para consultar os locais compatíveis.</p>}{feedback && <p className="rfid-feedback" role="status">{feedback}</p>}</section></div><section className="card movement-card"><div className="section-heading"><h2>Encaminhamentos registrados</h2></div>{equipment.filter(m => m.status === 'Encaminhamento planejado').map(m => <article className="disposal-history" key={m.idInterno}><strong>{m.idInterno} · {m.descricao}</strong><p>{m.destinacao?.nome} · {m.destinacao?.local}</p><small>{m.destinacao?.responsavel} · {m.destinacao?.data} · Entrega física pendente</small></article>)}{!equipment.some(m => m.status === 'Encaminhamento planejado') && <p className="empty">Nenhum encaminhamento registrado.</p>}</section></div>;
}
