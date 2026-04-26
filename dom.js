export const $ = sel => document.querySelector(sel);
export const $$ = sel => [...document.querySelectorAll(sel)];
export function showScreen(id){ for(const s of $$('.screen'))s.classList.remove('active'); $(id).classList.add('active'); }
export function modal(html){ const layer=$('#modalLayer'); layer.innerHTML=`<div class="modal glass">${html}</div>`; layer.classList.add('active'); }
export function closeModal(){ const layer=$('#modalLayer'); layer.classList.remove('active'); layer.innerHTML=''; }
