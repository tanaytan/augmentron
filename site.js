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

// Figures stay at their first frame until the reader reaches them.
// Each player owns its clock, so pausing or scrubbing cancels automatic progress.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionReduced = motionPreference.matches;
let figuresArmed = Boolean(location.hash && location.hash !== '#main');
let previousScroll = scrollY;
const expansion = $('#expansion-stage');
const expansionVideo = $('#expansion-video');
const expansionStatic = $('#expansion-static');
const expansionState = {visible:false,userPaused:false,manual:false,pending:false,request:0,seek:null};
const room = $('#room-stage');
const roomState = {visible:false,userPaused:false,manual:false,time:0,playing:false,frame:0,lastStamp:0};
const clockText = seconds => '0:'+String(Math.floor(seconds)).padStart(2,'0');
function figureVisible(stage) {
  if(document.hidden) return false;
  const r=stage.getBoundingClientRect();
  const top=$('.site-header').getBoundingClientRect().bottom;
  const visible=Math.min(r.bottom,innerHeight)-Math.max(r.top,top);
  return r.width>0 && visible>=Math.min(r.height*.5,(innerHeight-top)*.5);
}
function wantsPlayback(state) {
  return state.visible && (figuresArmed||state.manual) && !state.userPaused && (!motionReduced||state.manual);
}
function renderExpansion() {
  const t=motionReduced&&!expansionState.manual?12.3:expansionState.seek ?? (expansionVideo.currentTime||0);
  const duration=Number.isFinite(expansionVideo.duration)?expansionVideo.duration:16;
  const label=t<2.4?'1 augmented video':t<3.9?'1 → 9 augmented videos':t<6.4?'9 augmented videos':t<7.9?'9 → 25 augmented videos':t<10.4?'25 augmented videos':t<11.9?'25 → 49 augmented videos':'49 augmented videos';
  $('#expansion-status').textContent=label;
  $('#expansion-progress').max=String(duration);
  $('#expansion-progress').value=String(t);
  $('#expansion-progress').setAttribute('aria-valuetext',t.toFixed(1)+' of '+duration.toFixed(0)+' seconds');
  $('#expansion-time').textContent=clockText(t)+' / '+clockText(duration);
  const playing=!expansionVideo.paused||expansionState.pending;
  $('#expansion-play').textContent=playing?'Pause':'Play';
  $('#expansion-play').setAttribute('aria-label',(playing?'Pause':'Play')+' expansion');
  $('#expansion-hint').textContent=motionReduced&&!expansionState.manual?'Motion reduced. Press Play to watch, or scrub the timeline.':expansionState.userPaused?'Paused. Drag the timeline or press Play.':expansionState.pending?'Loading the video. Press Pause to stop.':playing?'Loops while in view. Drag the timeline to rewind.':'Plays here as you scroll. Drag the timeline to rewind.';
}
async function syncExpansion() {
  if(!wantsPlayback(expansionState)) {
    ++expansionState.request;expansionState.pending=false;expansionVideo.pause();renderExpansion();return;
  }
  if(!expansionVideo.paused||expansionState.pending)return;
  const request=++expansionState.request;
  expansionState.pending=true;renderExpansion();
  try {
    await expansionVideo.play();
    if(request!==expansionState.request)return;
    if(!wantsPlayback(expansionState))expansionVideo.pause();
  } catch {
    if(request===expansionState.request && wantsPlayback(expansionState)) {
      expansionState.userPaused=true;
      $('#expansion-hint').textContent='Press Play to watch the expansion.';
    }
  } finally {
    if(request===expansionState.request) {expansionState.pending=false;renderExpansion();}
  }
}
function showExpansionVideo() {
  expansionStatic.hidden=true;expansionVideo.hidden=false;
}
function seekExpansion(time) {
  showExpansionVideo();
  if(expansionVideo.readyState>=1) {expansionVideo.currentTime=time;expansionState.seek=null;}
  else {++expansionState.request;expansionState.pending=false;expansionVideo.pause();expansionState.seek=time;expansionVideo.preload='auto';expansionVideo.load();}
  renderExpansion();
}
expansionVideo.controls=false;
['timeupdate','play','pause','durationchange','seeked'].forEach(event=>expansionVideo.addEventListener(event,renderExpansion));
expansionVideo.addEventListener('loadedmetadata',()=>{
  if(expansionState.seek!==null) {expansionVideo.currentTime=expansionState.seek;expansionState.seek=null;}
  renderExpansion();
});
$('#expansion-play').addEventListener('click',()=>{
  expansionState.manual=true;showExpansionVideo();
  expansionState.userPaused=!expansionVideo.paused||expansionState.pending;
  expansionState.visible=figureVisible(expansion);
  syncExpansion();
});
$('#expansion-replay').addEventListener('click',()=>{
  expansionState.manual=true;expansionState.userPaused=false;
  seekExpansion(0);expansionState.visible=figureVisible(expansion);syncExpansion();
});
$('#expansion-progress').addEventListener('input',event=>{
  const time=Number(event.target.value);
  expansionState.manual=true;expansionState.userPaused=true;syncExpansion();
  seekExpansion(time);
});
function smoothProgress(x) {return x*x*(3-2*x);}
function renderRoom() {
  const t=roomState.time;
  const unfold=t<1.2?0:t<3?smoothProgress((t-1.2)/1.8):t<6.1?1:t<7.6?1-smoothProgress((t-6.1)/1.5):0;
  room.style.setProperty('--unfold',String(unfold));
  room.dataset.time=t.toFixed(2);
  $('#room-progress').value=String(t);
  $('#room-progress').setAttribute('aria-valuetext',t.toFixed(1)+' of 8 seconds');
  $('#room-time').textContent=clockText(t)+' / 0:08';
  $('#room-play').textContent=roomState.playing?'Pause':'Play';
  $('#room-play').setAttribute('aria-label',(roomState.playing?'Pause':'Play')+' unfolding');
  $('#room-hint').textContent=motionReduced&&!roomState.manual?'Motion reduced. Press Play to watch, or scrub the timeline.':roomState.userPaused?'Paused. Drag the timeline or press Play.':roomState.playing?'Loops while in view. Drag the timeline to rewind.':'Plays here as you scroll. Drag the timeline to rewind.';
}
function roomTick(stamp) {
  if(!roomState.playing)return;
  if(roomState.lastStamp)roomState.time=(roomState.time+(stamp-roomState.lastStamp)/1000)%8;
  roomState.lastStamp=stamp;renderRoom();
  roomState.frame=requestAnimationFrame(roomTick);
}
function syncRoom() {
  const playing=wantsPlayback(roomState);
  if(playing===roomState.playing)return;
  roomState.playing=playing;roomState.lastStamp=0;
  cancelAnimationFrame(roomState.frame);
  if(playing)roomState.frame=requestAnimationFrame(roomTick);
  renderRoom();
}
$('#room-play').addEventListener('click',()=>{
  roomState.manual=true;roomState.userPaused=roomState.playing;
  roomState.visible=figureVisible(room);syncRoom();
});
$('#room-replay').addEventListener('click',()=>{
  roomState.manual=true;roomState.userPaused=false;roomState.time=0;roomState.lastStamp=0;
  roomState.visible=figureVisible(room);renderRoom();syncRoom();
});
$('#room-progress').addEventListener('input',event=>{
  const time=Number(event.target.value);
  roomState.manual=true;roomState.userPaused=true;syncRoom();
  roomState.time=time;renderRoom();
});
function checkFigures() {
  [ [expansion,expansionState], [room,roomState] ].forEach(([stage,state])=>{
    const visible=figureVisible(stage);
    if(visible&&!state.visible&&!state.userPaused&&!state.manual) {
      if(stage===expansion) {
        if(expansionVideo.readyState>=1)expansionVideo.currentTime=0;
      } else {roomState.time=motionReduced&&!roomState.manual?4:0;roomState.lastStamp=0;renderRoom();}
    }
    state.visible=visible;
  });
  syncExpansion();syncRoom();
}
if('IntersectionObserver' in window) {
  const observer=new IntersectionObserver(checkFigures,{threshold:[0,.25,.5,.75,1]});
  observer.observe(expansion);observer.observe(room);
}
let figureCheckQueued=false;
window.addEventListener('scroll',()=>{
  if(scrollY!==previousScroll)figuresArmed=true;
  previousScroll=scrollY;
  if(!figureCheckQueued) {figureCheckQueued=true;requestAnimationFrame(()=>{figureCheckQueued=false;checkFigures();});}
},{passive:true});
window.addEventListener('resize',checkFigures);
document.addEventListener('visibilitychange',checkFigures);
renderExpansion();renderRoom();

$('#mask-toggle').addEventListener('click',()=>{
  const button=$('#mask-toggle');
  const show=button.getAttribute('aria-pressed')!=='true';
  button.setAttribute('aria-pressed',String(show));
  button.textContent=show?'Hide masks':'Show masks';
  $('#mask-overlay').classList.toggle('is-hidden',!show);
});

const trials = $$('#rollouts video');
function trialFigureOnScreen() {
  const r=$('#rollouts').getBoundingClientRect();
  return !document.hidden && r.bottom>$('.site-header').getBoundingClientRect().bottom && r.top<innerHeight;
}
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
    if (version!==playVersion || !trialFigureOnScreen() || (!trialsVisible&&!explicit) || (motionReduced&&!explicit)) return;
    if (reset) selected.forEach(video=>{video.currentTime=0;});
    await Promise.all(selected.map(video=>video.play()));
    if (version!==playVersion) return;
    trialsStarted=true;
    $('#rollout-status').textContent='Sound is off. Use each video’s controls to pause or play.';
  } catch {
    if(version===playVersion) $('#rollout-status').textContent='Use the video controls to play each trial.';
  }
}
$('#rollout-replay').addEventListener('click',()=>{
  if(!trialFigureOnScreen())$('#rollouts').scrollIntoView({block:'center',behavior:'instant'});
  playTrials(true,true);
});
trials.forEach(video=>video.addEventListener('ended',()=>{
  if(trials.every(v=>v.ended)) $('#rollout-status').textContent='Both trials finished. Replay to watch again.';
}));

function applyMotionPreference() {
  document.documentElement.dataset.motion=motionReduced?'reduced':'full';
  $('#animation-toggle').setAttribute('aria-pressed',String(motionReduced));
  $('#animation-toggle').textContent=motionReduced?'Motion reduced':'Reduce motion';
  if(motionReduced) {
    expansionState.manual=false;roomState.manual=false;
    expansionVideo.pause();expansionVideo.hidden=true;expansionStatic.hidden=false;
    roomState.time=4;roomState.lastStamp=0;renderRoom();
    ++playVersion;trials.forEach(v=>v.pause());resumeTrials=[];
    $('#rollout-status').textContent='Motion reduced. Use the video controls or replay button.';
  } else {
    expansionStatic.hidden=true;expansionVideo.hidden=false;
    if(trialsVisible)playTrials(!trialsStarted);
  }
  checkFigures();renderExpansion();renderRoom();
}
$('#animation-toggle').addEventListener('click',()=>{motionReduced=!motionReduced;applyMotionPreference();});
motionPreference.addEventListener('change',()=>{motionReduced=motionPreference.matches;applyMotionPreference();});
applyMotionPreference();

if('IntersectionObserver' in window) {
  new IntersectionObserver(entries=>{
    const entry=entries[0];
    const visible=entry.isIntersecting&&entry.intersectionRatio>=.25;
    if(visible===trialsVisible) {
      if(!trialFigureOnScreen()) {
        ++playVersion;
        const playing=trials.filter(v=>!v.paused&&!v.ended);
        if(playing.length)resumeTrials=playing;
        trials.forEach(v=>v.pause());
      }
      return;
    }
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
  $('#rollout-status').textContent='Use the video controls or replay button.';
}

// Native playback remains available, while hidden pages and departed figures stop work.
trials.forEach(video=>video.addEventListener('playing',()=>{
  if(trialFigureOnScreen())trialsStarted=true;
}));
trials.forEach(video=>video.addEventListener('play',()=>{
  if(!trialFigureOnScreen()) {
    ++playVersion;video.pause();
  }
}));
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) {
    ++playVersion;resumeTrials=trials.filter(v=>!v.paused&&!v.ended);
    trials.forEach(v=>v.pause());
  } else if(trialsVisible&&!motionReduced) {
    if(!trialsStarted)playTrials(true);
    else if(resumeTrials.length)playTrials(false,false,resumeTrials);
  }
});

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
