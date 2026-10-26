(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 701px)');
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#mobile-nav');
  const scene = document.querySelector('.perspective');
  const thoughts = [...document.querySelectorAll('.thought')];
  const hero = document.querySelector('.hero');
  const manifesto = document.querySelector('.manifesto');
  const work = document.querySelector('.work');
  const meta = document.querySelector('.meta-piece');
  const google = document.querySelector('.google-piece');
  const performance = document.querySelector('.performance-piece');
  const automation = document.querySelector('.automation-piece');
  const about = document.querySelector('.about');
  const contact = document.querySelector('.contact');
  const count = document.querySelector('.scene-count');
  let reduced = preference.matches;
  let lenis;
  let frame = 0;
  let active = -1;
  const clamp = value => Math.max(0, Math.min(1, value));
  const progress = element => {
    const rect = element.getBoundingClientRect();
    return clamp((innerHeight - rect.top) / (innerHeight + rect.height));
  };
  function closeMenu() { nav.hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menu +'; }
  menu.addEventListener('click', () => {
    const open = nav.hidden;
    nav.hidden = !open;
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'Fechar −' : 'Menu +';
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !nav.hidden) { closeMenu(); menu.focus(); }
  });
  wide.addEventListener('change', () => { closeMenu(); configure(); });
  document.querySelectorAll('[data-whatsapp]').forEach(link => {
    link.href = 'https://wa.me/5514999051272?text=' + encodeURIComponent('Oi, Iago! Conheci a L0olf e queria trocar uma ideia sobre o meu negócio.');
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      e.preventDefault(); closeMenu();
      history.pushState(null, '', link.hash);
      const focus = () => { target.setAttribute('tabindex', '-1'); target.focus({preventScroll:true}); };
      if (lenis) lenis.scrollTo(target, {offset:0, duration:1.15, onComplete:focus});
      else { target.scrollIntoView({behavior:reduced?'instant':'smooth', block:'start'}); focus(); }
    });
  });
  function setChapter(index) {
    if (index === active) return;
    active = index;
    thoughts.forEach((thought, i) => {
      thought.classList.toggle('active', i === index);
      // Only the desktop pinned composition hides alternate chapters.
      if (!reduced && wide.matches) thought.setAttribute('aria-hidden',String(i !== index));
      else thought.removeAttribute('aria-hidden');
    });
    count.textContent = `0${index + 1} — 03`;
  }
  function draw() {
    frame = 0;
    if (reduced) return;
    const rect = scene.getBoundingClientRect();
    const p = wide.matches ? clamp(-rect.top / Math.max(1,rect.height-innerHeight)) : progress(scene);
    scene.style.setProperty('--scene-p',p);
    scene.style.setProperty('--core-scale',.55 + clamp(p * 2) * .45);
    scene.style.setProperty('--core-turn',`${-30 + p*75}deg`);
    scene.style.setProperty('--orbit-scale',.35 + clamp(p*1.8)*.65);
    scene.style.setProperty('--orbit-turn',`${p*120}deg`);
    scene.style.setProperty('--line-scale',clamp((p-.15)*2));
    setChapter(Math.min(2,Math.floor(p*3)));
    const heroRect = hero.getBoundingClientRect();
    hero.style.setProperty('--hero-p',clamp(-heroRect.top/heroRect.height));
    work.style.setProperty('--star-turn',`${progress(work)*150}deg`);
    meta.style.setProperty('--eye-turn',`${(progress(meta)-.5)*30}deg`);
    meta.style.setProperty('--eye-x',`${(progress(meta)-.5)*35}px`);
    google.style.setProperty('--lens-y',`${(progress(google)-.5)*90}px`);
    performance.style.setProperty('--radar-turn',`${progress(performance)*380}deg`);
    automation.style.setProperty('--wire-offset',1-clamp(progress(automation)*1.65));
    const mp = progress(manifesto);
    manifesto.style.setProperty('--manifesto-p',mp);
    manifesto.style.setProperty('--manifesto-turn',`${mp*140}deg`);
    about.style.setProperty('--name-turn',`${-15+progress(about)*22}deg`);
    contact.style.setProperty('--logo-y',`${(1-progress(contact))*45}px`);
  }
  function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(draw); }
  function configure() {
    reduced = preference.matches;
    lenis?.destroy(); lenis = undefined;
    root.classList.toggle('motion-active',!reduced);
    root.classList.toggle('motion-reduced',reduced);
    if (!reduced && wide.matches && window.Lenis) lenis = new Lenis({autoRaf:true,lerp:.1,smoothWheel:true,syncTouch:false});
    active = -1;
    setChapter(0);
    if (reduced) {
      [scene,hero,work,meta,google,performance,automation,manifesto,about,contact].forEach(el => el.removeAttribute('style'));
    }
    schedule();
  }
  preference.addEventListener('change',configure);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',schedule);
  configure();
})();
