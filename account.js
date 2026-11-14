(() => {
  const $ = s => document.querySelector(s); const auth = window.LPAuth;
  const setNotice = (text, bad=false) => { $('#authNotice').textContent=text; $('#authNotice').classList.toggle('error',bad); };
  const show = (id,on=true) => $(id).classList.toggle('hidden',!on);
  async function refresh(){
    if(!auth?.client){setNotice('Passport sign-in is being connected. The campaign page and local demo remain available.',true); $('#magicLinkForm button').disabled=true; return;}
    const {data:{session}}=await auth.client.auth.getSession(); const user=session?.user;
    show('#signInPanel',!user); for(const id of ['#passportPanel','#campaignPanel','#promoPanel','#activityPanel'])show(id,!!user);
    if(!user){setNotice('Sign in to enter verified prize runs or submit a promotional short.');return;}
    setNotice('Passport online. Your private campaign tools are ready.'); $('#passportEmail').textContent=user.email||'';
    const {data:profile}=await auth.client.from('profiles').select('display_name,account_role').eq('user_id',user.id).maybeSingle();
    $('#passportName').textContent=profile?.display_name||user.user_metadata?.full_name||'Player'; $('#passportRole').textContent=profile?.account_role||'player';
    show('#reviewLink',['developer','reviewer'].includes(profile?.account_role));
    const [{data:runs},{data:subs}]=await Promise.all([auth.client.from('campaign_runs').select('status,elapsed_ms,px_used,prize_eligible,issued_at').order('issued_at',{ascending:false}).limit(10),auth.client.from('promo_submissions').select('platform,platform_username,status,submitted_at').order('submitted_at',{ascending:false}).limit(10)]);
    const rows=[...(runs||[]).map(x=>`<li>Run · ${x.status} · ${x.elapsed_ms?`${(x.elapsed_ms/1000).toFixed(2)}s`:'in progress'} · ${x.px_used??0} PX${x.prize_eligible?' · eligible':' · private'}</li>`),...(subs||[]).map(x=>`<li>${x.platform} · ${x.platform_username} · ${x.status}</li>` )]; $('#passportActivity').innerHTML=rows.length?`<ul class="checklist">${rows.join('')}</ul>`:'<p>No activity yet.</p>';
  }
  $('#magicLinkForm').onsubmit=async e=>{e.preventDefault();const email=$('#emailInput').value.trim();const {error}=await auth.client.auth.signInWithOtp({email,options:{emailRedirectTo:new URL('auth-callback.html',location.href).href}});setNotice(error?error.message:'Check your email for your one-time Passport link.',!!error)};
  $('#googleSignIn').onclick=async()=>{const {error}=await auth.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('auth-callback.html',location.href).href}});if(error)setNotice(error.message,true)};
  $('#signOut').onclick=async()=>{await auth.client.auth.signOut();location.reload()};
  $('#joinCampaignForm').onsubmit=async e=>{e.preventDefault();const age=$('#ageStatus').value;const {error}=await auth.client.rpc('join_flash_campaign',{p_campaign_slug:'flash-2026',p_age_status:age,p_guardian_permission:age==='minor_13_plus'&&$('#guardianConfirm').checked});setNotice(error?error.message:'Campaign entry accepted. Your verified-run door is ready.',!!error)};
  $('#promoForm').onsubmit=async e=>{e.preventDefault();const {error}=await auth.client.rpc('submit_flash_promo',{p_campaign_slug:'flash-2026',p_platform:$('#promoPlatform').value,p_video_url:$('#promoUrl').value.trim(),p_platform_username:$('#promoHandle').value.trim(),p_rights_confirmed:$('#rightsConfirm').checked,p_repost_permission:$('#repostConfirm').checked});setNotice(error?error.message:'Promotional short received for private review.',!!error);if(!error){e.target.reset();refresh()}};
  if(auth?.client)auth.client.auth.onAuthStateChange(()=>refresh()); refresh();
})();
