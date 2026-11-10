import { defaultTrackForLevel } from '../src/progression/audio-plan.js';

// Procedural fallback remains for levels without an Open Alpha track plan.
const THEMES=[null,{bpm:92,root:48,scale:[0,7,12,7],wave:'triangle'},{bpm:112,root:50,scale:[0,3,7,10,7,3],wave:'square'},{bpm:100,root:45,scale:[0,5,9,12,9,5],wave:'sine'},{bpm:126,root:51,scale:[0,6,3,10,6,1],wave:'square'},{bpm:118,root:41,scale:[0,3,7,8,7,3],wave:'sawtooth'},{bpm:132,root:47,scale:[0,2,7,9,14,9],wave:'triangle'},{bpm:124,root:49,scale:[0,7,11,14,11,7],wave:'sine'},{bpm:108,root:44,scale:[0,1,8,7,3,1],wave:'triangle'},{bpm:142,root:52,scale:[0,4,7,11,14,7],wave:'square'},{bpm:136,root:46,scale:[0,3,5,10,12,5],wave:'sawtooth'},{bpm:152,root:42,scale:[0,1,6,7,13,12,6,1],wave:'square'}];
const verboseUrl=name=>new URL(`./audio/verbose-aac/${name}.m4a`,import.meta.url).href;
const falxUrl=name=>new URL(`./audio/falx/${name}.wav`,import.meta.url).href;
const openAlphaUrl=track=>new URL(track.url,import.meta.url).href;
const VERBOSE_STAGES=[null,'02-katana-calm','03-blue-silk-stance','04-no-small-talk-groove','05-off-duty-pressure','06-slow-burn-drums','07-streetlight-focus','08-trim-the-noise','09-work-mode-quiet','10-locked-wrist-loose-mind','11-ashtray-tempo','13-last-match-last-loop'];
const VERBOSE_SCENES={levels:'01-smoke-check',shop:'12-steel-and-swing',settings:'01-smoke-check'};
const midiHz=note=>440*2**((note-69)/12);

class LightningAudio{
 constructor(){
  this.context=null;this.master=null;this.music=null;this.timer=null;this.step=0;this.nextBeat=0;this.muted=false;this.volume=.62;this.paused=false;this.suspended=false;this.activeMusic=false;this.mode='verbose';this.level=1;this.stageId=null;
  this.verbosePlayer=new Audio;this.verbosePlayer.loop=true;this.verbosePlayer.preload='metadata';
 }
 ensure(){if(this.context)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.context=new AC;this.master=this.context.createGain();this.master.gain.value=this.muted?0:this.volume;this.master.connect(this.context.destination);this.music=this.context.createGain();this.music.gain.value=.16;this.music.connect(this.master)}
 setMode(mode){this.mode=mode==='verbose'?'verbose':'simple'}
 setMuted(v){this.muted=v;this.verbosePlayer.muted=v;if(this.master)this.master.gain.setTargetAtTime(v?0:this.volume,this.context.currentTime,.02)}
 setVolume(v){const value=Number(v);this.volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):.62;this.verbosePlayer.volume=this.volume*.58;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,.02)}
 setPaused(v){
  this.paused=v;
  if(this.music)this.music.gain.setTargetAtTime(v?0:.16,this.context.currentTime,.03);
  if(v)this.verbosePlayer.pause();
  else if(this.verbosePlayer.src)this.verbosePlayer.play().catch(()=>{})
 }
 startStage(level,stageId=null){
  this.stopMusic();this.level=level;this.stageId=stageId;this.activeMusic=true;
  if(window.LIGHTNING_ARCHIVE_DEMO===true){this.playArchiveTrack(level);return}
  if(window.LIGHTNING_PUBLIC_RELEASE===true){this.startProcedural(level);return}
  if(this.mode==='verbose'){this.playVerbose(VERBOSE_STAGES[level]);return}
  const track=defaultTrackForLevel(level,Math.random,stageId);
  if(track){this.playOpenAlpha(track);return}
  this.startProcedural(level);
 }
 restartStage(){this.startStage(this.level,this.stageId)}
 startScene(scene){
  this.stopMusic();this.activeMusic=true;
  if(window.LIGHTNING_ARCHIVE_DEMO===true){this.startProcedural(scene==='shop'?4:1);return}
  if(this.mode==='verbose'){this.playVerbose(VERBOSE_SCENES[scene]??VERBOSE_SCENES.levels);return}
  this.startProcedural(scene==='shop'?4:1);
 }
 startProcedural(level){this.ensure();if(!this.context)return;this.level=level;this.context.resume().catch(()=>{});this.step=0;this.nextBeat=this.context.currentTime+.05;this.timer=setInterval(()=>this.schedule(),50);this.schedule()}
 playVerbose(name){if(!name)return;this.activeMusic=true;this.verbosePlayer.src=verboseUrl(name);this.verbosePlayer.volume=this.volume*.58;this.verbosePlayer.muted=this.muted;this.verbosePlayer.loop=true;if(!this.suspended)this.verbosePlayer.play().catch(()=>{})}
 playFalx(name){if(!name)return;this.activeMusic=true;this.verbosePlayer.src=falxUrl(name);this.verbosePlayer.volume=this.volume*.58;this.verbosePlayer.muted=this.muted;this.verbosePlayer.loop=true;if(!this.suspended)this.verbosePlayer.play().catch(()=>{})}
 playOpenAlpha(track){this.activeMusic=true;this.verbosePlayer.src=openAlphaUrl(track);this.verbosePlayer.volume=this.volume*.58;this.verbosePlayer.muted=this.muted;this.verbosePlayer.loop=true;if(!this.suspended)this.verbosePlayer.play().catch(()=>{})}
 playArchiveTrack(level){this.activeMusic=true;this.verbosePlayer.src=new URL(`./audio/archive/level-${level}.mp3`,import.meta.url).href;this.verbosePlayer.volume=this.volume*.58;this.verbosePlayer.muted=this.muted;this.verbosePlayer.loop=true;if(!this.suspended)this.verbosePlayer.play().catch(()=>{})}
 stopMusic(){this.activeMusic=false;if(this.timer)clearInterval(this.timer);this.timer=null;this.verbosePlayer.pause();this.verbosePlayer.removeAttribute('src');this.verbosePlayer.load()}
 suspend(){if(this.suspended)return;this.suspended=true;this.verbosePlayer.pause();this.context?.suspend().catch(()=>{})}
 resume(){this.suspended=false;this.context?.resume().catch(()=>{});if(this.activeMusic&&!this.paused&&this.verbosePlayer.src)this.verbosePlayer.play().catch(()=>{})}
 unlock(){this.ensure();this.context?.resume().catch(()=>{});if(this.activeMusic&&!this.paused&&this.verbosePlayer.src)this.verbosePlayer.play().catch(()=>{})}
 applyJanus(){}
 schedule(){if(!this.context||this.paused||!this.level)return;const t=THEMES[this.level],beat=60/t.bpm/2;while(this.nextBeat<this.context.currentTime+.18){const note=t.root+t.scale[this.step%t.scale.length];this.tone(midiHz(note),this.nextBeat,beat*.72,t.wave,.042,this.music);if(this.step%4===0)this.tone(midiHz(t.root-12),this.nextBeat,beat*1.8,'sine',.055,this.music);if(this.level>=5&&this.step%2===1)this.noiseTick(this.nextBeat,this.level===11?.018:.011);this.nextBeat+=beat;this.step++}}
 tone(f,at,duration,wave,volume,destination=this.master){const o=this.context.createOscillator(),g=this.context.createGain();o.type=wave;o.frequency.setValueAtTime(f,at);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(destination);o.start(at);o.stop(at+duration+.02)}
 noiseTick(at,volume){const length=Math.max(1,Math.floor(this.context.sampleRate*.025)),buffer=this.context.createBuffer(1,length,this.context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;gain.gain.value=volume;source.connect(gain);gain.connect(this.music);source.start(at)}
 playPhysicsEvents(events){if(this.muted||!events?.length)return;this.ensure();if(!this.context)return;this.context.resume().catch(()=>{});const now=this.context.currentTime;for(const e of events){if(e.type==='wallHit')this.tone(e.wall==='top'?185:155,now,.045,'triangle',.055);if(e.type==='paddleHit'&&e.side==='player1')this.tone(520+Math.abs(e.offset)*170,now,.075,'square',.075);if(e.type==='paddleHit'&&e.side==='player2')this.tone(310+Math.abs(e.offset)*120,now,.085,'sawtooth',.068)}}
}
export const audio=new LightningAudio();
