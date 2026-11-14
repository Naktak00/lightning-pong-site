const campaignSlug=new URLSearchParams(location.search).get('campaign');
let serverRun=null;
export const isCampaignMode=()=>campaignSlug==='flash-2026';
export async function beginCampaignRun(){
 if(!isCampaignMode())return{campaign:false};
 const client=window.LPAuth?.client;if(!client)throw new Error('Verified campaign play is not connected on this build.');
 const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Open your Player Passport and sign in before starting a verified run.');
 const {data,error}=await client.rpc('begin_flash_campaign_run',{p_campaign_slug:campaignSlug});if(error)throw error;
 serverRun=Array.isArray(data)?data[0]:data;return{campaign:true,eligible:serverRun?.prize_eligible!==false,reason:serverRun?.reason};
}
export async function completeCampaignRun(result){
 if(!isCampaignMode()||!serverRun?.run_id||!result)return null;
 const {data,error}=await window.LPAuth.client.rpc('complete_flash_campaign_run',{p_run_id:serverRun.run_id,p_elapsed_ms:Math.round(result.activeTimeMs),p_px_used:Math.round(result.pxSpent),p_run_data:{attempts:result.attempts,completedAt:result.completedAt,loadout:result.loadout}});
 if(error)throw error;serverRun=null;return data;
}
