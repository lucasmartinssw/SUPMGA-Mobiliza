import React, { useEffect, useRef, useState } from 'react';
import { disposalTypes } from './Disposal.jsx';
const choices = [
  ['Apto', 'Pronto para reutilizar', 'Material conferido e em boas condições. Voltará ao estoque livre.', '✓'],
  ['Manutenção', 'Precisa de manutenção', 'Pode ser recuperado. Fica indisponível enquanto aguarda manutenção.', '↻'],
  ['Danificado', 'Precisa de avaliação', 'Há danos, mas a recuperação ainda precisa ser avaliada.', '?'],
  ['Não reutilizável', 'Encaminhar para destinação', 'Sem condição de reuso. Escolha o tipo e consulte os locais sugeridos.', '→'],
  ['Perdido', 'Não foi localizado', 'Registra a ocorrência e mantém o material fora do estoque livre.', '!'],
];
const date = () => new Date().toLocaleDateString('en-CA');
function TaskDialog({ title, close, children }) {
  const ref = useRef(null);
  useEffect(() => { const previous = document.activeElement; const dialog = ref.current; dialog.showModal(); return () => { dialog.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} className="modal triage-dialog" aria-label={title} onCancel={close}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="Fechar triagem" onClick={close}>✕</button></div>{children}</dialog>;
}
export default function TriageWorkspace({ equipment, onTriage, onReturn, onOpen }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('triagem');
  const [selected, setSelected] = useState(null);
  const [condition, setCondition] = useState('');
  const [type, setType] = useState('');
  const [step, setStep] = useState(1);
  const [responsible, setResponsible] = useState('Lucas Martins');
  const [when, setWhen] = useState(date);
  const [location, setLocation] = useState('Galpão central · Recebimento');
  const [checked, setChecked] = useState(false);
  const [feedback, setFeedback] = useState('');
  const pending = equipment.filter(m => m.status === 'Aguardando triagem');
  const field = equipment.filter(m => m.status === 'Em contrato');
  const list = (tab === 'triagem' ? pending : field).filter(m => [m.descricao, m.idInterno, m.codigoEtiquetaAtual, m.contratoAtual].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  const material = equipment.find(m => m.idInterno === selected);
  const returning = material?.status === 'Em contrato';
  function start(m) { setSelected(m.idInterno); setCondition(''); setType(''); setStep(1); setChecked(false); setFeedback(''); setWhen(date()); }
  function save(event) {
    event.preventDefault();
    if (!responsible.trim() || !when || !checked) return;
    if (returning) {
      if (!location.trim() || !onReturn(material, { data: when, responsavel: responsible.trim(), destino: location.trim() })) return;
      setTab('triagem'); setStep(1); setCondition(''); setChecked(false); setFeedback('Retorno registrado. Agora confira a condição do material.');
    } else {
      if (!condition || (condition === 'Não reutilizável' && !type)) return;
      if (!onTriage(material, { condicao: condition, tipoDescarte: type, data: when, responsavel: responsible.trim() })) return;
      setSelected(null); setFeedback(condition === 'Apto' ? `${material.idInterno} liberado para reutilização no estoque.` : `${material.idInterno}: conferência registrada. ${choices.find(c => c[0] === condition)[2]}`);
    }
  }
  return <section className="triage-workspace"><div className="triage-intro"><div><span className="eyebrow">DO RETORNO AO PRÓXIMO USO</span><h2>Confira o material e escolha o próximo passo.</h2><p>Registre o recebimento, avalie a condição e confirme o resultado.</p></div><div className="triage-steps"><span>1 · Receber</span><span>2 · Avaliar</span><span>3 · Confirmar</span></div></div>{feedback && !material && <p className="rfid-feedback" role="status">{feedback}</p>}<section className="card"><div className="triage-tabs" role="group" aria-label="Etapa de retorno"><button aria-pressed={tab === 'triagem'} onClick={() => { setTab('triagem'); setQuery(''); }}>Aguardando triagem <span className="count">{pending.length}</span></button><button aria-pressed={tab === 'retorno'} onClick={() => { setTab('retorno'); setQuery(''); }}>Registrar retorno <span className="count">{field.length}</span></button></div><div className="filters"><label className="search-input"><input aria-label="Buscar material para triagem" value={query} onChange={e => setQuery(e.target.value)} placeholder="Busque por material, número interno ou etiqueta" /></label></div><div className="triage-list">{list.map(m => <article className="triage-row" key={m.idInterno}><div className="triage-symbol" aria-hidden="true">{tab === 'triagem' ? '✓' : '↩'}</div><div><h3>{m.descricao}</h3><p>{m.idInterno} · Etiqueta {m.codigoEtiquetaAtual || 'não informada'}</p><small>{m.localizacao}{m.contratoAtual && ` · ${m.contratoAtual}`}</small></div><button className="button primary" onClick={() => start(m)}>{tab === 'triagem' ? 'Iniciar triagem' : 'Registrar retorno'}<span className="sr-only"> de {m.idInterno}</span> →</button></article>)}{!list.length && <div className="empty"><h3>{query ? 'Nenhum material encontrado' : tab === 'triagem' ? 'Nenhuma triagem pendente' : 'Nenhum material em contrato'}</h3><p>{query ? 'Tente outro nome ou código.' : tab === 'triagem' ? 'Materiais recebidos aparecem aqui. Para receber um item de campo, abra Registrar retorno.' : 'Os materiais enviados para contratos aparecerão nesta lista.'}</p>{tab === 'triagem' && !query && <button className="button secondary" onClick={() => setTab('retorno')}>Registrar um retorno</button>}</div>}</div></section><p className="triage-help">Somente materiais conferidos como aptos voltam ao estoque livre. Todos os resultados preservam a ficha e o histórico.</p>
    {material && <TaskDialog title={returning ? 'Registrar recebimento' : 'Triagem do material'} close={() => setSelected(null)}><div className="triage-task"><div className="triage-material"><span className="eyebrow">{material.idInterno} · {material.codigoEtiquetaAtual}</span><h3>{material.descricao}</h3><p>{material.localizacao}</p><button type="button" className="text-button" onClick={() => { setSelected(null); onOpen(material); }}>Consultar ficha e histórico</button></div>{feedback && <p className="rfid-feedback" role="status">{feedback}</p>}{returning ? <form onSubmit={save}><h3>Confirme o recebimento físico</h3><p className="triage-help">O material ficará aguardando triagem e ainda não estará livre para uso.</p><label>Local de recebimento<input value={location} onChange={e => setLocation(e.target.value)} required pattern=".*\S.*" /></label><label>Responsável pelo recebimento<input value={responsible} onChange={e => setResponsible(e.target.value)} required pattern=".*\S.*" /></label><label>Data do retorno<input type="date" value={when} onChange={e => setWhen(e.target.value)} required /></label><label className="checkbox-label"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} required />Confirmo o recebimento demonstrativo deste material.</label><button className="button primary">Registrar e iniciar triagem</button></form> : <><div className="triage-progress" aria-label={`Etapa ${step} de 2`}><span className={step === 1 ? 'current' : ''}>1 · Avaliar condição</span><span className={step === 2 ? 'current' : ''}>2 · Confirmar resultado</span></div>{step === 1 ? <form onSubmit={e => { e.preventDefault(); if (condition && (condition !== 'Não reutilizável' || type)) { setStep(2); setChecked(false); } }}><fieldset className="triage-choices"><legend>Qual é a condição do material?</legend>{choices.map(([value, title, description, symbol]) => <label className={`triage-choice ${condition === value ? 'selected' : ''}`} key={value}><input type="radio" name="condicao" required checked={condition === value} onChange={() => { setCondition(value); setType(''); }} value={value} /><span className="choice-symbol" aria-hidden="true">{symbol}</span><div><strong>{title}</strong><p>{description}</p></div></label>)}</fieldset>{condition === 'Não reutilizável' && <label>Tipo de material para destinação<select required value={type} onChange={e => setType(e.target.value)}><option value="">Selecione o tipo</option>{disposalTypes.map(t => <option key={t}>{t}</option>)}</select></label>}<button className="button primary" disabled={!condition || (condition === 'Não reutilizável' && !type)}>Revisar resultado →</button></form> : <form onSubmit={save}><div className="triage-result"><span className="eyebrow">RESULTADO DA CONFERÊNCIA</span><h3>{choices.find(c => c[0] === condition)?.[1]}</h3><p>{choices.find(c => c[0] === condition)?.[2]}</p>{type && <p>Classificação: <strong>{type}</strong></p>}</div><label>Responsável pela triagem<input value={responsible} onChange={e => setResponsible(e.target.value)} required pattern=".*\S.*" /></label><label>Data da conferência<input type="date" value={when} onChange={e => setWhen(e.target.value)} required /></label><label className="checkbox-label"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} required />Confirmo a conferência demonstrativa e o resultado acima.</label><div className="triage-actions"><button type="button" className="button secondary" onClick={() => setStep(1)}>Voltar à avaliação</button><button className="button primary">{condition === 'Não reutilizável' ? 'Confirmar e ver destinos' : condition === 'Apto' ? 'Confirmar e liberar material' : 'Confirmar triagem'}</button></div></form>}</>}</div></TaskDialog>}
  </section>;
}
