import { COLORS } from '../src/progression/save.js';
import { LEVELS } from '../src/progression/levels.js';
import { purchase, selectPrizedOrb, equipCosmetic, activateOrbLevel, orbLevelSwitchPrice, cosmeticIsUnlocked, backgroundIsUnlocked, SHOP_PRICES } from '../src/progression/shop.js';
import { COSMETICS, PADDLES, BACKGROUNDS, LORE } from '../src/progression/content.js';
import { orbDescriptor } from '../src/orbs/contracts.js';
import { BOSS_LORE as LORE_COLLECTION } from '../src/progression/lore-content.js';
const LORE_TITLES=['TRACE','FRACTURE','ECHO','ASCENSION'];

const ORDER = ['all', 'orbs', 'lives', 'cosmetics', 'backgrounds', 'lore'];
const INTERACTIVE = 'button,input,select,a,[role="button"],.preview-drawer';
const ORB_COLORS = Object.freeze({ red:'#ef3340', orange:'#ff8a24', yellow:'#ffe34f', green:'#3bd878', blue:'#46a8ff', indigo:'#5966e8', purple:'#b768ff' });

export function createShop({ root, getSave, persist, icon, onSpend = () => {} }) {
  const grid = root.querySelector('#shopGrid');
  const controls = root.querySelector('#backgroundControls');
  const drawer = document.querySelector('#previewDrawer');
  const backdrop = document.querySelector('#previewBackdrop');
  const preview = drawer.querySelector('#drawerPreview');
  const stateLabel = drawer.querySelector('#drawerState');
  const title = drawer.querySelector('#drawerTitle');
  const text = drawer.querySelector('#drawerText');
  const actions = drawer.querySelector('#drawerActions');
  let filter = 'all';
  let gesture = null;

  const closePreview = (discard = false) => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.add('hidden');
    if (discard) {
      drawer.classList.add('hidden');
      preview.innerHTML = '';
      actions.innerHTML = '';
    }
  };
  function button(label, action, disabled = false) {
    const element = document.createElement('button');
    element.textContent = label;
    element.disabled = disabled;
    element.onpointerdown = event => event.stopPropagation();
    element.onclick = event => {
      event.stopPropagation();
      const beforePx = getSave().px;
      const result = action();
      if (result?.ok) { onSpend(Math.max(0,beforePx-getSave().px)); persist(); render(); }
      else if (result?.reason && !['preview', 'selected'].includes(result.reason)) element.textContent = result.reason.toUpperCase().replaceAll('-', ' ');
    };
    return element;
  }
  function card(heading, description) {
    const element = document.createElement('article');
    element.className = 'shop-card';
    element.innerHTML = `<h3>${heading}</h3><p>${description}</p>`;
    grid.append(element);
    return element;
  }
  function openPreview(model) {
    title.textContent = model.title;
    text.textContent = model.text;
    stateLabel.textContent = model.state;
    preview.innerHTML = model.preview;
    actions.innerHTML = '';
    if (model.action) actions.append(button(model.action.label, () => {
      const result = model.action.run();
      if (result.ok) closePreview();
      return result;
    }, model.action.disabled));
    drawer.classList.remove('hidden');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.remove('hidden');
  }
  function showCosmetic(item) {
    const save = getSave();
    if (!cosmeticIsUnlocked(save, item)) return;
    const owned = save.purchasedCosmetics.includes(item.id) || save.earnedCosmetics.includes(item.id);
    const isPaddle = item.id.startsWith('paddle-');
    openPreview({
      title: item.name,
      text: 'Shown at gameplay scale. Cosmetic only; collision geometry never changes.',
      state: owned ? 'OWNED' : `${item.price} PX`,
      preview: isPaddle
        ? `<div class="preview-arena"><div class="preview-paddle" style="background:${item.color};color:${item.color}"></div><div class="preview-ball"></div></div>`
        : `<div class="preview-arena"><div class="preview-game-paddle"></div><div class="preview-game-hat" style="background:${item.color};color:${item.color}"></div><div class="preview-ball"></div></div>`,
      action: { label: owned ? (save.equippedCosmetic === item.id ? 'UNEQUIP' : 'EQUIP') : `${item.price} PX · PURCHASE`, disabled: !owned && save.px < item.price, run: () => owned ? equipCosmetic(save, save.equippedCosmetic === item.id ? null : item.id) : purchase(save, { type: 'cosmetic', id: item.id }) }
    });
  }
  function showBackground(item) {
    const save = getSave();
    if (!backgroundIsUnlocked(save, item)) return;
    const owned = save.purchasedBackgrounds.includes(item.id);
    openPreview({
      title: item.name,
      text: 'Live arena preview with protected paddle, orb, and center-line contrast.',
      state: owned ? 'OWNED' : `${item.price} PX`,
      preview: `<div class="preview-arena background-${item.id}"><div class="preview-center"></div><div class="preview-left-paddle"></div><div class="preview-right-paddle"></div><div class="preview-ball"></div></div>`,
      action: owned ? null : { label: `${item.price} PX · PURCHASE`, disabled: save.px < item.price, run: () => purchase(save, { type: 'background', id: item.id }) }
    });
  }
  function orbText(color, level) {
    return ({red:['','Rebound reverses with uncertainty.','Ricochet steadies the reflection.','Bank Shot biases useful banks.'],orange:['','Orange heat.','Adds red heat.','Adds blue Burnout.'],yellow:['','Six hits; 1.5s stun.','Six hits; 2.0s stun.','Six hits; 2.5s stun.','Six hits; 2.75s stun.','Six hits; 3.0s stun.'],green:['','Five-second Return.','Mirror programs position.','Attraction adds curvature.'],blue:['','Adds 25% velocity.','Adds 50% velocity.','Adds 75% velocity.'],indigo:['','One Wormhole pair.','Two simultaneous pairs.','Expanded Gravity Well.'],purple:['','Hollow Decoy.','Mimics carried effects.','Switches at crossover.']}[color]?.[level] ?? 'Advanced level remains sealed pending playtest evidence.');
  }
  function showOrb(color, level, owned, active) {
    const save = getSave(), descriptor = orbDescriptor(color), locked = level > owned;
    const cost = locked ? SHOP_PRICES[`orb${level}`] : orbLevelSwitchPrice(level);
    const canBuy = level === owned + 1 && (level < 4 || save.clearedLevels.includes(10));
    openPreview({ title: `${descriptor.icon} ${descriptor.name} · Level ${level}`, text: orbText(color, level), state: level === active ? 'ACTIVE' : locked ? 'LOCKED' : 'UNLOCKED', preview: `<div class="orb-preview">${descriptor.icon}<strong>LV${level}</strong></div>`, action: level === active || level > owned + 1 ? null : { label: locked ? `${cost} PX · UNLOCK` : `${cost} PX · ACTIVATE`, disabled: save.px < cost || (locked && !canBuy), run: () => locked ? purchase(save, { type: 'orb', color, level }) : activateOrbLevel(save, color, level) } });
  }
  function showLife(level) {
    const save = getSave(), owned = save.maximumLives >= level, next = level === save.maximumLives + 1;
    openPreview({ title: `♥ Maximum Lives · ${level}`, text: level === 3 ? 'Starting maximum lives.' : `Permanently raise Player 1 maximum lives to ${level}.`, state: owned ? 'UNLOCKED' : next ? 'NEXT UPGRADE' : 'LOCKED', preview: `<div class="orb-preview">♥<strong>${level} LIVES</strong></div>`, action: owned || !next ? null : { label: `${SHOP_PRICES[`life${level}`]} PX · UNLOCK`, disabled: save.px < SHOP_PRICES[`life${level}`], run: () => purchase(save, { type: 'life', level }) } });
  }
  function loreVisible(save,entry){if(entry.level>3)return false;if(entry.id==='shadow-box')return save.level1Layers.shadowDiscovered;if(entry.id==='mirror-arena')return save.level1Layers.mirrorDiscovered;return entry.level===1||save.clearedLevels.includes(entry.level-1)}
  function loreFragment(entry,tier){return[entry.segments.trace,entry.segments.fracture,entry.segments.echo,entry.segments.ascension][tier-1]??''}
  function showLore(entry,tier,owned){const save=getSave(),id=entry.id,current=save.loreResonance[id]??0,locked=tier>current,next=tier===current+1,price=SHOP_PRICES[`lore${tier}`],complete=tier===4&&tier<=current,text=tier===1?`${entry.battleInsight}\n\n${loreFragment(entry,tier)}`:complete?Object.values(entry.segments).join('\n\n'):loreFragment(entry,tier);openPreview({title:`${entry.name} // ${LORE_TITLES[tier-1]}`,text,state:tier<=current?'UNLOCKED':next?'NEXT RESONANCE':'LOCKED',preview:`<div class="orb-preview"><strong>${tier}/4</strong></div>`,action:!next||tier<=current?null:{label:`${price} PX · UNLOCK`,disabled:save.px<price,run:()=>purchase(save,{type:'lore',id,level:entry.level,tier})}})}
  function selectBackground(item) {
    const save = getSave(), selected = save.selectedBackgrounds.includes(item.id);
    if (save.backgroundMode === 'single') save.activeBackground = item.id;
    else { save.selectedBackgrounds = selected ? save.selectedBackgrounds.filter(id => id !== item.id) : [...save.selectedBackgrounds, item.id]; if (!save.selectedBackgrounds.length) save.selectedBackgrounds = ['default']; }
    persist(); render();
  }
  function render() {
    const save = getSave(), visible = kind => filter === 'all' || filter === kind;
    grid.innerHTML = '';
    root.querySelectorAll('[data-shop]').forEach(item => item.classList.toggle('selected', item.dataset.shop === filter));
    controls.classList.toggle('hidden', filter !== 'backgrounds');
    root.querySelectorAll('[data-bg-mode]').forEach(item => item.classList.toggle('selected', item.dataset.bgMode === save.backgroundMode));
    if (filter === 'all') { const item = card('👑 PRIZED ORB', 'Guarantee one crowned unlocked orb in every randomized normal pool.'); item.classList.add('prized'); if (!save.prizedOrbPurchased) item.append(button(`${SHOP_PRICES.prizedOrb} PX`, () => purchase(save, { type: 'prized' }))); else { const status=document.createElement('small');status.className='selection-status';status.textContent=save.prizedOrb?`${icon(save.prizedOrb)} ${save.prizedOrb.toUpperCase()} SELECTED`:'NO ORB SELECTED';item.append(status); for (const color of save.unlockedColors) { const selected=save.prizedOrb===color, choice=button(`${icon(color)} ${selected?'SELECTED':'SELECT'}`, () => selectPrizedOrb(save, selected ? null : color)); choice.classList.toggle('selected',selected); item.append(choice); } } }
    if (visible('lives')) { const item = card('♥ MAXIMUM LIVES', `Current maximum: ${save.maximumLives}.`), track = document.createElement('div'); track.className = 'mastery-track lives-track'; for (let level = 3; level <= 5; level++) { const past = level < save.maximumLives, active = level === save.maximumLives, next = level === save.maximumLives + 1, choice = document.createElement('button'); choice.textContent = past ? `✓${level}` : `♥${level}`; choice.className = level <= save.maximumLives ? 'owned' : 'locked'; choice.classList.toggle('past-level', past); choice.classList.toggle('active', active); choice.classList.toggle('next-unlock', next); choice.setAttribute('aria-label', past ? `${level} lives unlocked` : active ? `${level} lives current maximum` : next ? `${level} lives next upgrade` : `${level} lives locked`); choice.onclick = () => showLife(level); track.append(choice); } item.append(track); }
    if (visible('orbs')) { const unlockedColors = COLORS.filter(color => save.unlockedColors.includes(color)); if (!unlockedColors.length) card('ORB MASTERY', 'Take a Crown in battle to reveal its orb mastery path.'); for (const color of unlockedColors) { const owned = save.orbMastery[color] ?? 1, active = save.activeOrbMastery[color] ?? owned, descriptor = orbDescriptor(color), item = card(`<span>${descriptor.icon} ${descriptor.name.toUpperCase()} MASTERY</span><i class="orb-id-dot" style="--orb-color:${ORB_COLORS[color]}" title="${descriptor.name}" aria-label="${descriptor.name} orb"></i>`, `Purchased Lv${owned} · Active Lv${active}`), track = document.createElement('div'); track.className = 'mastery-track'; for (let level = 1; level <= 5; level++) { const past = level <= owned && level !== active, next = level === owned + 1 && (level < 4 || save.clearedLevels.includes(10)), choice = document.createElement('button'); choice.textContent = past ? `✓${level}` : `${descriptor.icon}${level}`; choice.className = level <= owned ? 'owned' : 'locked'; choice.classList.toggle('past-level', past); choice.classList.toggle('active', level === active); choice.classList.toggle('next-unlock', next); choice.setAttribute('aria-label', past ? `${descriptor.name} level ${level} unlocked` : level === active ? `${descriptor.name} level ${level} active` : next ? `${descriptor.name} level ${level} next upgrade` : `${descriptor.name} level ${level} locked`); choice.onclick = () => showOrb(color, level, owned, active); track.append(choice); } item.append(track); } }
    if (visible('backgrounds')) for (const background of BACKGROUNDS) { const owned = save.purchasedBackgrounds.includes(background.id), unlocked=backgroundIsUnlocked(save,background), item = card(unlocked?background.name:'Unrevealed Arena', owned ? 'Owned arena.' : unlocked?'Distinct arena art with protected gameplay contrast.':'Locked. Keep playing to reveal this arena.'), previewButton = button('PREVIEW', () => { showBackground(background); return { ok: false, reason: 'preview' }; },!unlocked); item.classList.add('background-card'); if(!unlocked)item.classList.add('locked-cosmetic');previewButton.classList.add('preview-button'); item.append(previewButton); if (unlocked&&!owned) item.append(button(`${background.price} PX`, () => purchase(save, { type: 'background', id: background.id }))); else if(owned){ const selected = save.selectedBackgrounds.includes(background.id), label = save.backgroundMode === 'single' && save.activeBackground === background.id ? 'ACTIVE' : selected ? 'SELECTED' : 'SELECT'; item.append(button(label, () => { selectBackground(background); return { ok: false, reason: 'selected' }; })); } }
    if (visible('cosmetics')) for (const cosmetic of [...COSMETICS, ...PADDLES]) { const unlocked = cosmeticIsUnlocked(save, cosmetic), owned = save.purchasedCosmetics.includes(cosmetic.id) || save.earnedCosmetics.includes(cosmetic.id), equipped = save.equippedCosmetic === cosmetic.id, item = card(unlocked?(cosmetic.id.startsWith('paddle-') ? `🏓 ${cosmetic.name}` : `🎩 ${cosmetic.name}`):'Unrevealed Cosmetic', unlocked ? 'Purely visual; collision geometry is unchanged.' : 'Locked. Keep playing to reveal it.'), previewButton = button('PREVIEW', () => { showCosmetic(cosmetic); return { ok: false, reason: 'preview' }; }, !unlocked); if (!unlocked) item.classList.add('locked-cosmetic'); item.append(previewButton); if (unlocked && owned) item.append(button(equipped ? 'EQUIPPED' : 'EQUIP', () => equipCosmetic(save, cosmetic.id), equipped)); }
    if(visible('lore'))for(const entry of LORE_COLLECTION.bosses){if(!loreVisible(save,entry))continue;const current=save.loreResonance[entry.id]??0,item=card(`${entry.name.toUpperCase()} // LORE RESONANCE`,current?`Battle Insight unlocked · ${current}/4 fragments resonating`:'Battle Insight and poem fragments await.'),track=document.createElement('div');track.className='mastery-track lore-track';for(let tier=1;tier<=4;tier++){const choice=document.createElement('button');choice.textContent=tier<=current?`✓${tier}`:`${tier}`;choice.className=tier<=current?'owned':'locked';choice.classList.toggle('active',tier===current);choice.classList.toggle('next-unlock',tier===current+1);choice.setAttribute('aria-label',`${entry.name} ${LORE_TITLES[tier-1]}`);choice.onclick=()=>showLore(entry,tier,tier<=current);track.append(choice)}item.append(track)}
  }
  root.querySelectorAll('[data-shop]').forEach(item => item.onclick = () => { filter = item.dataset.shop; closePreview(true); render(); });
  root.querySelectorAll('[data-bg-mode]').forEach(item => item.onclick = () => { getSave().backgroundMode = item.dataset.bgMode; persist(); render(); });
  drawer.querySelector('#closePreview').onclick = closePreview;
  drawer.querySelector('#previewHandle').onclick = () => closePreview();
  backdrop.onclick = () => closePreview();
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && drawer.classList.contains('open')) closePreview(); });
  root.addEventListener('pointerdown', event => { if (event.target.closest(INTERACTIVE) || !event.target.closest('#shopGrid')) return; gesture = { id: event.pointerId, x: event.clientX, y: event.clientY }; });
  root.addEventListener('pointerup', event => { if (!gesture || event.pointerId !== gesture.id) return; if (event.target.closest(INTERACTIVE)) { gesture = null; return; } const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y; gesture = null; if (Math.abs(dx) < 100 || Math.abs(dx) < Math.abs(dy) * 1.8) return; const current = ORDER.indexOf(filter), next = Math.max(0, Math.min(ORDER.length - 1, current + (dx < 0 ? 1 : -1))); if (next !== current) { filter = ORDER[next]; closePreview(true); render(); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  for (const type of ['pointercancel', 'pointerleave']) root.addEventListener(type, () => gesture = null);
  return { render, closePreview };
}
