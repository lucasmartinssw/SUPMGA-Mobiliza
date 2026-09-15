import React, { useEffect, useId, useRef, useState } from 'react';

const KEY = 'supmgamobiliza-rfid-v1';
const today = () => new Date().toLocaleDateString('en-CA');
const seed = [
  { idInterno: 'MAT-001', sisupCodigo: 'SISUP-45010', descricao: 'Disjuntor monopolar 32 A', codigoEtiquetaAtual: 'ETQ-002', rfidId: '', contratoAtual: '', localizacao: 'Galpão central · A1', condicao: 'Apto', status: 'Livre', eventos: [] },
  { idInterno: 'MAT-002', sisupCodigo: 'SISUP-45010', descricao: 'Disjuntor monopolar 32 A', codigoEtiquetaAtual: 'ETQ-003', rfidId: '', contratoAtual: 'CONTRATO-034', localizacao: 'Obra Jardim das Flores', condicao: 'Apto', status: 'Em contrato', eventos: [] },
  { idInterno: 'MAT-003', sisupCodigo: 'SISUP-78020', descricao: 'Alicate hidráulico de compressão', codigoEtiquetaAtual: 'ETQ-004', rfidId: '', contratoAtual: '', localizacao: 'Galpão central · Recebimento', condicao: 'A conferir', status: 'Aguardando triagem', eventos: [] },
];
function restore() {
  try {
    let data = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(data) || !data.length) return seed;
    // Migrate the former visual-label field without replacing existing codes or histories.
    data = data.map(m => { const { etiquetaVisual, ...record } = m || {}; return { ...record, codigoEtiquetaAtual: record.codigoEtiquetaAtual ?? etiquetaVisual ?? '', rfidId: record.rfidId ?? '' }; });
    if (!data.every(m => m && ['idInterno', 'sisupCodigo', 'descricao', 'rfidId', 'codigoEtiquetaAtual', 'contratoAtual', 'localizacao', 'condicao', 'status'].every(k => typeof m[k] === 'string') && Array.isArray(m.eventos) && m.eventos.every(e => e && ['tipo', 'data', 'origem', 'destino', 'contrato', 'responsavel'].every(k => typeof e[k] === 'string')))) return seed;
    if (new Set(data.map(m => m.idInterno)).size !== data.length || new Set(data.filter(m => m.rfidId).map(m => m.rfidId)).size !== data.filter(m => m.rfidId).length) return seed;
    return data;
  } catch { return seed; }
}
function Dialog({ title, close, children }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => { ref.current?.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={id} onCancel={close}><div className="modal-heading"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Fechar ficha" onClick={close}>✕</button></div><div className="detail-body">{children}</div></dialog>;
}
const normalize = value => value.trim().toLocaleUpperCase('pt-BR');
const search = (m, value) => [m.idInterno, m.sisupCodigo, m.rfidId, m.descricao, m.contratoAtual, m.codigoEtiquetaAtual].join(' ').toLocaleLowerCase('pt-BR').includes(value.trim().toLocaleLowerCase('pt-BR'));
const badge = status => <span className={`pill ${status === 'Livre' ? 'green' : status === 'Em contrato' ? 'neutral' : 'orange'}`}>{status}</span>;
const demo = <span className="demo-label">Protótipo com dados fictícios</span>;

export default function RfidWorkspace({ page, go }) {
  const [equipment, setEquipment] = useState(restore);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [tag, setTag] = useState('RFID-1001');
  const [unknown, setUnknown] = useState(false);
  const [message, setMessage] = useState('');
  const [storageError, setStorageError] = useState('');
  const [editTag, setEditTag] = useState(false);
  const [editCurrentTag, setEditCurrentTag] = useState(false);
  const [currentCode, setCurrentCode] = useState('ETQ-002');
  const [lookupMessage, setLookupMessage] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [eventType, setEventType] = useState('Saída para contrato');
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(equipment)); setStorageError(''); }
    catch { setStorageError('O navegador não permitiu salvar. As alterações permanecem apenas nesta sessão.'); }
  }, [equipment]);
  const material = equipment.find(m => m.idInterno === selected);
  const change = (id, updates, event) => setEquipment(list => list.map(m => m.idInterno === id ? { ...m, ...updates, eventos: [...m.eventos, event] } : m));
  const open = m => { setSelected(m.idInterno); setEditTag(false); setEditCurrentTag(false); setMessage(''); setEventType(page === 'Retorno e triagem' ? 'Retorno ao galpão' : 'Saída para contrato'); };
  const codeUsed = (code, exceptId) => equipment.some(m => m.idInterno !== exceptId && [m.codigoEtiquetaAtual, m.rfidId, ...m.eventos.flatMap(e => [e.codigoAnterior, e.codigoNovo, e.rfidAnterior, e.rfidNovo])].filter(Boolean).some(value => normalize(value) === normalize(code)));
  const locateCurrentTag = e => {
    e.preventDefault();
    const found = equipment.find(m => m.codigoEtiquetaAtual && normalize(m.codigoEtiquetaAtual) === normalize(currentCode));
    if (!found) { setLookupMessage('Nenhuma ficha com esta etiqueta atual. Pesquise o cadastro antes de criar outro.'); return; }
    setLookupMessage('');
    open(found);
  };
  const replaceCurrentTag = e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = data.get('codigo').trim();
    if (!next) { setMessage('Informe o novo código da etiqueta atual.'); return; }
    if (codeUsed(next, material.idInterno) || (material.rfidId && normalize(next) === normalize(material.rfidId))) { setMessage('Código já utilizado. Escolha um identificador único.'); return; }
    if (normalize(next) === normalize(material.codigoEtiquetaAtual)) { setMessage('Este já é o código da etiqueta atual.'); return; }
    change(material.idInterno, { codigoEtiquetaAtual: next }, { tipo: 'Etiqueta atual substituída', data: data.get('data'), origem: material.localizacao, destino: material.localizacao, contrato: material.contratoAtual, responsavel: data.get('responsavel').trim(), codigoAnterior: material.codigoEtiquetaAtual, codigoNovo: next, motivo: data.get('motivo').trim() });
    setEditCurrentTag(false); setMessage(`Etiqueta atualizada para ${next}. ${material.idInterno} e o RFID opcional foram preservados.`);
  };
  const read = () => {
    const found = equipment.find(m => m.rfidId && normalize(m.rfidId) === normalize(tag));
    setUnknown(!found);
    if (!found) return;
    change(found.idInterno, {}, { tipo: 'Leitura RFID simulada', data: today(), origem: found.localizacao, destino: found.localizacao, contrato: found.contratoAtual, responsavel: 'Operador da demonstração', rfidLido: found.rfidId });
    open(found, true);
  };
  const linkTag = e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = data.get('rfid').trim().toUpperCase();
    if (!next) { setMessage('Informe o identificador RFID.'); return; }
    if (codeUsed(next, material.idInterno) || normalize(next) === normalize(material.codigoEtiquetaAtual)) { setMessage('Código já utilizado. Escolha um identificador único.'); return; }
    if (next === material.rfidId) { setMessage('Esta etiqueta já está vinculada à ficha.'); return; }
    change(material.idInterno, { rfidId: next }, { tipo: material.rfidId ? 'RFID opcional substituído' : 'RFID opcional vinculado', data: today(), origem: material.localizacao, destino: material.localizacao, contrato: material.contratoAtual, responsavel: data.get('responsavel').trim(), rfidAnterior: material.rfidId || '', rfidNovo: next, motivo: data.get('motivo').trim() });
    setEditTag(false); setMessage(`RFID ${next} vinculado como identificação opcional. ${material.idInterno} e a etiqueta atual ${material.codigoEtiquetaAtual} foram preservados.`);
  };
  const saveEvent = e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const destination = data.get('destino').trim();
    const contract = data.get('contrato').trim();
    const responsible = data.get('responsavel').trim();
    if (!destination || !responsible || (['Saída para contrato', 'Remanejamento'].includes(eventType) && !contract)) { setMessage('Preencha destino, responsável e contrato quando aplicável.'); return; }
    if (eventType === 'Saída para contrato' && material.status !== 'Livre') { setMessage('A saída exige material livre e conferido.'); return; }
    if (eventType === 'Remanejamento' && material.status !== 'Em contrato') { setMessage('O remanejamento exige material em contrato.'); return; }
    if (eventType === 'Conferência em campo' && material.status !== 'Em contrato') { setMessage('A conferência em campo exige material em contrato.'); return; }
    if (eventType === 'Retorno ao galpão' && material.status !== 'Em contrato') { setMessage('O retorno exige um material em contrato. Para itens já recebidos, conclua a triagem.'); return; }
    const updates = eventType === 'Retorno ao galpão'
      ? { localizacao: destination, contratoAtual: '', status: 'Aguardando triagem', condicao: 'A conferir' }
      : eventType === 'Conferência em campo' ? { localizacao: destination } : { localizacao: destination, contratoAtual: contract, status: 'Em contrato' };
    change(material.idInterno, updates, { tipo: eventType, data: data.get('data'), origem: material.localizacao, destino: destination, contrato: eventType === 'Retorno ao galpão' || eventType === 'Conferência em campo' ? material.contratoAtual : contract, responsavel: responsible });
    setMessage(`${eventType} registrado na mesma ficha ${material.idInterno}.`);
  };
  const triage = e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const condition = data.get('condicao');
    if (material.status !== 'Aguardando triagem') { setMessage('Registre o retorno antes de conferir este material.'); return; }
    change(material.idInterno, { condicao: condition, status: condition === 'Apto' ? 'Livre' : condition, contratoAtual: '' }, { tipo: `Triagem conferida: ${condition}`, data: data.get('data'), origem: material.localizacao, destino: material.localizacao, contrato: '', responsavel: data.get('responsavel').trim() });
    setMessage(`Conferência demonstrativa concluída. ${material.idInterno} preservado; status: ${condition === 'Apto' ? 'Livre' : condition}.`);
  };
  const register = e => {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const code = data.get('etiqueta').trim();
    if (!code || codeUsed(code)) { setRegistrationMessage('Código da etiqueta já utilizado ou vazio. Pesquise a ficha existente antes de cadastrar.'); return; }
    const numericIds = equipment.map(m => Number(m.idInterno.replace('MAT-', ''))).filter(Number.isFinite);
    const id = `MAT-${String(Math.max(0, ...numericIds) + 1).padStart(3, '0')}`;
    const location = data.get('localizacao').trim();
    const m = { idInterno: id, sisupCodigo: data.get('sisup').trim(), descricao: data.get('descricao').trim(), rfidId: '', codigoEtiquetaAtual: code, contratoAtual: '', localizacao: location, condicao: 'Apto', status: 'Livre', eventos: [{ tipo: 'Cadastro inicial e conferência demonstrativa', data: today(), origem: 'Cadastro', destino: location, contrato: '', responsavel: data.get('responsavel').trim() }] };
    setEquipment(list => [...list, m]); setRegistrationMessage(''); setQuery(''); setFilter('Todos'); go('Inventário'); open(m);
  };
  const table = list => <div className="table-scroll"><table><thead><tr><th>Número interno</th><th>Material / SISUP simulado</th><th>RFID opcional</th><th>Contrato / último local</th><th>Status</th></tr></thead><tbody>{list.map(m => <tr key={m.idInterno}><td><button className="material-link" onClick={() => open(m)}>{m.idInterno}</button><small>Etiqueta atual: {m.codigoEtiquetaAtual || 'Não informada'}</small></td><td><button className="material-link" onClick={() => open(m)}>{m.descricao}</button><small>{m.sisupCodigo}</small></td><td>{m.rfidId || <span className="pill neutral">Não vinculado · opcional</span>}</td><td>{m.contratoAtual || 'Sem contrato'}<small>{m.localizacao}</small></td><td>{badge(m.status)}</td></tr>)}</tbody></table>{!list.length && <p className="empty">Nenhum equipamento encontrado.</p>}</div>;
  const active = ['Visão geral', 'Inventário', 'Cadastrar material', 'Identificação e movimentações', 'Retorno e triagem', 'Configuração'].includes(page);
  if (!active) return null;
  return <div className="rfid-workspace">
    {storageError && <div className="info-banner" role="alert">{storageError}</div>}
    {page === 'Visão geral' && <><div className="metric-grid">{[['Livres', equipment.filter(m => m.status === 'Livre').length], ['Em contratos', equipment.filter(m => m.status === 'Em contrato').length], ['Retornos pendentes de triagem', equipment.filter(m => m.status === 'Aguardando triagem').length], ['Etiqueta atual não informada', equipment.filter(m => !m.codigoEtiquetaAtual).length]].map(([label, value]) => <section className="card metric" key={label}>{demo}<strong>{value}</strong><p>{label}</p></section>)}</div><section className="card movement-card"><div className="section-heading"><h2>RFID opcional · últimas simulações</h2><button className="button primary" onClick={() => go('Identificação e movimentações')}>Localizar e movimentar</button></div><div className="timeline">{equipment.flatMap(m => m.eventos.map((e, i) => ({ ...e, material: m, index: i }))).filter(e => e.tipo === 'Leitura RFID simulada').sort((a, b) => b.data.localeCompare(a.data) || b.index - a.index).slice(0, 8).map((e, i) => <div className="timeline-event" key={i}><button className="material-link" onClick={() => open(e.material)}>{e.material.idInterno} · {e.rfidLido}</button><p>{e.data} · {e.destino}</p></div>)}{!equipment.some(m => m.eventos.some(e => e.tipo === 'Leitura RFID simulada')) && <p className="empty">Nenhuma simulação RFID registrada. Localize a etiqueta atual ETQ-002 para movimentar MAT-001. Vincular RFID é opcional.</p>}</div></section></>}
    {page === 'Inventário' && <section className="card"><div className="section-heading"><div><h2>Equipamentos individuais · identidade permanente</h2><p className="subtle">O número interno permanece igual em todo o ciclo de vida.</p></div><button className="button primary" onClick={() => go('Cadastrar material')}>Cadastrar equipamento</button></div><div className="filters"><label className="search-input"><input aria-label="Buscar equipamento" placeholder="Etiqueta atual, número interno, SISUP, RFID opcional, nome ou contrato..." value={query} onChange={e => setQuery(e.target.value)} /></label><label>Status<select value={filter} onChange={e => setFilter(e.target.value)}>{['Todos', 'Livre', 'Em contrato', 'Aguardando triagem', 'Danificado', 'Perdido', 'Manutenção', 'Etiqueta atual não informada', 'Sem RFID (opcional)'].map(s => <option key={s}>{s}</option>)}</select></label></div>{table(equipment.filter(m => search(m, query) && (filter === 'Todos' || (filter === 'Etiqueta atual não informada' ? !m.codigoEtiquetaAtual : filter === 'Sem RFID (opcional)' ? !m.rfidId : m.status === filter))))}</section>}
    {page === 'Cadastrar material' && <section className="card registration"><div className="section-heading"><h2>Cadastro único do equipamento</h2>{demo}</div><form className="registration-form" onSubmit={register}><label className="full">Descrição<input name="descricao" required pattern=".*\S.*" maxLength="120" /></label><label>Código SISUP simulado<input name="sisup" required pattern=".*\S.*" placeholder="SISUP-45010" /></label><label>Código da etiqueta atual<input name="etiqueta" required pattern=".*\S.*" placeholder="ETQ-005" /></label><label>Localização inicial<input name="localizacao" required pattern=".*\S.*" defaultValue="Galpão central" /></label><label>Responsável pela conferência<input name="responsavel" required pattern=".*\S.*" defaultValue="Lucas Silva" /></label><div className="form-hint full">Registre o código da etiqueta física existente, cujo formato ainda não foi confirmado. O número interno é estável e RFID é opcional para evolução futura. Pesquise antes de criar outro cadastro.</div><label className="checkbox-label full"><input type="checkbox" required />Confirmo a conferência demonstrativa: equipamento apto e livre.</label>{registrationMessage && <p className="rfid-feedback full" role="alert">{registrationMessage}</p>}<button className="button primary full">Cadastrar e abrir ficha</button></form></section>}
    {(page === 'Identificação e movimentações' || page === 'Retorno e triagem') && <>
      <section className="card"><div className="section-heading"><div><h2>Localizar pela etiqueta atual</h2><p className="subtle">Etiqueta física existente · formato ainda não confirmado</p></div>{demo}</div><form className="filters" onSubmit={locateCurrentTag}><label className="search-input"><input aria-label="Código da etiqueta atual para localizar" value={currentCode} onChange={e => { setCurrentCode(e.target.value); setLookupMessage(''); }} placeholder="Ex.: ETQ-002" required pattern=".*\S.*" /></label><button className="button primary">Localizar ficha</button></form>{lookupMessage && <p className="rfid-feedback" role="status">{lookupMessage}</p>}<div className="table-note">MAT-001 já possui ETQ-002 no cenário inicial. Saída e retorno usam a mesma ficha, sem exigir RFID.</div></section>
      <section className="card movement-card"><div className="section-heading"><h2>Pesquisar cadastro existente</h2></div><div className="filters"><label className="search-input"><input aria-label="Busca manual" value={query} onChange={e => setQuery(e.target.value)} placeholder="Etiqueta atual, MAT-001, SISUP, nome, contrato ou RFID opcional" /></label></div>{table(equipment.filter(m => search(m, query)))}</section>
      <section className="card reader-card movement-card"><div className="reader-symbol" aria-hidden="true">)))</div><div><span className="eyebrow">EVOLUÇÃO FUTURA · OPCIONAL</span><h2>RFID · leitura simulada</h2><p>Um RFID vinculado abre a mesma ficha. Não substitui a etiqueta atual e não contém o histórico.</p>{demo}</div><div className="reader-controls"><label>RFID fictício<select value={tag} onChange={e => { setTag(e.target.value); setUnknown(false); }}>{[...new Set(['RFID-1001', 'RFID-1002', 'RFID-1003', ...equipment.map(m => m.rfidId).filter(Boolean), 'RFID-DESCONHECIDO'])].map(t => <option key={t}>{t}</option>)}</select></label><button className="button secondary" onClick={read}>Simular leitura RFID</button></div></section>
      {unknown && <div className="info-banner" role="status"><div><strong>Nenhuma ficha vinculada; pesquisar cadastro antes de criar outro</strong><p>Localize pela etiqueta atual. O vínculo RFID é opcional; nenhuma etiqueta existente é substituída automaticamente.</p></div></div>}
      <div className="info-banner"><div><strong>Último local registrado, sem localização em tempo real.</strong><p>A etiqueta atual não é presumida como QR, código de barras ou RFID. Não há leitor físico ou leitura automática pelo celular. O retorno aguarda conferência antes da liberação.</p></div></div>
    </>}
    {page === 'Configuração' && <section className="card registration"><div className="section-heading"><h2>Piloto futuro</h2><span className="pill orange">Não implementado</span></div><div className="detail-body"><h3>RFID real em equipamentos metálicos</h3><p className="pilot-copy">Um piloto exige testes de etiquetas próprias para metal, leitor compatível e escolha dos pontos de leitura. Esta demonstração não usa hardware, API, SISUP ou Web Supply.</p><div className="info-banner"><div><strong>Leitura não substitui conferência.</strong><p>Sem leitura automática pelo celular, inventário automático ou localização em tempo real. A ficha exibe o último local e evento registrados.</p></div></div><button className="button secondary" disabled>Conectar leitor físico · piloto futuro</button></div></section>}
    {material && <Dialog title={`Ficha ${material.idInterno}`} close={() => setSelected(null)}><span className="material-code">{material.sisupCodigo} · código e descrição simulados</span><h3>{material.descricao}</h3><div className="identity-banner"><span>NÚMERO INTERNO IMUTÁVEL</span><strong>{material.idInterno}</strong>{badge(material.status)}</div><dl><div><dt>Etiqueta atual · código existente</dt><dd>{material.codigoEtiquetaAtual || 'Não informado'}</dd></div><div><dt>RFID opcional · evolução futura</dt><dd>{material.rfidId || 'Não vinculado'}</dd></div><div><dt>Contrato atual</dt><dd>{material.contratoAtual || 'Sem contrato'}</dd></div><div><dt>Último local registrado</dt><dd>{material.localizacao}</dd></div><div><dt>Condição</dt><dd>{material.condicao}</dd></div></dl><p className="form-hint">O número interno é estável. A etiqueta física atual tem formato ainda não confirmado. RFID é um vínculo opcional e independente; não substitui a etiqueta existente nem armazena o histórico.</p><button className="button secondary" onClick={() => { setEditCurrentTag(v => !v); setEditTag(false); setMessage(''); }}>Registrar perda/troca da etiqueta atual</button><button className="button secondary" onClick={() => { setEditTag(v => !v); setEditCurrentTag(false); setMessage(''); }}>Vincular/substituir RFID opcional</button>
    {editCurrentTag && <form className="rfid-form" onSubmit={replaceCurrentTag}><h2>Trocar a etiqueta atual na mesma ficha</h2><p className="form-hint">Código anterior: {material.codigoEtiquetaAtual || 'Não informado'}. A alteração é manual e preserva o número interno e o RFID opcional.</p><label>Novo código da etiqueta atual<input name="codigo" required pattern=".*\S.*" maxLength="80" /></label><label>Motivo da troca<input name="motivo" defaultValue="Etiqueta perdida / substituída" required pattern=".*\S.*" /></label><label>Data da troca<input type="date" name="data" defaultValue={today()} required /></label><label>Responsável pela troca<input name="responsavel" defaultValue="Lucas Silva" required pattern=".*\S.*" /></label><button className="button primary">Salvar troca da etiqueta atual</button></form>}
    {editTag && <form className="rfid-form" onSubmit={linkTag}><h2>{material.rfidId ? 'Substituir somente o RFID opcional' : 'Vincular RFID opcional à ficha existente'}</h2><label>Novo RFID<input name="rfid" defaultValue={material.rfidId ? '' : 'RFID-1001'} required pattern=".*\S.*" placeholder="RFID-1010" maxLength="80" /></label><label>Motivo<input name="motivo" defaultValue={material.rfidId ? 'RFID perdido / substituído' : 'Demonstração de evolução futura'} required pattern=".*\S.*" /></label><label>Responsável pelo vínculo<input name="responsavel" defaultValue="Lucas Silva" required pattern=".*\S.*" /></label><button className="button primary">Salvar vínculo RFID</button></form>}
    {<form className="rfid-form" onSubmit={saveEvent}><h2>Registrar evento na ficha existente</h2><label>Tipo de evento<select value={eventType} onChange={e => setEventType(e.target.value)}>{['Saída para contrato', 'Remanejamento', 'Conferência em campo', 'Retorno ao galpão'].map(t => <option key={t}>{t}</option>)}</select></label><label>Destino / localização<input key={eventType} name="destino" defaultValue={eventType === 'Retorno ao galpão' ? 'Galpão central · Recebimento' : ''} required pattern=".*\S.*" placeholder="Obra Jardim das Flores" /></label><label>Contrato<input name="contrato" defaultValue={material.contratoAtual || 'CONTRATO-034'} required={['Saída para contrato', 'Remanejamento'].includes(eventType)} placeholder="CONTRATO-041" /></label><div className="rfid-form-columns"><label>Data do evento<input type="date" name="data" required defaultValue={today()} /></label><label>Responsável pelo evento<input name="responsavel" required pattern=".*\S.*" defaultValue="Lucas Silva" /></label></div><button className="button primary">Salvar evento</button></form>}
    {material.status === 'Aguardando triagem' && <form className="rfid-form" onSubmit={triage}><h2>Conferência de retorno</h2><label>Condição na triagem<select name="condicao">{['Apto', 'Danificado', 'Perdido', 'Manutenção'].map(c => <option key={c}>{c}</option>)}</select></label><div className="rfid-form-columns"><label>Data da conferência<input type="date" name="data" required defaultValue={today()} /></label><label>Responsável pela triagem<input name="responsavel" required pattern=".*\S.*" defaultValue="Lucas Silva" /></label></div><label className="checkbox-label"><input type="checkbox" required />Confirmo que realizei a conferência demonstrativa.</label><button className="button primary">Concluir triagem</button></form>}
    {message && <p className="rfid-feedback" role="status">{message}</p>}
    {material.eventos.some(e => e.tipo === 'Retorno ao galpão') && <div className="identity-comparison"><strong>Número antes da saída = número após retorno</strong><p>{material.idInterno} = {material.idInterno}</p><span>Mesma ficha, sem recadastro.</span></div>}
    <section className="timeline"><h2>Linha do tempo · {material.eventos.length} eventos</h2>{[...material.eventos].reverse().map((e, i) => <article className="timeline-event" key={i}><strong>{e.tipo}</strong><p>{e.data} · {e.responsavel}</p><p>{e.origem} → {e.destino}</p>{e.contrato && <p>{e.contrato}</p>}{e.rfidNovo && <p>RFID anterior: {e.rfidAnterior || 'Não vinculado'} → novo: {e.rfidNovo}<br />{e.motivo}</p>}{e.codigoNovo && <p>Etiqueta atual anterior: {e.codigoAnterior || 'Não informada'} → nova: {e.codigoNovo}<br />{e.motivo}</p>}{e.rfidLido && <p>Etiqueta lida: {e.rfidLido}</p>}</article>)}{!material.eventos.length && <p className="empty">Equipamento já cadastrado com etiqueta física existente. Registre movimentações nesta ficha; RFID não é obrigatório.</p>}</section></Dialog>}
  </div>;
}
