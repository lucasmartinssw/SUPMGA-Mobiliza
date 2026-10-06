import { round, recordReuse } from './sustainability.js';
export const CYCLE_KEY = 'supmgamobiliza-cycle-v2';
export function readCycle() {
  try { const c=JSON.parse(localStorage.getItem(CYCLE_KEY)); if(c?.version===2 && Array.isArray(c.records) && Array.isArray(c.stock) && c.stock.every(m=>m&&typeof m.id==='string'&&['un','m'].includes(m.unit)&&Number.isFinite(m.free)&&m.free>=0)) return c; } catch { /* Use the prior demo records when unavailable. */ }
  return null;
}
export const recovered = review => (review?.recoveries||[]).filter(e=>e.result==='recovered').reduce((sum,e)=>sum+e.quantity,0);
export function stockFor(base, records) {
  return base.map(material=>{
    let free=material.free, field=material.field;
    for(const mob of records) for(const item of mob.items) if(item.id===material.id) {
      if(mob.stockDispatched) { free-=item.needed; if(!item.review) field+=item.needed; }
      if(item.review) {
        free+=item.review.quantities.reusable+recovered(item.review);
        for(const event of item.review.reuses) if(!records.find(m=>m.id===event.targetId)?.stockDispatched) free-=event.quantity;
      }
    }
    return {...material,free:round(free),field:round(field)};
  });
}
export function dispatch(records, id, base, responsible, date) {
  const target=records.find(m=>m.id===id);
  if(!target||target.status!=='Planejada'||target.stockDispatched||!target.items.length) throw Error('Esta mobilização não pode registrar uma nova saída.');
  const stock=stockFor(base,records);
  for(const item of target.items) if(!Number.isFinite(item.needed)||item.needed<=0||!stock.find(m=>m.id===item.id)||stock.find(m=>m.id===item.id).free<item.needed) throw Error(`Estoque insuficiente para ${item.name||item.id}. Registre uma entrada ou ajuste o planejamento.`);
  let updated=records.map(m=>m.id===id?{...m,status:'Em mobilização',stockDispatched:true,dispatchDate:date,history:[...m.history,{action:'Saída registrada no estoque',date,responsible}]}:m);
  for(const item of target.items) {
    let remaining=item.needed;
    for(const source of records) for(const candidate of source.items) {
      if(remaining<=0||candidate.id!==item.id||!candidate.review||source.id===id) continue;
      const current=updated.find(m=>m.id===source.id).items.find(i=>i.id===item.id).review;
      const available=round(current.quantities.reusable+recovered(current)-current.reuses.reduce((sum,e)=>sum+e.quantity,0));
      const quantity=Math.min(available,remaining);
      if(quantity>0){updated=recordReuse(updated,source.id,item.id,{targetId:id,quantity,date,responsible,confirmed:true,automatic:true});remaining=round(remaining-quantity);}
    }
  }
  return updated;
}
