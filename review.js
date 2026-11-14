(() => {
 const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function load(){
  if(!window.LPAuth?.client){$('#reviewNotice').textContent='Review services are not configured on this build.';return}
  const {data:{session}}=await LPAuth.client.auth.getSession();if(!session){location.replace('account.html');return}
  const {data,error}=await LPAuth.client.rpc('flash_campaign_review');
  if(error){$('#reviewNotice').textContent=error.message;return}
  $('#reviewNotice').textContent='Authorized private review view.';$('#reviewContent').classList.remove('hidden');
  const rows=data||[],runs=rows.filter(x=>x.kind==='run'),promos=rows.filter(x=>x.kind==='promo');
  $('#reviewRuns').innerHTML=runs.length?runs.map(x=>`<div class="review-row"><strong>${esc(x.player_handle||x.contact_email)}</strong><span>${x.detail?.elapsed_ms?(x.detail.elapsed_ms/1000).toFixed(2)+'s':'—'} · ${x.detail?.px_used??0} PX</span><small>${esc(x.contact_email)} · ${x.detail?.eligible?'eligible':'excluded'} · ${esc(x.detail?.verification)}</small></div>`).join(''):'<p>No recorded runs.</p>';
  $('#reviewPromos').innerHTML=promos.length?promos.map(x=>`<div class="review-row"><strong>${esc(x.detail?.username)} · ${esc(x.detail?.platform)}</strong><a href="${esc(x.detail?.url)}" rel="noopener noreferrer" target="_blank">Open video</a><small>${esc(x.contact_email)} · ${esc(x.detail?.status)}</small></div>`).join(''):'<p>No promotional entries.</p>';
 } load();
})();
