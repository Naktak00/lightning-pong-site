export function predictIntercept(observation,side='player2'){
  const b=observation.ball,p=observation.paddles[side];const targetX=side==='player2'?p.x:b? p.x+p.width:p.x;
  const toward=side==='player2'?b.vx>0:b.vx<0;if(!toward||Math.abs(b.vx)<1)return{reachable:false,y:observation.height/2,time:Infinity,uncertainty:1};
  const time=Math.max(0,(targetX-b.x)/b.vx);let y=b.y+b.vy*time;const span=Math.max(1,observation.height-b.radius*2);let wrapped=((y-b.radius)%(span*2)+span*2)%(span*2);if(wrapped>span)wrapped=span*2-wrapped;y=b.radius+wrapped;
  const complexity=(observation.effects.burn?0.08:0)+(observation.effects.charge?0.12:0)+(observation.effects.portals.length?0.25:0)+(observation.shadows.length?0.22:0);return{reachable:true,y,time,uncertainty:Math.min(1,complexity+Math.hypot(b.vx,b.vy)/2200)};
}

