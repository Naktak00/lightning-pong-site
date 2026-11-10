export const LEVELS = Object.freeze([
  null,
  { id:1,name:'The Wall',signature:'red',lives:3,slots:2,personality:'steady' },
  { id:2,name:'The Rocket',signature:'blue',lives:3,slots:3,personality:'speed' },
  { id:3,name:'The Shepherd',signature:'green',lives:3,slots:3,personality:'position' },
  { id:4,name:'The Trickster',signature:'purple',lives:3,slots:3,personality:'deception' },
  { id:5,name:'The Furnace',signature:'orange',lives:4,slots:3,personality:'burn' },
  { id:6,name:'The Trapper',signature:'yellow',lives:4,slots:4,personality:'count' },
  { id:7,name:'The Traveler',signature:'indigo',lives:4,slots:4,personality:'warp' },
  { id:8,name:'The Phantom',signature:'purple',lives:5,slots:4,personality:'recover' },
  { id:9,name:'The Duelist',signature:'orange',lives:5,slots:5,personality:'combo' },
  { id:10,name:'The Master',signature:null,lives:5,slots:5,personality:'adaptive' },
  { id:11,name:'The Sovereign',signature:'inversion',lives:5,slots:5,personality:'sovereign' },
]);
export const FIXED_POOLS=Object.freeze({1:['red','blue'],2:['red','blue','green'],3:['red','blue','green'],4:['blue','green','purple']});

