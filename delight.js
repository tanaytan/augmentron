'use strict';

// Independent experiments. Turn any of these off without changing the article.
(() => {
  const FEATURES = {hero: true, room: true, bars: true};
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

  // A real frame becomes a point field: the task pixels stay put while the
  // surrounding field changes. This is a decorative sketch, not a generated result.
  const scene = document.querySelector('.hero-scene');
  if (scene && enabled('hero')) {
    const canvas = scene.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const load = src => new Promise((resolve,reject) => {
        const image = new Image();image.onload = () => resolve(image);
        image.onerror = reject;image.src = src;
      });
      const sources = [scene.querySelector('img').src,
        'assets/images/method/towel-578-frame-336-robot-overlay.png',
        'assets/images/method/towel-578-frame-336-task-object-overlay.png'];
      let width=0,height=0,visible=false,frame=0,last=0,phase=0,points=[];
      let pointer=null,hovering=false,strength=0,ripples=[];
      const shades=Array.from({length:32},(_,step)=> {
        const t=step/31;
        return `rgb(${[37,66,49].map((v,i)=>Math.round(v+([130,112,147][i]-v)*t)).join(',')})`;
      });
      function draw() {
        if (!width || !height || !points.length) return;
        ctx.clearRect(0,0,width,height);
        const sx=width/100,sy=height/56;
        points.forEach(p => {
          let x=(p.x+.5)*sx,y=(p.y+.5)*sy;
          if(p.fixed) {
            ctx.globalAlpha=1;ctx.fillStyle=p.color;
          } else {
            const ripple=Math.sin(p.x*.075+p.y*.12-phase*.5);
            const shade=Math.round((ripple+1)*15.5);
            let alpha=.18+p.detail*.32;
            if(pointer && strength) {
              const dx=x-pointer[0],dy=y-pointer[1],d=Math.hypot(dx,dy);
              const reach=Math.min(width*.18,100);
              if(d<reach && d>.1) {
                const falloff=Math.pow(1-d/reach,2)*strength;
                const push=falloff*Math.min(sx*3,16);
                x+=dx/d*push;y+=dy/d*push;alpha+=falloff*.3;
              }
            }
            ripples.forEach(ring=>{
              const dx=x-ring.x,dy=y-ring.y,d=Math.hypot(dx,dy);
              const distance=d-ring.age*width*.45;
              const wave=Math.exp(-distance*distance/650)*(1-ring.age/1.4);
              if(d>.1){x+=dx/d*wave*sx;y+=dy/d*wave*sy;}
              alpha+=wave*.22;
            });
            // Very small breathing motion; protected pixels never participate.
            y+=Math.sin(p.x*.15+phase*.65)*sy*.15;
            ctx.globalAlpha=Math.min(1,alpha);ctx.fillStyle=shades[shade];
          }
          ctx.beginPath();ctx.arc(x,y,Math.max(.6,sx*(p.fixed?.31:.19)),0,Math.PI*2);ctx.fill();
        });
      }
      function tick(stamp) {
        frame=0;
        if(!visible || reduced() || document.hidden || !points.length)return;
        if(last && stamp-last<1000/30){frame=requestAnimationFrame(tick);return;}
        const dt=last?Math.min(.05,(stamp-last)/1000):0;last=stamp;phase+=dt;
        ripples.forEach(ring=>{ring.age+=dt;});ripples=ripples.filter(ring=>ring.age<1.4);
        strength+=((hovering?1:0)-strength)*(1-Math.exp(-dt*10));
        if(!hovering && strength<.002)pointer=null;
        draw();frame=requestAnimationFrame(tick);
      }
      function sync() {
        cancelAnimationFrame(frame);frame=0;last=0;
        if(reduced()){phase=0;pointer=null;hovering=false;strength=0;ripples=[];draw();}
        if(visible&&!reduced()&&!document.hidden&&points.length)frame=requestAnimationFrame(tick);
      }
      function resize() {
        width=canvas.clientWidth;height=canvas.clientHeight;
        const ratio=Math.min(devicePixelRatio||1,2);
        canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
        ctx.setTransform(ratio,0,0,ratio,0,0);draw();sync();
      }
      Promise.all(sources.map(load)).then(images=>{
        const sample=document.createElement('canvas');sample.width=100;sample.height=56;
        const read=sample.getContext('2d',{willReadFrequently:true});
        read.drawImage(images[0],0,0,100,56);
        const original=read.getImageData(0,0,100,56).data;
        read.clearRect(0,0,100,56);images.slice(1).forEach(image=>read.drawImage(image,0,0,100,56));
        const mask=read.getImageData(0,0,100,56).data;
        for(let y=0;y<56;y++)for(let x=0;x<100;x++) {
          const i=(y*100+x)*4;
          const r=original[i],g=original[i+1],b=original[i+2];
          const detail=1-(r*.2126+g*.7152+b*.0722)/255;
          const fixed=mask[i+3]>90;
          const towel=b>r*1.15&&b>g*.98;
          points.push({x,y,fixed,detail,color:towel?'#568ba3':`rgba(25,53,36,${.48+detail*.5})`});
        }
        canvas.hidden=false;scene.querySelector('img').hidden=true;resize();
      }).catch(()=>{ /* Retain the static fallback if a source cannot be loaded. */ });
      scene.addEventListener('pointermove',event=>{
        if(!finePointer.matches || reduced() || event.pointerType==='touch')return;
        const r=canvas.getBoundingClientRect();pointer=[event.clientX-r.left,event.clientY-r.top];hovering=true;
      },{passive:true});
      scene.addEventListener('pointerleave',()=>{hovering=false;});
      scene.addEventListener('click',event=>{
        if(reduced())return;
        const r=canvas.getBoundingClientRect();
        ripples.push({x:event.clientX-r.left,y:event.clientY-r.top,age:0});
        ripples=ripples.slice(-3);
      });
      observe(scene,value=>{visible=value;sync();});
      if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);
      else window.addEventListener('resize',resize);
      document.addEventListener('visibilitychange',sync);
      resets.push(sync);
    }
  } else if(scene)scene.hidden=true;

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
