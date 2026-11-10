export function observeArena(state,{noise=0,rng,revealShadow=false}={}){
  const jitter=()=>noise&&rng?(rng.next()*2-1)*noise:0;
  const shadows=(state.match.temporary.shadows??[]).map(s=>({x:s.x+jitter(),y:s.y+jitter(),vx:s.vx,vy:s.vy,hollow:revealShadow?s.hollow:undefined}));
  return Object.freeze({width:state.width,height:state.height,rally:state.match.rally,ball:{x:state.ball.x+jitter(),y:state.ball.y+jitter(),vx:state.ball.vx,vy:state.ball.vy,radius:state.ball.radius},paddles:{player1:{...state.paddles.player1},player2:{...state.paddles.player2}},lives:{...state.match.lives},orbs:(state.match.temporary.orbs??[]).map(o=>({type:o.type,x:o.x,y:o.y,remaining:o.remaining})),shadows,effects:{burn:state.match.temporary.burn?{...state.match.temporary.burn}:null,charge:state.match.temporary.charge?{...state.match.temporary.charge}:null,magnet:state.match.temporary.magnet?{...state.match.temporary.magnet}:null,portals:(state.match.temporary.portals??[]).map(p=>structuredClone(p))}});
}
