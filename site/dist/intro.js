(() => {
  const hero = document.querySelector('.hero-intro');
  if (!hero) return;
  const root = document.documentElement;
  const word = hero.querySelector('.intro-word');
  const wordSlot = hero.querySelector('.intro-word-slot');
  const note = hero.querySelector('.intro-note');
  const pointer = matchMedia('(hover:hover) and (pointer:fine) and (min-width:701px)');
  const obstacles = [...hero.querySelectorAll('.intro-title-back,.intro-title-bridge,.intro-title-front,.intro-phrase,.intro-description,.intro-kicker,.intro-footer')];
  const words = ['contexto.','estratégia.','direção.'];
  let index = 0, timer, swapTimer, epoch = 0, inView = true;
  let scrollFrame = 0, noteFrame = 0, visible = false;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  let pointerFrame = 0, mouseX = 0, mouseY = 0, mouseTargetX = 0, mouseTargetY = 0;
  const motion = () => root.classList.contains('motion-active');
  const active = () => motion() && inView && !document.hidden;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

  function fitWord() {
    const range = document.createRange();
    range.selectNodeContents(word);
    wordSlot.style.width = `${Math.ceil(range.getBoundingClientRect().width)+2}px`;
  }

  function stopWords() {
    clearTimeout(timer); clearTimeout(swapTimer); epoch++;
    word.classList.remove('is-changing');
  }
  function queueWord() {
    if (!active()) return;
    const current = epoch;
    timer = setTimeout(() => {
      if (!active() || current !== epoch) return;
      word.classList.add('is-changing');
      swapTimer = setTimeout(() => {
        if (!active() || current !== epoch) return;
        index = (index + 1) % words.length;
        word.textContent = words[index];
        fitWord();
        word.classList.remove('is-changing');
        queueWord();
      }, 180);
    },2800);
  }
  function hideNote() {
    visible = false;
    note.classList.remove('is-visible');
    cancelAnimationFrame(noteFrame);
    noteFrame = 0;
  }
  function drawNote() {
    noteFrame = 0;
    if (!visible || !active()) return;
    const dx = targetX-x, dy = targetY-y;
    x += dx*.2; y += dy*.2;
    note.style.transform = `translate3d(${x}px,${y}px,0) rotate(${clamp(dx*.035,-4,4)}deg)`;
    if (Math.abs(dx)+Math.abs(dy)>.15) noteFrame = requestAnimationFrame(drawNote);
  }
  function drawPointer() {
    pointerFrame = 0;
    const dx = mouseTargetX-mouseX, dy = mouseTargetY-mouseY;
    const settled = Math.abs(dx)+Math.abs(dy)<.05;
    mouseX = settled ? mouseTargetX : mouseX+dx*.1;
    mouseY = settled ? mouseTargetY : mouseY+dy*.1;
    hero.style.setProperty('--intro-mouse-x',`${mouseX}px`);
    hero.style.setProperty('--intro-mouse-y',`${mouseY}px`);
    if (!settled && active()) pointerFrame = requestAnimationFrame(drawPointer);
  }
  function resetPointer() {
    mouseTargetX = mouseTargetY = 0;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    if (!active() || !pointer.matches) mouseX = mouseY = 0;
    drawPointer();
  }
  function drawScroll() {
    scrollFrame = 0;
    const rect = hero.getBoundingClientRect();
    const distance = motion() ? clamp(-rect.top,0,rect.height) : 0;
    const mobile = innerWidth<=700;
    const intensity = mobile ? .5 : 1;
    // Light lingers behind the typography without covering any letter.
    hero.style.setProperty('--intro-bg-y',`${distance*.58*intensity}px`);
    hero.style.setProperty('--intro-type-y',`${distance*.16*intensity}px`);
    hero.style.setProperty('--intro-title-x',`${Math.min(distance*.11,mobile ? 12 : 46)*intensity}px`);
    hero.style.setProperty('--intro-star-turn',`${distance/Math.max(1,rect.height)*20}deg`);
  }
  function scheduleScroll() { if (!scrollFrame && !document.hidden) scrollFrame = requestAnimationFrame(drawScroll); }
  function sync() {
    stopWords(); hideNote();
    if (!active()) resetPointer();
    if (!motion()) {
      word.textContent = words[0]; index = 0; fitWord();
    }
    scheduleScroll(); queueWord();
  }
  hero.addEventListener('pointermove', event => {
    if (!active() || !pointer.matches || event.pointerType !== 'mouse' || event.target.closest('a,button')) { hideNote(); return; }
    mouseTargetX = (event.clientX/innerWidth-.5)*48;
    mouseTargetY = (event.clientY/innerHeight-.5)*32;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
    const width=note.offsetWidth, height=note.offsetHeight;
    const candidates = [[event.clientX+25,event.clientY+23],[event.clientX-width-25,event.clientY+23],[event.clientX+25,event.clientY-height-23],[event.clientX-width-25,event.clientY-height-23]];
    const bounds = obstacles.map(el=>el.getBoundingClientRect());
    const position = candidates.map(([cx,cy])=>[clamp(cx,14,innerWidth-width-18),clamp(cy,115,innerHeight-height-20)]).find(([cx,cy])=>bounds.every(r=>cx+width<r.left-10 || cx>r.right+10 || cy+height<r.top-10 || cy>r.bottom+10));
    if (!position) { hideNote(); return; }
    [targetX,targetY] = position;
    if (!visible) { x=targetX; y=targetY; visible=true; note.classList.add('is-visible'); }
    if (!noteFrame) noteFrame=requestAnimationFrame(drawNote);
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{hideNote();resetPointer();});
  addEventListener('scroll',()=>{hideNote();scheduleScroll();},{passive:true});
  addEventListener('resize',()=>{hideNote();resetPointer();scheduleScroll();fitWord();},{passive:true});
  pointer.addEventListener('change',()=>{hideNote();resetPointer();});
  document.addEventListener('visibilitychange',sync);
  new IntersectionObserver(([entry])=>{const next=entry.intersectionRatio>.15;if(next!==inView){inView=next;sync();}},{threshold:[0,.15]}).observe(hero);
  new MutationObserver(records=>{
    // Lenis also updates root classes during scrolling; react only to a motion-mode change.
    if(records.some(record=>(record.oldValue||'').includes('motion-active')!==motion())) sync();
  }).observe(root,{attributes:true,attributeFilter:['class'],attributeOldValue:true});
  document.fonts.ready.then(fitWord);
  sync();
})();
