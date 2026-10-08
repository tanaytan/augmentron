'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let animationsReduced = reducedMotion.matches;
document.documentElement.dataset.motion = animationsReduced ? 'reduced' : 'full';
function selectButton(group, current) {
  $$(group).forEach(button => button.setAttribute('aria-pressed', String(button === current)));
}

// One mosaic keeps all four views on a single media clock.
const sceneVideo = $('#scene-video');
const scrubber = $('#scene-time');
let motionPaused = animationsReduced;
let sceneVisible = true;
let demoTask = 'towel';
let edit = 'env';
let pendingScene = null;
let currentScene = 'towel-env-578';
const taskNames = { cup:'Cup on saucer', towel:'Fold a towel', vase:'Flower in vase' };
const pairs = {
  cup: { env:'cup-env-350', texture:'cup-texture-351' },
  towel: { env:'towel-env-578', texture:'towel-texture-579' },
  vase: { env:'vase-env-264', texture:'vase-texture-265' }
};
const gallery = [
  ['vase-texture-677','vase','texture','Pink surface'],
  ['cup-env-702','cup','env','Greenhouse setting'],
  ['towel-texture-579','towel','texture','Grid surface'],
  ['more-cup-env-202','cup','env','Wooden kitchen'],
  ['more-vase-env-688','vase','env','Server-room setting'],
  ['more-towel-env-1468','towel','env','Bright workshop'],
  ['more-towel-texture-881','towel','texture','Teal surface'],
  ['cup-texture-351','cup','texture','Dark marble surface'],
  ['vase-env-264','vase','env','Robot workshop'],
  ['vase-texture-265','vase','texture','Metallic surface'],
  ['more-cup-texture-1003','cup','texture','Cork surface'],
  ['towel-env-578','towel','env','Parts warehouse']
];
function clockTime(seconds) {
  const value = Math.max(0, Math.round(seconds || 0));
  return String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');
}
function updateTime() {
  if (pendingScene) return;
  if (!scrubber.matches(':active')) scrubber.value = sceneVideo.currentTime || 0;
  $('#time-readout').textContent = clockTime(sceneVideo.currentTime)+' / '+clockTime(sceneVideo.duration || 22.8667);
  scrubber.setAttribute('aria-valuetext', clockTime(sceneVideo.currentTime)+' of '+clockTime(sceneVideo.duration || 22.8667));
}
function applyMotion() {
  const button = $('#motion-toggle');
  button.setAttribute('aria-pressed', String(motionPaused));
  button.setAttribute('aria-label', motionPaused?'Play scene video':'Pause scene video');
  button.querySelector('.play-label').textContent = motionPaused?'Play':'Pause';
  button.querySelector('.play-icon').textContent = motionPaused?'▶':'Ⅱ';
  if (motionPaused || !sceneVisible || pendingScene) sceneVideo.pause();
  else sceneVideo.play().catch(() => {
    if (!pendingScene && sceneVisible) {
      motionPaused = true;
      applyMotion();
    }
  });
}
function updateSceneControls() {
  $$('[data-demo-task]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.demoTask===demoTask)));
  $$('[data-edit]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.edit===edit)));
  $$('[data-clip]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.clip===currentScene)));
  $('#scene-explanation').textContent = edit==='env'
    ? 'The room changes. The recorded robot and task objects are composited into it.'
    : 'The surface changes. The recorded robot and task objects stay in place.';
}
function loadScene(id, preserveTime, startAt=0) {
  const savedTime = preserveTime ? sceneVideo.currentTime : startAt;
  if (pendingScene) pendingScene.abort();
  pendingScene = new AbortController();
  const signal = pendingScene.signal;
  currentScene = id;
  updateSceneControls();
  sceneVideo.pause();
  $('#film-loading').hidden = false;
  sceneVideo.poster = 'assets/images/scenes/'+id+'.jpg';
  sceneVideo.setAttribute('aria-label', taskNames[demoTask]+' four-camera presentation montage with '+(edit==='env'?'environment':'surface')+' augmentation');
  let seekComplete = savedTime < .01;
  function finishLoad() {
    if (signal.aborted || !seekComplete || sceneVideo.readyState < 2) return;
    $('#film-loading').hidden = true;
    pendingScene = null;
    updateTime();
    applyMotion();
  }
  sceneVideo.addEventListener('loadedmetadata', () => {
    scrubber.max = Math.max(0, sceneVideo.duration-.1);
    const target = Math.min(savedTime, Math.max(0, sceneVideo.duration-.1));
    if (Math.abs(sceneVideo.currentTime-target)<.01) seekComplete = true;
    else {
      sceneVideo.addEventListener('seeked', () => { seekComplete=true;finishLoad(); }, {once:true,signal});
      sceneVideo.currentTime = target;
    }
    finishLoad();
  }, { once:true, signal });
  sceneVideo.addEventListener('loadeddata', finishLoad, { once:true, signal });
  sceneVideo.addEventListener('error', () => {
    $('#film-loading').textContent = 'This clip could not load. Try another scene.';
  }, { once:true, signal });
  $('#film-loading').textContent = 'Loading scene';
  sceneVideo.src = 'assets/videos/'+id+'.mp4';
  sceneVideo.load();
}
$('#motion-toggle').addEventListener('click', () => { motionPaused = !motionPaused; applyMotion(); });
sceneVideo.addEventListener('timeupdate', updateTime);
sceneVideo.addEventListener('loadedmetadata', () => { scrubber.max = Math.max(0,sceneVideo.duration-.1);updateTime(); });
scrubber.addEventListener('input', () => { sceneVideo.currentTime = Number(scrubber.value);updateTime(); });
$$('[data-demo-task]').forEach(button => button.addEventListener('click', () => {
  if (demoTask===button.dataset.demoTask && currentScene===pairs[demoTask][edit]) return;
  demoTask = button.dataset.demoTask;
  $('#scene-opened').textContent = '';
  loadScene(pairs[demoTask][edit], false);
}));
$$('[data-edit]').forEach(button => button.addEventListener('click', () => {
  if (edit===button.dataset.edit) return;
  const paired = currentScene===pairs[demoTask][edit];
  edit = button.dataset.edit;
  $('#scene-opened').textContent = '';
  loadScene(pairs[demoTask][edit], paired);
}));
$$('[data-camera]').forEach(button => button.addEventListener('click', () => {
  selectButton('[data-camera]',button);
  const view = button.dataset.camera;
  $('#camera-window').dataset.view = view;
  $('#focused-camera').hidden = view==='all';
  $('#focused-camera').textContent = {high:'High fixed',low:'Low fixed',left:'Left wrist',right:'Right wrist'}[view] || '';
}));
$('#scene-wall').innerHTML = gallery.map(([id,task,type,description],index) =>
  `<button type="button" class="scene-tile" data-clip="${id}" data-gallery-task="${task}" data-gallery-edit="${type}" ${index>=6?'hidden':''} aria-pressed="${id===currentScene}" aria-label="Load ${taskNames[task]}: ${description.toLowerCase()}"><img src="assets/images/scenes/${id}-high.jpg" loading="lazy" width="320" height="180" alt=""><span>${description}</span></button>`
).join('');
$$('[data-clip]').forEach(button => button.addEventListener('click', () => {
  demoTask = button.dataset.galleryTask;
  edit = button.dataset.galleryEdit;
  loadScene(button.dataset.clip,false,2);
  const scene = gallery.find(item => item[0]===button.dataset.clip);
  $('#scene-opened').textContent = 'Opened at 00:02: '+scene[3]+'.';
  $('#camera-window').scrollIntoView({behavior:animationsReduced?'instant':'smooth',block:'center'});
  $('#motion-toggle').focus({preventScroll:true});
}));
$('#wall-toggle').addEventListener('click', () => {
  const button = $('#wall-toggle');
  const open = button.getAttribute('aria-expanded')!=='true';
  button.setAttribute('aria-expanded',String(open));
  button.firstChild.textContent = open?'Close the wall ':'Open the wall ';
  $$('[data-clip]').slice(6).forEach(tile => { tile.hidden = !open; });
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    sceneVisible = entries[0].isIntersecting;
    applyMotion();
  },{threshold:.05}).observe($('#camera-window'));
}
function syncMotionPreference() {
  document.documentElement.dataset.motion = animationsReduced ? 'reduced' : 'full';
  motionPaused = animationsReduced;
  $('#animation-toggle').setAttribute('aria-pressed',String(animationsReduced));
  $('#animation-toggle').textContent = animationsReduced?'Motion reduced':'Reduce motion';
  applyMotion();
}
$('#animation-toggle').setAttribute('aria-pressed',String(animationsReduced));
$('#animation-toggle').textContent = animationsReduced?'Motion reduced':'Reduce motion';
$('#animation-toggle').addEventListener('click', () => { animationsReduced = !animationsReduced;syncMotionPreference(); });
reducedMotion.addEventListener('change', () => { animationsReduced = reducedMotion.matches;syncMotionPreference(); });
applyMotion();

const maskNotes = {
  none:'Select a mask to see which pixels it covers.',
  robot:'Robot region. These pixels are protected during compositing.',
  object:'Task-object region. This mask covers the towel and a few extra regions at the edge.',
  table:'Workspace region. A surface edit changes these pixels while retaining the robot and task objects.'
};
$$('[data-mask]').forEach(button => button.addEventListener('click', () => {
  const active = button.getAttribute('aria-pressed')==='true';
  $$('[data-mask]').forEach(b => b.setAttribute('aria-pressed',String(b===button && !active)));
  const mask = active?'none':button.dataset.mask;
  $('#mask-overlay').dataset.mask = mask;
  $('#mask-note').textContent = maskNotes[mask];
}));
$$('[data-mask-scene]').forEach(button => button.addEventListener('click', () => {
  selectButton('[data-mask-scene]',button);
  const type = button.dataset.maskScene;
  $('#mask-scene').src = 'assets/images/method/wall-towel-'+type+'-high-11p2s.jpg';
  $('#mask-scene').alt = 'Fixed high camera view of the towel demonstration with a generated '+(type==='texture'?'surface':'room');
}));
$('#room-toggle').addEventListener('click', () => {
  const button = $('#room-toggle');
  const unfolded = button.getAttribute('aria-pressed')!=='true';
  button.setAttribute('aria-pressed',String(unfolded));
  $('#room-stage').classList.toggle('unfolded',unfolded);
  button.firstChild.textContent = unfolded?'Fold the room ':'Unfold the room ';
});

const recipes = [
  {id:'real',name:'Real only',steps:'30k',volume:'1×',values:[[86,68,46],[16,26,12],[78,54,20]],pooled:[66.7,18,50.7]},
  {id:'half',name:'Augmentron 50/50',steps:'30k',volume:'1×',values:[[72,88,70],[52,52,32],[80,94,28]],pooled:[76.7,45.3,67.3]},
  {id:'exploratory',name:'Augmentron 33/67 (exploratory)',steps:'30k',volume:'3×',values:[[80,80,44],[76,64,12],[62,88,26]],pooled:[68,50.7,58.7]},
  {id:'full',name:'Augmentron 33/67',steps:'45k',volume:'3×',values:[[82,72,60],[74,80,44],[70,84,28]],pooled:[71.3,66,60.7]},
  {id:'robo',name:'RoboEngine',steps:'45k',volume:'2×',values:[[70,82,20],[60,86,14],[78,40,6]],pooled:[57.3,53.3,41.3]},
  {id:'noise',name:'Masked Noise',steps:'45k',volume:'2×',values:[[86,94,26],[62,88,6],[62,76,6]],pooled:[68.7,52,48]}
];
let experiment = 'matched';
let condition = 0;
const valueAnimations = new WeakMap();
function animateValue(element,value,decimals,suffix='%') {
  if (valueAnimations.has(element)) cancelAnimationFrame(valueAnimations.get(element));
  const from = Number.parseFloat(element.textContent) || 0;
  const format = v => v.toFixed(decimals)+suffix;
  if (animationsReduced) { element.textContent=format(value);return; }
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1,(now-start)/700);
    const eased = 1-Math.pow(1-t,3);
    element.textContent = format(from+(value-from)*eased);
    if (t<1) valueAnimations.set(element,requestAnimationFrame(frame));
    else valueAnimations.delete(element);
  }
  valueAnimations.set(element,requestAnimationFrame(frame));
}
function renderResults(animate=true) {
  const task = $('#task-select').value;
  const ti = ['cup','towel','vase'].indexOf(task);
  const pooled = task==='pooled';
  const selected = experiment==='matched'?[recipes[0],recipes[1]]:[recipes[3],recipes[4],recipes[5]];
  const values = selected.map(r => pooled?r.pooled[condition]:r.values[condition][ti]);
  $$('[data-row]').forEach((row,index) => {
    row.hidden = index>=selected.length;
    if (row.hidden) return;
    const recipe = selected[index];
    const value = values[index];
    row.querySelector('.recipe-label').textContent = recipe.name;
    row.querySelector('.recipe-detail').textContent = recipe.steps+' steps / '+recipe.volume+' data';
    row.querySelector('.bar-fill').className = 'bar-fill'+(['half','full'].includes(recipe.id)?' green':recipe.id==='noise'?' purple':'');
    row.querySelector('.bar-fill').style.width = value+'%';
    row.setAttribute('aria-label',recipe.name+': '+value+' percent task success');
    const element = row.querySelector('.result-value');
    if (animate) animateValue(element,value,pooled?1:0); else element.textContent=(pooled?value.toFixed(1):value)+'%';
  });
  const matched = experiment==='matched';
  $('#experiment-title').textContent = matched?'Replace half the data. Keep the volume.':'Keep the real data. Add the augmented data.';
  $('#experiment-note').textContent = matched
    ? 'Both policies train for 30k steps with 1× effective data volume. Each source demonstration appears once. The augmented recipe is 50% real, 25% environment edits, and 25% surface edits.'
    : 'All three recipes train for 45k steps. Augmentron uses 3× data volume: real + environment + surface. RoboEngine and Masked Noise use 2×. This comparison evaluates the complete recipes.';
  $('#mixture').classList.toggle('full',!matched);
  $('#mixture').setAttribute('aria-label', matched?'Augmentron: 50% real, 25% environment, 25% surface':'Augmentron: equal parts real, environment and surface data');
  $('#mixture').innerHTML = matched?'<span>Real 50%</span><span>Room 25%</span><span>Surface 25%</span>':'<span>Real ⅓</span><span>Room ⅓</span><span>Surface ⅓</span>';
  $('#chart-sample').textContent = pooled?'150 rollouts per pooled result. 50 per task and condition. One training seed.':'50 rollouts per task and condition. '+taskNames[task]+'. One training seed.';
  const names = ['the original setup','added distractors','the reflective steel surface'];
  const setupTask = condition===2 || pooled?'cup':task;
  const prefix = ['original','distractors','surface'][condition];
  $('#setup-image').src = 'assets/images/setups/'+prefix+'-'+setupTask+'.jpg';
  $('#setup-image').alt = taskNames[setupTask]+' '+['in the original setup','with added distractor objects','on a reflective surface'][condition]+', from the presentation assets';
  $('#setup-caption').textContent = ['Original setup','Added distractors','Surface example'][condition]+' / '+taskNames[setupTask].toLowerCase();
  $('#setup-title').textContent = ['The collection setup.','A few extra objects.','A different table surface.'][condition];
  $('#setup-description').textContent = ['The table and surroundings where we collected demonstrations.','The task stays the same. We add task-irrelevant objects around the workspace.','The paper tests a shift from wood to reflective steel. The cup-task still illustrates a changed surface.'][condition];
  let reading;
  if (matched && pooled) {
    reading = [
      'In the original setup, pooled success rises from 66.7% to 76.7%. The task-level results are mixed: cup placement falls from 86% to 72%.',
      'Add extra objects to the table, and the real-only baseline falls to 18.0%. Half-augmented training reaches 45.3%. All three tasks improve under distractors.',
      'Replace wood with reflective steel. Pooled success rises from 50.7% to 67.3%. All three tasks improve in this condition.'
    ][condition];
  } else if (matched) {
    const difference = values[1]-values[0];
    reading = `${taskNames[task]} with ${names[condition]}: ${values[0]}% for real-only training and ${values[1]}% for 50/50. ${difference===0?'Success is unchanged.':difference>0?'Success improves by '+difference+' percentage points.':'Success falls by '+Math.abs(difference)+' percentage points.'}`;
  } else if (pooled) {
    reading = `With ${names[condition]}, Augmentron reaches ${values[0].toFixed(1)}%, RoboEngine ${values[1].toFixed(1)}%, and Masked Noise ${values[2].toFixed(1)}%. Augmentron leads in pooled success. Its data volume is 3×, compared with 2× for both baselines.`;
  } else {
    reading = `${taskNames[task]} with ${names[condition]}: Augmentron ${values[0]}%, RoboEngine ${values[1]}%, Masked Noise ${values[2]}%. Task-level outcomes are mixed; the full recipe’s lead is in pooled success. Data volumes differ.`;
  }
  $('#condition-reading').textContent = reading;
  const delta = matched?values[1]-values[0]:values[0]-Math.max(values[1],values[2]);
  $('#result-delta').textContent = (delta>=0?'+':'')+delta.toFixed(pooled?1:0);
  $('#delta-label').innerHTML = matched?'percentage points<br>'+ (pooled?'across three tasks':'for this task'):'points over the<br>stronger baseline';
  $('#result-chart').setAttribute('aria-label', 'Task success with '+names[condition]+', '+(pooled?'pooled across all three tasks':taskNames[task]));
}
$$('[data-experiment]').forEach(button => button.addEventListener('click', () => {
  if (experiment===button.dataset.experiment) return;
  experiment = button.dataset.experiment;
  selectButton('[data-experiment]',button);
  renderResults();
}));
$$('[data-condition]').forEach(button => button.addEventListener('click', () => {
  condition = Number(button.dataset.condition);
  selectButton('[data-condition]',button);
  renderResults();
}));
$('#task-select').addEventListener('change',() => renderResults());
$('#all-results-body').innerHTML = recipes.map(r => [...Object.values(taskNames),'Pooled'].map((task,ti) =>
  `<tr><td>${r.steps}</td><td>${r.name}</td><td>${r.volume}</td><th scope="row">${task}</th>${[0,1,2].map(ci => `<td>${ti===3?r.pooled[ci].toFixed(1):r.values[ci][ti]}</td>`).join('')}</tr>`
).join('')).join('');
renderResults(false);

$('#presentation-toggle').addEventListener('click', () => {
  const panel = $('#presentation-panel');
  const open = panel.hidden;
  panel.hidden = !open;
  $('#presentation-toggle').setAttribute('aria-expanded',String(open));
  $('#presentation-toggle').firstChild.textContent = open?'Close my intern talk ':'Watch my intern talk ';
  if (!open) panel.querySelector('video').pause();
  else panel.scrollIntoView({behavior:animationsReduced?'instant':'smooth',block:'center'});
});
$('#copy-citation').addEventListener('click',async () => {
  const status = $('#citation-status');
  try {
    await navigator.clipboard.writeText($('#citation').textContent);
    status.textContent = 'Citation copied.';
    $('#copy-citation').firstChild.textContent = 'Copied ';
    window.setTimeout(() => { $('#copy-citation').firstChild.textContent = 'Copy BibTeX '; },2500);
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('#citation'));
    const selection = window.getSelection();
    selection.removeAllRanges();selection.addRange(range);
    status.textContent = 'Citation selected. Copy with your keyboard.';
  }
});
let scrollQueued = false;
const navLinks = $$('.site-header nav a[href^="#"]');
function updateScroll() {
  const distance = document.documentElement.scrollHeight-window.innerHeight;
  $('.reading-progress').style.transform = 'scaleX('+Math.min(1,Math.max(0,window.scrollY/distance))+')';
  let active = null;
  navLinks.forEach(link => { if ($(link.getAttribute('href')).getBoundingClientRect().top<150) active=link; });
  navLinks.forEach(link => { if(link===active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); });
  scrollQueued = false;
}
window.addEventListener('scroll', () => { if (!scrollQueued) {scrollQueued=true;requestAnimationFrame(updateScroll);} },{passive:true});
window.addEventListener('resize',updateScroll);
updateScroll();
