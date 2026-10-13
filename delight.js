'use strict';

// Independent experiments. Turn any of these off without changing the article.
(() => {
  const FEATURES = {room: true, bars: true};
  const selection = new URLSearchParams(location.search).get('delight');
  const selected = selection === null ? null : new Set(selection.split(','));
  const enabled = name => selected ? selected.has(name) : FEATURES[name];
  const root = document.documentElement;
  root.dataset.delight = Object.keys(FEATURES).filter(enabled).join(' ');
  const reduced = () => root.dataset.motion === 'reduced';
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const observe = (element, callback, threshold = 0) => {
    if (!('IntersectionObserver' in window)) { callback(true); return null; }
    const observer = new IntersectionObserver(entries => {
      callback(entries[0].isIntersecting && entries[0].intersectionRatio >= threshold);
    }, {threshold});
    observer.observe(element);
    return observer;
  };
  const resets = [];

  // Add a small viewing-angle response without touching the unfolding clock.
  if (enabled('room')) {
    const stage = document.querySelector('#room-stage');
    let x = 0, y = 0, tx = 0, ty = 0, frame = 0, last = 0;
    function tick(stamp) {
      frame = 0;
      if (reduced() || document.hidden) return;
      const dt = last ? Math.min(.05,(stamp-last)/1000) : 0;last = stamp;
      const ease = 1 - Math.exp(-dt * 12);
      x += (tx-x)*ease;y += (ty-y)*ease;
      stage.style.setProperty('--look-x',x.toFixed(3)+'deg');
      stage.style.setProperty('--look-y',y.toFixed(3)+'deg');
      if (Math.abs(tx-x)+Math.abs(ty-y) > .01) frame = requestAnimationFrame(tick);
    }
    function start() {if (!frame && !reduced()) {last=0;frame=requestAnimationFrame(tick);}}
    function reset() {
      cancelAnimationFrame(frame);frame=0;x=y=tx=ty=0;
      stage.style.removeProperty('--look-x');stage.style.removeProperty('--look-y');
    }
    stage.addEventListener('pointermove',event=>{
      if (!finePointer.matches || reduced() || event.pointerType==='touch') return;
      const r=stage.getBoundingClientRect();
      tx=((event.clientX-r.left)/r.width*2-1)*5;
      ty=-((event.clientY-r.top)/r.height*2-1)*4;start();
    },{passive:true});
    stage.addEventListener('pointerleave',()=>{tx=ty=0;start();});
    observe(stage,visible=>{if(!visible)reset();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
    resets.push(()=>{if(reduced())reset();});
  }

  // Reveal the existing bar lengths once. Numerical results always stay visible.
  if (enabled('bars')) {
    const charts=[...document.querySelectorAll('.success-figure,.runtime-figure')];
    charts.forEach(chart=>{
      chart.classList.add('delight-chart');
      [...chart.querySelectorAll('.bar-track>span,.runtime-track>span')].forEach((bar,index)=>{
        bar.style.setProperty('--bar-delay',Math.min(index,5)*65+'ms');
      });
      if(reduced())chart.classList.add('is-revealed');
      let observer=null;
      observer=observe(chart,visible=>{
        if(visible){chart.classList.add('is-revealed');if(observer)observer.disconnect();}
      },.2);
    });
    resets.push(()=>{if(reduced())charts.forEach(chart=>chart.classList.add('is-revealed'));});
  }
  new MutationObserver(()=>resets.forEach(reset=>reset())).observe(root,{attributes:true,attributeFilter:['data-motion']});
})();
