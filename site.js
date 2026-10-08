'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const recipes = [
  {id:'real',name:'Real only',steps:'30k',volume:'1×',values:[[86,68,46],[16,26,12],[78,54,20]],pooled:[66.7,18,50.7]},
  {id:'half',name:'Augmentron 50/50',steps:'30k',volume:'1×',values:[[72,88,70],[52,52,32],[80,94,28]],pooled:[76.7,45.3,67.3]},
  {id:'exploratory',name:'Augmentron 33/67 (exploratory)',steps:'30k',volume:'3×',values:[[80,80,44],[76,64,12],[62,88,26]],pooled:[68,50.7,58.7]},
  {id:'full',name:'Augmentron 33/67',steps:'45k',volume:'3×',values:[[82,72,60],[74,80,44],[70,84,28]],pooled:[71.3,66,60.7]},
  {id:'robo',name:'RoboEngine',steps:'45k',volume:'2×',values:[[70,82,20],[60,86,14],[78,40,6]],pooled:[57.3,53.3,41.3]},
  {id:'noise',name:'Masked Noise',steps:'45k',volume:'2×',values:[[86,94,26],[62,88,6],[62,76,6]],pooled:[68.7,52,48]}
];

const taskNames = {cup:'Cup on saucer',towel:'Fold a towel',vase:'Flower in vase'};
$('#all-results-body').innerHTML = recipes.map(r => ['cup','towel','vase','pooled'].map((task,i) => `<tr><td>${r.steps}</td><td>${r.name}</td><td>${r.volume}</td><td>${i===3?'Pooled':taskNames[task]}</td>${[0,1,2].map(c=>`<td>${i===3?r.pooled[c].toFixed(1):r.values[c][i]}</td>`).join('')}</tr>`).join('')).join('');

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionReduced = motionPreference.matches;
const expansion = $('#expansion-stage');
let expansionTimers = [];
let expansionStarted = false;
function clearExpansion() { expansionTimers.forEach(clearTimeout);expansionTimers=[]; }
function setExpansionStep(step) {
  expansion.dataset.step=String(step);
  $('#expansion-status').textContent = step===1?'1 augmented example':step*step+' augmented examples';
}
function replayExpansion() {
  clearExpansion();
  expansionStarted = true;
  if (motionReduced) { setExpansionStep(7);return; }
  setExpansionStep(1);
  // Hold the first example before revealing successive square rings.
  [[1500,3],[3500,5],[5500,7]].forEach(([delay,step])=>expansionTimers.push(setTimeout(()=>setExpansionStep(step),delay)));
}
$('#expansion-replay').addEventListener('click',replayExpansion);
setExpansionStep(motionReduced?7:1);

const room = $('#room-stage');
let roomTimer;
let roomStarted = false;
function replayRoom() {
  clearTimeout(roomTimer);
  roomStarted=true;
  if (motionReduced) { room.classList.add('unfolded');return; }
  room.classList.remove('unfolded');
  roomTimer = setTimeout(()=>room.classList.add('unfolded'),1100);
}
$('#room-replay').addEventListener('click',replayRoom);
if (motionReduced) room.classList.add('unfolded');

$('#mask-toggle').addEventListener('click',()=>{
  const button=$('#mask-toggle');
  const show=button.getAttribute('aria-pressed')!=='true';
  button.setAttribute('aria-pressed',String(show));
  button.textContent=show?'Hide masks':'Show masks';
  $('#mask-overlay').classList.toggle('is-hidden',!show);
});

const trials = $$('#rollouts video');
let trialsVisible=false;
let trialsStarted=false;
let playVersion=0;
let resumeTrials=[];
function readyVideo(video) {
  if (video.readyState>=2) return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const ready=()=>{cleanup();resolve();};
    const failed=()=>{cleanup();reject(new Error('Trial unavailable'));};
    const cleanup=()=>{video.removeEventListener('loadeddata',ready);video.removeEventListener('error',failed);};
    video.addEventListener('loadeddata',ready,{once:true});
    video.addEventListener('error',failed,{once:true});
    video.preload='auto';video.load();
  });
}
async function playTrials(reset=false,explicit=false,selected=trials) {
  const version=++playVersion;
  $('#rollout-status').textContent='Loading both trials…';
  try {
    selected.forEach(video=>video.pause());
    await Promise.all(selected.map(readyVideo));
    if (version!==playVersion || (!trialsVisible&&!explicit) || (motionReduced&&!explicit)) return;
    if (reset) selected.forEach(video=>{video.currentTime=0;});
    await Promise.all(selected.map(video=>video.play()));
    if (version!==playVersion) return;
    trialsStarted=true;
    $('#rollout-status').textContent='Sound is off. Use each video’s controls to pause or play.';
  } catch {
    if(version===playVersion) $('#rollout-status').textContent='Use the video controls to play each trial.';
  }
}
$('#rollout-replay').addEventListener('click',()=>playTrials(true,true));
trials.forEach(video=>video.addEventListener('ended',()=>{
  if(trials.every(v=>v.ended)) $('#rollout-status').textContent='Both trials finished. Replay to watch again.';
}));

function applyMotionPreference() {
  document.documentElement.dataset.motion=motionReduced?'reduced':'full';
  $('#animation-toggle').setAttribute('aria-pressed',String(motionReduced));
  $('#animation-toggle').textContent=motionReduced?'Motion reduced':'Reduce motion';
  if(motionReduced) {
    clearExpansion();setExpansionStep(7);
    clearTimeout(roomTimer);room.classList.add('unfolded');
    ++playVersion;trials.forEach(v=>v.pause());resumeTrials=[];
    $('#rollout-status').textContent='Motion reduced. Use the video controls or replay button.';
  } else if(trialsVisible) playTrials(!trialsStarted);
}
$('#animation-toggle').addEventListener('click',()=>{motionReduced=!motionReduced;applyMotionPreference();});
motionPreference.addEventListener('change',()=>{motionReduced=motionPreference.matches;applyMotionPreference();});
applyMotionPreference();

if('IntersectionObserver' in window) {
  const figureObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting || entry.intersectionRatio<.4)return;
      if(entry.target===expansion&&!expansionStarted) replayExpansion();
      if(entry.target===room&&!roomStarted) replayRoom();
    });
  },{threshold:[0,.4]});
  figureObserver.observe(expansion);figureObserver.observe(room);
  new IntersectionObserver(entries=>{
    const entry=entries[0];
    const visible=entry.isIntersecting&&entry.intersectionRatio>=.25;
    if(visible===trialsVisible)return;
    trialsVisible=visible;
    if(visible&&!motionReduced) {
      if(!trialsStarted)playTrials(true);
      else if(resumeTrials.length)playTrials(false,false,resumeTrials);
    } else if(!visible) {
      ++playVersion;
      resumeTrials=trials.filter(v=>!v.paused&&!v.ended);
      trials.forEach(v=>v.pause());
    }
  },{threshold:[0,.25]}).observe($('#rollouts'));
} else {
  setExpansionStep(7);room.classList.add('unfolded');
  $('#rollout-status').textContent='Use the video controls or replay button.';
}

$('#copy-citation').addEventListener('click',async()=>{
  const status=$('#citation-status');
  try {
    await navigator.clipboard.writeText($('#citation').textContent);
    status.textContent='Citation copied.';
    $('#copy-citation').textContent='Copied';
    setTimeout(()=>{$('#copy-citation').textContent='Copy BibTeX';},2500);
  } catch {
    const range=document.createRange();range.selectNodeContents($('#citation'));
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    status.textContent='Citation selected. Copy with your keyboard.';
  }
});
let scrollQueued=false;
const navLinks=$$('.site-header nav a[href^="#"]');
function updateScroll() {
  const distance=document.documentElement.scrollHeight-innerHeight;
  $('.reading-progress').style.transform='scaleX('+Math.min(1,Math.max(0,scrollY/Math.max(1,distance)))+')';
  let active;
  navLinks.forEach(link=>{if($(link.getAttribute('href')).getBoundingClientRect().top<150)active=link;});
  navLinks.forEach(link=>{if(link===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  scrollQueued=false;
}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}},{passive:true});
window.addEventListener('resize',updateScroll);
updateScroll();
