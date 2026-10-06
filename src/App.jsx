import React, { useEffect, useRef, useState } from 'react';
import RfidWorkspace from './RfidWorkspace.jsx';
import Login, { readSession, clearSession } from './Login.jsx';
import Mobilizations from './Mobilizations.jsx';
import { MOBILIZATIONS_KEY, readMobilizations, newMobilizationId, nextStatus } from './mobilizations.js';

const initialMaterials = [
  { id: 'CAT-001', name: 'Disjuntor monopolar 32 A', category: 'Proteção', unit: 'un', free: 4, field: 3, location: 'A1 · Prateleira 02', returnDate: '2026-09-24' },
  { id: 'CAT-002', name: 'Conector perfurante', category: 'Conexão', unit: 'un', free: 20, field: 0, location: 'B2 · Prateleira 01', returnDate: '' },
  { id: 'CAT-003', name: 'Cabo de cobre 16 mm²', category: 'Cabos', unit: 'm', free: 40, field: 30, location: 'C1 · Bobina 04', returnDate: '2026-09-28' },
  { id: 'CAT-004', name: 'Isolador polimérico 15 kV', category: 'Isolação', unit: 'un', free: 12, field: 8, location: 'A2 · Prateleira 03', returnDate: '2026-09-25' },
  { id: 'CAT-005', name: 'Braçadeira galvanizada', category: 'Fixação', unit: 'un', free: 36, field: 12, location: 'B1 · Prateleira 02', returnDate: '2026-09-26' },
  { id: 'CAT-006', name: 'Cabo multiplexado 35 mm²', category: 'Cabos', unit: 'm', free: 0, field: 80, location: 'C1 · Bobina 07', returnDate: '2026-10-02' },
];
const defaultPlan = { work: 'Ampliação de rede · Jardim das Flores', start: '2026-09-21', end: '2026-10-02', responsible: 'Lucas Silva', items: [{ id: 'CAT-001', needed: 10 }, { id: 'CAT-002', needed: 20 }, { id: 'CAT-003', needed: 100 }] };
const storageKey = 'supmgamobiliza-draft-v1';
const navigation = [ ['Mobilizações', 'layers'], ['Visão geral', 'dashboard'], ['Inventário', 'box'], ['Cadastrar material', 'plusbox'], ['Nova mobilização', 'layers'], ['Identificação e movimentações', 'search'], ['Retorno e triagem', 'check'], ['Destinação sustentável', 'return'], ['Indicadores', 'chart'], ['Configuração', 'check'] ];
const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  box: 'm12 3 9 5v8l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v8 M7.5 5.5l9 5',
  plusbox: 'M9 21H4V4h16v6 M14 17h8 M18 13v8 M8 8h8',
  layers: 'm12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5',
  out: 'M14 4H4v16h10 M10 12h12 M18 8l4 4-4 4',
  return: 'M10 4h10v16H10 M14 12H2 M6 8l-4 4 4 4',
  check: 'M9 4H5v17h14V4h-4 M9 2h6v5H9z M8 14l3 3 5-6',
  chart: 'M4 3v18h17 M8 16v-5 M13 16V6 M18 16V9',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M5 12h14 M14 7l5 5-5 5',
  clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  alert: 'm12 3 10 18H2z M12 9v5 M12 17v.2',
  save: 'M4 3h13l4 4v14H3V3z M7 3v6h10V3 M7 21v-8h10v8',
  close: 'M6 6l12 12 M18 6 6 18',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
};
function Icon({ name, size = 20, ...props }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.box} /></svg>; }
const date = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem previsão';
const amount = value => Number(value).toLocaleString('pt-BR');
function readDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || saved.version !== 1 || !saved.plan || !Array.isArray(saved.materials)) return null;
    saved.materials = saved.materials.map(m => ({ ...m, id: typeof m?.id === 'string' ? m.id.replace(/^MAT-/, 'CAT-') : m?.id }));
    if (Array.isArray(saved.plan.items)) saved.plan.items = saved.plan.items.map(i => ({ ...i, id: typeof i?.id === 'string' ? i.id.replace(/^MAT-/, 'CAT-') : i?.id }));
    const p = saved.plan;
    if (![p.work, p.start, p.end, p.responsible].every(v => typeof v === 'string') || !Array.isArray(p.items)) return null;
    if (!saved.materials.every(m => m && typeof m.id === 'string' && typeof m.name === 'string' && typeof m.category === 'string' && typeof m.location === 'string' && ['un', 'm'].includes(m.unit) && Number.isFinite(m.free) && m.free >= 0 && Number.isFinite(m.field) && m.field >= 0)) return null;
    if (!p.items.every(i => i && Number.isFinite(i.needed) && i.needed >= 0 && saved.materials.some(m => m.id === i.id))) return null;
    return saved;
  } catch { return null; }
}
function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current;
    el.showModal();
    return () => { el.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="modal" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="Fechar janela" onClick={onClose}><Icon name="close" /></button></div>{children}</dialog>;
}

export default function App() {
  const [user, setUser] = useState(readSession);
  if (!user) return <Login onLogin={setUser} />;
  return <Workspace user={user} onLogout={() => { clearSession(); setUser(null); }} />;
}
function Workspace({ user, onLogout }) {
  const [draft] = useState(readDraft);
  const [materials, setMaterials] = useState(draft?.materials || initialMaterials);
  const [plan, setPlan] = useState(draft?.plan || defaultPlan);
  const [page, setPage] = useState('Mobilizações');
  const [mobilizations, setMobilizations] = useState(() => readMobilizations(draft));
  const [mobilizationId, setMobilizationId] = useState(draft ? (draft.mobilizationId || 'MOB-LEGADO') : 'MOB-001');
  const [dirty, setDirty] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [addQuery, setAddQuery] = useState('');
  const [toast, setToast] = useState('');
  const [validated, setValidated] = useState(false);
  const [saved, setSaved] = useState(!!draft);
  const formRef = useRef(null);
  const headingRef = useRef(null);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [page]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timer); } }, [toast]);
  const go = next => { setPage(next); setMenuOpen(false); };
  const edit = updates => { setDirty(true); setValidated(false); setPlan(p => ({ ...p, ...updates })); setSaved(false); };
  const rows = plan.items.map(i => ({ ...materials.find(m => m.id === i.id), needed: i.needed })).filter(m => m.id);
  const shortages = rows.filter(m => m.needed > m.free);
  const totals = unit => materials.filter(m => m.unit === unit).reduce((sum, m) => sum + m.free, 0);
  const matches = (m, term) => `${m.name} ${m.id} ${m.category}`.toLocaleLowerCase('pt-BR').includes(term.toLocaleLowerCase('pt-BR'));
  const withDraftGuard = action => {
    if (dirty) setModal({ type: 'unsaved', action });
    else action();
  };
  const createPlan = () => withDraftGuard(() => {
    setPlan({ work: '', start: new Date().toLocaleDateString('en-CA'), end: '', responsible: user.name, items: [] });
    setMobilizationId(null); setValidated(false); setSaved(false); setDirty(false); setModal(null); go('Nova mobilização');
  });
  const editMobilization = record => withDraftGuard(() => {
    setPlan({ work: record.work, start: record.start, end: record.end, responsible: record.responsible, items: record.items.map(i => ({ id: i.id, needed: i.needed })) });
    setMobilizationId(record.id); setValidated(false); setSaved(true); setDirty(false); setModal(null); go('Nova mobilização');
  });
  const persistMobilizations = records => {
    try { localStorage.setItem(MOBILIZATIONS_KEY, JSON.stringify(records)); setMobilizations(records); return true; }
    catch { setToast('Não foi possível salvar: o armazenamento deste navegador está indisponível.'); return false; }
  };
  const updateStatus = (id, status) => {
    const record = mobilizations.find(m => m.id === id);
    if (!record || nextStatus[record.status] !== status) return false;
    return persistMobilizations(mobilizations.map(m => m.id === id ? { ...m, status, history: [...m.history, { action: `Etapa alterada para ${status}`, date: new Date().toLocaleDateString('en-CA'), responsible: user.name }] } : m));
  };
  const save = () => {
    if (!formRef.current.reportValidity()) return;
    if (!rows.length || rows.some(i => i.needed <= 0) || plan.end < plan.start) { setToast('Adicione materiais com quantidade maior que zero e confira as datas.'); return; }
    if (!validated) { setToast('Confirme a revisão da lista antes de salvar o planejamento.'); return; }
    const existing = mobilizations.find(m => m.id === mobilizationId);
    if (existing && existing.status !== 'Planejada') { setToast('Esta mobilização já avançou de etapa. Crie um novo planejamento.'); return; }
    const id = existing?.id || newMobilizationId(mobilizations);
    const record = { ...plan, id, status: 'Planejada', items: rows.map(m => ({ id: m.id, needed: m.needed, name: m.name, unit: m.unit })), history: [...(existing?.history || []), { action: existing ? 'Planejamento atualizado' : 'Planejamento criado', date: new Date().toLocaleDateString('en-CA'), responsible: user.name }] };
    if (!persistMobilizations(existing ? mobilizations.map(m => m.id === id ? record : m) : [record, ...mobilizations])) return;
    setMobilizationId(id); setSaved(true); setDirty(false);
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, plan, materials, mobilizationId: id })); }
    catch { setToast(`${id} salva na lista, mas não foi possível atualizar o rascunho.`); return; }
    setToast(`${id} salva. Consulte todas as obras em Mobilizações.`);
  };
  const addMaterial = m => { edit({ items: [...plan.items, { id: m.id, needed: 1 }] }); setToast(`${m.name} adicionado ao planejamento.`); };
  const demo = <span className="demo-label"><span />Dados de demonstração</span>;
  const titleDescriptions = { 'Mobilizações': 'Todas as obras em um lugar. Consulte materiais, prazos e o andamento de cada mobilização.', 'Destinação sustentável': 'Consulte locais compatíveis e planeje o encaminhamento dos materiais não reutilizáveis.', 'Identificação e movimentações': 'Localize pela etiqueta atual e registre eventos na mesma ficha; RFID é opcional.', 'Retorno e triagem': 'Receba os materiais, avalie a condição e confirme o próximo passo.', 'Configuração': 'Requisitos para um piloto futuro de RFID físico.', 'Nova mobilização': 'Planeje os materiais da obra e antecipe o que precisa de atenção.', 'Visão geral': 'Uma visão do seu inventário e do próximo planejamento.', 'Inventário': 'Consulte materiais, disponibilidade atual e localização.', 'Cadastrar material': 'Adicione um material ao inventário de demonstração.', 'Saídas': 'Acompanhe os materiais planejados para ir a campo.', 'Retornos': 'Consulte previsões de retorno e simule o recebimento.', 'Triagem': 'Simule a conferência dos materiais que retornaram.', 'Indicadores': 'Explore os números do inventário de demonstração.' };
  return <div className="app-shell"><a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Icon name="layers" size={27} /></span><div><strong>SUPMGA<span>Mobiliza</span></strong><small>GESTÃO DE MATERIAIS</small></div></div>
      <div className="workspace"><span className="workspace-icon"><Icon name="box" /></span><div><strong>Almoxarifado central</strong><small>Ambiente de demonstração</small></div></div>
      <p className="nav-label">PRINCIPAL</p>
      <nav aria-label="Menu principal">{navigation.map(([label, icon], i) => <React.Fragment key={label}>{label === 'Identificação e movimentações' && <p className="nav-label operations-label">MOVIMENTAÇÕES</p>}{label === 'Indicadores' && <p className="nav-label operations-label">ACOMPANHAMENTO</p>}<button className={`nav-item ${page === label ? 'active' : ''} `} onClick={() => label === 'Nova mobilização' ? createPlan() : go(label)} aria-label={label} aria-current={page === label ? 'page' : undefined}><Icon name={icon} /><span>{label}</span>{page === label && <span className="active-dot" />}</button></React.Fragment>)}</nav>
      <div className="sidebar-bottom"><div className="prototype-note"><Icon name="layers" /><div><strong>Planejar para mobilizar.</strong><p>Mais visibilidade em cada etapa da sua obra.</p></div></div><div className="profile"><span className="avatar">LM</span><div><strong>{user.name}</strong><small>{user.role}</small></div></div><button className="button secondary logout-button" onClick={() => withDraftGuard(onLogout)}>Sair do sistema</button></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Icon name="menu" /></button><span>Gestão de materiais</span><span className="breadcrumb-divider">/</span><strong>{page}</strong></div><div className="topbar-actions"><span className="environment"><span />Protótipo com dados fictícios</span><button className="button secondary" onClick={createPlan}>+ Nova mobilização</button></div></header>
      <main id="main-content"><div className="page-heading"><div><div className="eyebrow">{page === 'Nova mobilização' ? 'PLANEJAMENTO DE OBRA' : 'GESTÃO E ACOMPANHAMENTO'}</div><h1 ref={headingRef} tabIndex={-1}>{page === 'Nova mobilização' && mobilizationId ? 'Planejar mobilização' : page}</h1><p>{titleDescriptions[page]}</p></div>{page === 'Nova mobilização' ? <span className="draft-label"><span />{saved ? `${mobilizationId || 'Planejamento'} · Salvo` : 'Alterações não salvas'}</span> : demo}</div>

      {page === 'Mobilizações' && <Mobilizations records={mobilizations} materials={materials} onCreate={createPlan} onEdit={editMobilization} onStatus={updateStatus} go={go} />}
      <RfidWorkspace page={page} go={go} />
      {page === 'Nova mobilização' && <>
        <div className="planning-toolbar"><button className="text-button" onClick={() => go('Mobilizações')}>← Todas as mobilizações</button><span>{mobilizationId || 'Nova mobilização'} · {plan.items.length} tipos de materiais</span></div>
        <div className="planning-layout"><div className="planning-main"><section className="card"><div className="section-heading"><div className="section-title"><span className="step">01</span><h2>Dados da mobilização</h2></div><span className="subtle">Todos os campos são obrigatórios</span></div><form ref={formRef} className="planning-form" onSubmit={e => e.preventDefault()}><label className="full">Obra / projeto<input value={plan.work} onChange={e => edit({ work: e.target.value })} required pattern=".*\S.*" placeholder="Nome da obra ou projeto" /></label><label>Data de início<input type="date" value={plan.start} onChange={e => edit({ start: e.target.value })} required /></label><label>Retorno previsto<input type="date" min={plan.start} value={plan.end} onChange={e => edit({ end: e.target.value })} required /></label><label className="full">Responsável<input value={plan.responsible} onChange={e => edit({ responsible: e.target.value })} required pattern=".*\S.*" placeholder="Nome do responsável" /></label></form></section>
        <section className="card materials-card"><div className="section-heading"><div className="section-title"><span className="step">02</span><h2>Materiais necessários <span className="count">{rows.length}</span></h2></div><button className="button secondary small" onClick={() => { setAddQuery(''); setModal({ type: 'add' }); }}><Icon name="plus" size={16} />Adicionar material</button></div><div className={`table-scroll ${validated ? 'validated-plan' : 'pending-plan'}`}><table className="planning-table"><thead><tr><th>Material</th><th>Necessário</th><th>Livre agora</th><th>Em outro contrato</th><th>Retorno previsto</th><th>Falta agora</th><th>Avaliação</th><th /></tr></thead><tbody>{rows.map(m => <tr key={m.id}><td><button className="material-link" onClick={() => setModal({ type: 'detail', material: m })}>{m.name}</button><small>{m.id} <span className="dot-separator">·</span> {m.category}</small></td><td><div className="quantity"><input aria-label={`Quantidade necessária de ${m.name}`} type="number" min="0" step={m.unit === 'm' ? '0.01' : '1'} value={m.needed} onChange={e => { const value = Number(e.target.value); if (Number.isFinite(value) && value >= 0) edit({ items: plan.items.map(i => i.id === m.id ? { ...i, needed: m.unit === 'un' ? Math.floor(value) : Math.round(value * 100) / 100 } : i) }); }} /><span>{m.unit}</span></div></td><td><span className="free-value">{amount(m.free)} <small>{m.unit}</small></span></td><td>{m.field} {m.unit}</td><td>{date(m.returnDate)}</td><td><span className={`pill ${m.needed > m.free ? 'orange' : 'green'}`}>{m.needed > m.free && <span className="tiny-dot" />}{amount(Math.max(0, Math.round((m.needed - m.free) * 100) / 100))} {m.unit}</span></td><td><span className="pill neutral">{m.category === 'Cabos' ? 'Web Supply-PMA' : 'Compra direta'} · avaliar</span></td><td><button className="icon-button delete" aria-label={`Remover ${m.name}`} onClick={() => edit({ items: plan.items.filter(i => i.id !== m.id) })}><Icon name="trash" size={16} /></button></td></tr>)}</tbody></table>{!rows.length && <div className="empty">Adicione materiais para começar seu planejamento.</div>}</div><div className="table-note"><Icon name="clock" size={16} /><span>A disponibilidade considera apenas os materiais <strong>livres agora.</strong></span></div></section>
        <div className="info-banner"><span className="info-circle">i</span><div><strong>Previsão de retorno não é disponibilidade confirmada.</strong><p>Materiais em campo precisam retornar e passar pela triagem antes de ficarem livres. Classes simuladas: Cabos → Web Supply-PMA; demais → Compra direta, somente para avaliação. Nenhuma compra é realizada.</p></div></div>
        <div className="planning-validation"><label className="checkbox-label"><input type="checkbox" checked={validated} onChange={e => setValidated(e.target.checked)} />Confirmo que revisei os materiais e as quantidades</label><p>{validated ? 'Lista validada. Consulte saldos, previsões e faltas abaixo.' : 'Revise os materiais e valide a lista para consultar a disponibilidade e salvar.'}</p></div><div className="planning-actions"><span><Icon name="save" size={16} />{saved ? 'Planejamento salvo neste navegador' : 'Salve para incluir na lista de mobilizações'}</span><button className="button primary" onClick={save}><Icon name="save" size={18} />Salvar planejamento</button></div>
        </div><aside className="right-panel"><section className="card inventory-summary"><div className="section-heading"><h2>Cenário de planejamento</h2><Icon name="box" /></div>{demo}<div className="summary-total"><strong>{materials.length.toString().padStart(2, '0')}</strong><span>classes de materiais<br />no cenário fictício</span></div><div className="stock-stat"><span><span className="tiny-dot green-dot" />Livres · unidades</span><strong>{amount(totals('un'))} <small>un</small></strong></div><div className="stock-stat"><span><span className="tiny-dot green-dot" />Livres · cabos</span><strong>{amount(totals('m'))} <small>m</small></strong></div><button className="text-button summary-link" onClick={() => go('Inventário')}>Consultar equipamentos<Icon name="arrow" size={17} /></button></section>
        <section className="card alerts-card"><div className="section-heading"><h2><Icon name="alert" size={18} />Pontos de atenção</h2><span className="count alert-count">{shortages.length}</span></div>{shortages.length ? shortages.map(m => <div className="alert-item" key={m.id}><span className="alert-dot" /><div><strong>{m.name}</strong><p>Faltam <b>{amount(Math.round((m.needed - m.free) * 100) / 100)} {m.unit}</b> para esta mobilização.</p>{m.field > 0 && <small>{m.field} {m.unit} em campo · retorno {date(m.returnDate)}{m.returnDate > plan.start && <em>Após o início da obra</em>}</small>}</div></div>) : <div className="success-note">Todos os materiais selecionados têm saldo livre suficiente.</div>}<div className="alert-footer">Revise as faltas antes de mobilizar.</div></section>
        <div className="how-it-works"><span className="eyebrow">COMO LER O PLANEJAMENTO</span><p><span className="legend-dot green-dot" /><strong>Livre agora</strong>Disponível no almoxarifado</p><p><span className="legend-dot orange-dot" /><strong>Falta agora</strong>Necessário menos saldo livre</p></div></aside></div>
      </>}

      {page === 'Indicadores' && <><div className="metric-grid">{[[materials.length, 'Tipos de materiais', 'box'], [`${amount(totals('un'))} un`, 'Unidades livres agora', 'check'], [`${amount(totals('m'))} m`, 'Metros de cabo livres', 'layers'], [shortages.length, 'Itens com falta no plano', 'alert']].map(([value, label, icon]) => <section className="card metric" key={label}><div><Icon name={icon} />{demo}</div><strong>{value}</strong><p>{label}</p></section>)}</div><div className="overview-grid"><section className="card"><div className="section-heading"><h2>{page === 'Indicadores' ? 'Disponibilidade por classe · cenário fictício' : 'Disponibilidade do almoxarifado'}</h2></div><div className="bar-list">{materials.map(m => <div className="bar-row" key={m.id}><div><button className="material-link" onClick={() => setModal({ type: 'detail', material: m })}>{m.name}</button><span>{m.free} {m.unit} livres / {m.free + m.field} {m.unit} no total</span></div><div className="bar-track"><span style={{ width: `${m.free + m.field ? m.free / (m.free + m.field) * 100 : 0}%` }} /></div></div>)}</div><div className="table-note">Cenário agregado de planejamento (CAT). As fichas individuais (MAT) são demonstradas separadamente. Quantidades não somam unidades distintas.</div></section><section className="card plan-preview"><span className="eyebrow">PLANEJAMENTO ATUAL</span><Icon name="layers" size={35} /><h2>{plan.work || 'Mobilização sem título'}</h2><p>{date(plan.start)} → {date(plan.end)}</p><div className="preview-stat"><span>Materiais no plano</span><strong>{rows.length}</strong></div><div className="preview-stat"><span>Itens com falta</span><strong className="orange-text">{shortages.length}</strong></div><button className="button primary" onClick={() => go('Nova mobilização')}>Abrir planejamento<Icon name="arrow" size={17} /></button></section></div></>}

      <footer className="page-footer"><span>SUPMGAMobiliza <span className="dot-separator">·</span> Uma ficha. A mesma identidade em todo o ciclo.</span><span>Dados de demonstração</span></footer>
      </main>
    </div>
    {toast && <div className="toast" role="status"><Icon name="check" /><span>{toast}</span><button className="icon-button" onClick={() => setToast('')} aria-label="Fechar notificação"><Icon name="close" size={17} /></button></div>}
    {modal?.type === 'unsaved' && <Modal title="Alterações não salvas" onClose={() => setModal(null)}><div className="detail-body"><p className="form-hint">Seu planejamento tem alterações não salvas. Volte para salvar ou descarte as alterações para abrir outro planejamento.</p><div className="form-actions"><button className="button secondary" onClick={() => { setModal(null); go('Nova mobilização'); }}>Voltar ao planejamento</button><button className="button primary" onClick={() => { const action = modal.action; setDirty(false); action(); }}>Descartar e continuar</button></div></div></Modal>}
    {modal?.type === 'detail' && <Modal title="Detalhes do material" onClose={() => setModal(null)}><div className="detail-body"><span className="material-code">{modal.material.id} · {modal.material.category}</span><h3>{modal.material.name}</h3>{demo}<div className="detail-stats"><div><span>Livre agora</span><strong className="free-value">{modal.material.free} {modal.material.unit}</strong></div><div><span>Em campo</span><strong>{modal.material.field} {modal.material.unit}</strong></div></div><dl><div><dt>Localização</dt><dd>{modal.material.location}</dd></div><div><dt>Retorno previsto</dt><dd>{date(modal.material.returnDate)}</dd></div></dl><div className="form-hint">Retorno previsto não é disponibilidade confirmada. O material deve retornar e passar pela triagem.</div><button className="button primary" disabled={plan.items.some(i => i.id === modal.material.id)} onClick={() => addMaterial(modal.material)}><Icon name="plus" size={17} />{plan.items.some(i => i.id === modal.material.id) ? 'Já está no planejamento' : 'Adicionar à mobilização'}</button></div></Modal>}
    {modal?.type === 'add' && <Modal title="Adicionar material" onClose={() => setModal(null)}><div className="add-body"><p className="subtle">Selecione materiais do inventário para sua mobilização.</p><label className="search-input"><Icon name="search" size={18} /><input autoFocus aria-label="Buscar material para adicionar" placeholder="Buscar material..." value={addQuery} onChange={e => setAddQuery(e.target.value)} /></label><div className="add-list">{materials.filter(m => matches(m, addQuery)).map(m => <div className="add-item" key={m.id}><span className="material-icon"><Icon name="box" /></span><div><strong>{m.name}</strong><small>{m.id} · {m.free} {m.unit} livres agora</small></div><button className="button secondary small" disabled={plan.items.some(i => i.id === m.id)} onClick={() => addMaterial(m)}>{plan.items.some(i => i.id === m.id) ? 'Adicionado' : 'Adicionar'}</button></div>)}{!materials.some(m => matches(m, addQuery)) && <div className="empty">Nenhum material encontrado.</div>}</div><div className="form-actions"><button className="button primary" onClick={() => setModal(null)}>Concluir seleção</button></div></div></Modal>}
  </div>;
}

