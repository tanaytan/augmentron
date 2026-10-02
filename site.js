const motionButton=document.querySelector('#motion-toggle');
let motionPaused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function applyMotion(){document.querySelectorAll('video[autoplay]').forEach(v=>{if(motionPaused)v.pause();else v.play().catch(()=>{});});motionButton.textContent=motionPaused?'Play videos':'Pause videos';motionButton.setAttribute('aria-pressed',String(motionPaused));}
motionButton.addEventListener('click',()=>{motionPaused=!motionPaused;applyMotion();});
applyMotion();

document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{
  const surface=button.dataset.scene==='surface';
  const img=document.querySelector('#scene-image');
  img.src='assets/images/'+(surface?'surface':'environment')+'-4views.jpg';
  img.alt=(surface?'Workspace surface':'Environment')+' augmentation shown in the high fixed, low fixed, left wrist, and right wrist camera views.';
  document.querySelectorAll('[data-scene]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
}));

const recipes=[
  {id:'real',name:'Real only',steps:'30k',volume:'1×',values:[[86,68,46],[16,26,12],[78,54,20]],pooled:[66.7,18.0,50.7]},
  {id:'half',name:'Augmentron 50/50',steps:'30k',volume:'1×',values:[[72,88,70],[52,52,32],[80,94,28]],pooled:[76.7,45.3,67.3]},
  {id:'exploratory',name:'Augmentron 33/67',steps:'30k',volume:'3×',values:[[80,80,44],[76,64,12],[62,88,26]],pooled:[68.0,50.7,58.7]},
  {id:'full',name:'Augmentron 33/67',steps:'45k',volume:'3×',values:[[82,72,60],[74,80,44],[70,84,28]],pooled:[71.3,66.0,60.7]},
  {id:'robo',name:'RoboEngine',steps:'45k',volume:'2×',values:[[70,82,20],[60,86,14],[78,40,6]],pooled:[57.3,53.3,41.3]},
  {id:'noise',name:'Masked Noise',steps:'45k',volume:'2×',values:[[86,94,26],[62,88,6],[62,76,6]],pooled:[68.7,52.0,48.0]}
];
const taskNames=['Cup on saucer','Fold a towel','Flower in vase'];
const conditions=[['Original setup','ID'],['Added distractors','OOD'],['Reflective steel surface','OOD']];
let experiment='matched';
function renderResults(){
  const task=document.querySelector('#task-select').value;
  const taskIndex=['cup','towel','vase'].indexOf(task);
  const selected=experiment==='matched'?[recipes[0],recipes[1]]:[recipes[3],recipes[4],recipes[5]];
  document.querySelector('#result-chart').innerHTML=conditions.map((c,ci)=>`<div class="chart-panel"><h4>${c[0]} <span>${c[1]}</span></h4>${selected.map(r=>{
    const value=task==='pooled'?r.pooled[ci]:r.values[ci][taskIndex];
    const cls=['half','full'].includes(r.id)?' accent-row':r.id==='noise'?' noise-row':'';
    return `<div class="bar-row${cls}"><span>${r.name}</span><div class="bar-track"><i style="width:${value}%"></i></div><strong>${task==='pooled'?value.toFixed(1):value}%</strong></div>`;
  }).join('')}</div>`).join('');
  document.querySelector('#chart-sample').textContent=task==='pooled'?'Success rate (%). 150 rollouts per pooled result; 50 per task.':`Success rate (%). ${taskNames[taskIndex]}. 50 rollouts per result.`;
  document.querySelector('#experiment-title').textContent=experiment==='matched'?'Matched data volume and training schedule':'Complete recipes at 45k training steps';
  document.querySelector('#experiment-note').textContent=experiment==='matched'?'Real and Augmentron 50/50 both use 1× effective data volume and the same 30k-step training schedule. Every source demonstration is represented once. The 50/50 recipe uses 50% real, 25% environment edits, and 25% workspace edits.':'The three recipes share a 45k-step training schedule. Augmentron uses 3× effective data volume (real + environment + workspace); RoboEngine and Masked Noise each use 2×. This comparison evaluates the full recipes and does not isolate the augmentation method from dataset size.';
  document.querySelector('#result-reading').innerHTML=experiment==='matched'?'<p><strong>The clearest gain is under distractors.</strong> Pooled success rises from 18.0% to 45.3%, a 27.3-point increase. All three tasks improve in this condition. Pooled success also improves in the original setup and on the steel surface.</p><p><strong>The gains vary by task.</strong> In the original setup, cup-on-saucer success falls from 86% to 72%, while towel and vase success improve. The pooled result should be read alongside the individual tasks.</p>':'<p><strong>Augmentron has the highest pooled success in all three conditions.</strong> It reaches 71.3% in the original setup, 66.0% with distractors, and 60.7% on steel. Task-level outcomes are mixed; the lead is in the pooled results.</p><p><strong>Masked Noise is competitive.</strong> It reaches 68.7%, 52.0%, and 48.0%. The data volumes differ, and pipeline components are evaluated together. These results support the full Augmentron recipe without establishing why each component helps.</p>';
}
document.querySelectorAll('[data-experiment]').forEach(button=>button.addEventListener('click',()=>{
  experiment=button.dataset.experiment;
  document.querySelectorAll('[data-experiment]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  renderResults();
}));
document.querySelector('#task-select').addEventListener('change',renderResults);
document.querySelector('#all-results-body').innerHTML=recipes.map(r=>[...taskNames,'Pooled'].map((task,ti)=>`<tr><td>${r.steps}</td><td>${r.name}</td><td>${r.volume}</td><th scope="row">${task}</th>${conditions.map((_,ci)=>`<td>${ti===3?r.pooled[ci].toFixed(1):r.values[ci][ti]}</td>`).join('')}</tr>`).join('')).join('');
renderResults();

document.querySelector('#presentation-toggle').addEventListener('click',()=>{
  const panel=document.querySelector('#presentation-panel');const open=panel.hidden;
  panel.hidden=!open;document.querySelector('#presentation-toggle').setAttribute('aria-expanded',String(open));
  document.querySelector('#presentation-toggle').textContent=open?'Close presentation':'Watch the presentation';
  if(!open)panel.querySelector('video').pause();
});
document.querySelector('#copy-citation').addEventListener('click',async()=>{
  const status=document.querySelector('#citation-status');
  try{await navigator.clipboard.writeText(document.querySelector('#citation').textContent);status.textContent='Citation copied.';}
  catch{status.textContent='Select the citation text to copy it.';const range=document.createRange();range.selectNodeContents(document.querySelector('#citation'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);}
});
