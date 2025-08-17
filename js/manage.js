// ================== 模擬員工資料 ==================
let employees = [];
let personalityResults = [];

// 讀取兩份資料
Promise.all([
  fetch('data/employees.json').then(res=>res.json()),
  fetch('data/results.json').then(res=>res.json())
]).then(([empData, resData])=>{
  employees = empData;
  personalityResults = resData;

  // 整合性格分數到員工資料
  employees.forEach(emp=>{
    const p = personalityResults.find(r => r.employee_id === emp.序號);
    if(p){
      emp.EI_score = p.EI_score;
      emp.SN_score = p.SN_score;
      emp.TF_score = p.TF_score;
      emp.JP_score = p.JP_score;
      emp.type = p.type;
    } else {
      emp.EI_score = 0;
      emp.SN_score = 0;
      emp.TF_score = 0;
      emp.JP_score = 0;
      emp.type = '';
    }
  });

  renderFitTable();
});

// ===== Tab 切換 =====
const tabs = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    panels.forEach(p=>{
      if(p.id === tabId) p.classList.add('active');
      else p.classList.remove('active');
    });
  });
});

// ===== MBTI 題庫 =====
let questions = [];

function loadQuiz() {
  fetch('data/questions.json')
    .then(res => res.json())
    .then(data => {
      questions = data;
      renderQuiz();
    })
    .catch(err=>{
      console.error("題庫讀取失敗:", err);
      questions = [];
      renderQuiz();
    });
}

function renderQuiz() {
  const div = document.getElementById('quizDiv');
  div.innerHTML = '';
  questions.forEach((q,i)=>{
    const row = document.createElement('div');
    row.className='quizRow';
    row.innerHTML = `
    <input type="text" value="${q.question}" data-index="${i}" class="quizInput"/>
    <select data-index="${i}" class="quizDim">
      <option value="EI" ${q.dimension==='EI'?'selected':''}>EI</option>
      <option value="SN" ${q.dimension==='SN'?'selected':''}>SN</option>
      <option value="TF" ${q.dimension==='TF'?'selected':''}>TF</option>
      <option value="JP" ${q.dimension==='JP'?'selected':''}>JP</option>
    </select>
    <label>
      <input type="checkbox" data-index="${i}" class="quizReverse" ${q.reverse?'checked':''}/> 反向題
    </label>
    <button data-index="${i}" class="delQuestionBtn">刪除</button>
  `;
    div.appendChild(row);
  });

  // 綁定事件
  document.querySelectorAll('.quizReverse').forEach(cb=>{
    cb.addEventListener('change', e=>{
      const idx = e.target.dataset.index;
      questions[idx].reverse = e.target.checked;
    });
  });
  
  document.querySelectorAll('.quizInput').forEach(input=>{
    input.addEventListener('input', e=>{
      const idx = e.target.dataset.index;
      questions[idx].question = e.target.value;
    });
  });
  document.querySelectorAll('.quizDim').forEach(sel=>{
    sel.addEventListener('change', e=>{
      const idx = e.target.dataset.index;
      questions[idx].dimension = e.target.value;
    });
  });
  document.querySelectorAll('.delQuestionBtn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = e.target.dataset.index;
      questions.splice(idx,1);
      renderQuiz();
    });
  });
}

document.getElementById('addQuestionBtn').addEventListener('click', ()=>{
  questions.push({question:"新題目", dimension:"EI"});
  renderQuiz();
});

document.getElementById('saveQuizBtn').addEventListener('click', ()=>{
  localStorage.setItem('mbtiQuestions',JSON.stringify(questions));
  alert('題庫已儲存到 localStorage！');
});

// ================== 欄位分類 ==================
const personalityFields = ['EI_score','SN_score','TF_score','JP_score'];
const practicalFields = [
  '管理','財務會計','金融專業','風險管理',
  '人力資源','稽核內控','資訊系統','外語','其他',
  '已歷練職位數','累積訓練時數','累積加班時數',
  '已取得證照張數','進行年資','情緒分數','潛力人才'
];

const jobNames = {deposit:'存款科長', personal:'個金業務', corp:'企金業務', advisor:'理專業務'};
const jobKeys = Object.keys(jobNames);

// ================== 權重初始化（每職務獨立） ==================
let personalityWeights = {};
let practicalWeights = {};

jobKeys.forEach(job=>{
  personalityWeights[job] = {EI_score:0.25, SN_score:0.25, TF_score:0.25, JP_score:0.25};
  practicalWeights[job] = {
    管理:0.1, 財務會計:0.1, 金融專業:0.1, 風險管理:0.1,
    人力資源:0.05, 稽核內控:0.05, 資訊系統:0.05, 外語:0.05, 其他:0.05,
    已歷練職位數:0.05, 累積訓練時數:0.05, 累積加班時數:0.05,
    已取得證照張數:0.05, 進行年資:0.05, 情緒分數:0.05, 潛力人才:0.05
  };
});

// ================== 權重渲染 ==================
function renderWeights(){
  const div = document.getElementById('weightsDiv');
  div.innerHTML = '';

  function createCategory(title, fields, weightsObj){
    const catDiv = document.createElement('div');
    catDiv.className='category';
    catDiv.innerHTML = `<h3>${title}</h3>`;
    fields.forEach(field=>{
      const rowDiv = document.createElement('div');
      rowDiv.className='fieldRow';
      rowDiv.innerHTML = `<strong>${field}</strong>: `;
      jobKeys.forEach(job=>{
        const input = document.createElement('input');
        input.type='number'; input.min=0; input.max=1; input.step=0.05;
        input.value = weightsObj[job][field] || 0;
        input.addEventListener('input', ()=>{
          weightsObj[job][field] = parseFloat(input.value) || 0;
          renderTotalWeights();
          renderFitTable();
        });
        rowDiv.appendChild(document.createTextNode(`${jobNames[job]}: `)); // <-- 改成中文名稱
        rowDiv.appendChild(input);
        rowDiv.appendChild(document.createTextNode(' '));
      });
      catDiv.appendChild(rowDiv);
    });
    div.appendChild(catDiv);
  }

  createCategory('性格權重', personalityFields, personalityWeights);
  createCategory('實際權重', practicalFields, practicalWeights);

  renderTotalWeights();
}

// ================== 計算適配度 ==================
function calcPersonalityFit(emp, job){
  const weights = personalityWeights[job];
  return Object.entries(weights).reduce((sum,[dim,w])=>{
    const val = emp[dim] || 0;
    return sum + val*w;
  },0).toFixed(2);
}

function calcPracticalFit(emp, job){
  const weights = practicalWeights[job];
  return Object.entries(weights).reduce((sum,[f,w])=>{
    let val = emp[f] || 0;
    if(f==='潛力人才') val = val?1:0;
    return sum + val*w;
  },0).toFixed(2);
}

function calcOverallFit(emp, job){
  const pFit = parseFloat(calcPersonalityFit(emp, job));
  const rFit = parseFloat(calcPracticalFit(emp, job));
  return (pFit*0.4 + rFit*0.6).toFixed(2);
}

// ================== 推薦職務 ==================
function getRecommendation(emp){
  const scores = {};
  jobKeys.forEach(job=>{
    scores[job] = calcOverallFit(emp, job);
  });
  let bestJob = jobKeys[0];
  for(let job of jobKeys){
    if(scores[job] > scores[bestJob]) bestJob = job;
  }
  return bestJob;
}

// ================== 渲染適配度表格 ==================
function renderFitTable(){
  const tbody = document.querySelector('#fitTable tbody');
  tbody.innerHTML='';

  employees.forEach(emp=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${emp.序號}</td>` +
      jobKeys.map(job=>{
        const pFit = calcPersonalityFit(emp, job);
        const rFit = calcPracticalFit(emp, job);
        const oFit = calcOverallFit(emp, job);
        return `<td>${pFit}</td><td>${rFit}</td><td>${oFit}</td>`;
      }).join('');

    const bestJob = getRecommendation(emp);
    tr.innerHTML += `<td style="font-weight:bold;color:#ff6600">${jobNames[bestJob]}</td>`;
    tbody.appendChild(tr);
  });
}

// ================== 計算總權重 ==================
function calcTotalWeights(){
  const totals = {};
  jobKeys.forEach(job=>{
    const personalitySum = Object.values(personalityWeights[job]).reduce((a,b)=>a+b,0);
    const practicalSum = Object.values(practicalWeights[job]).reduce((a,b)=>a+b,0);
    totals[job] = {性格:personalitySum.toFixed(2), 實際:practicalSum.toFixed(2)};
  });
  return totals;
}

// ================== 渲染總權重 ==================
function renderTotalWeights(){
  const div = document.getElementById('totalWeightsDiv');
  div.innerHTML = '<h4>各職務權重加總</h4>';
  const totals = calcTotalWeights();
  jobKeys.forEach(job=>{
    const p = document.createElement('p');
    const cWarn = (totals[job].性格>1 || totals[job].實際>1)?' ⚠ 超過 1！':'';
    p.textContent = `${job} -> 性格: ${totals[job].性格}, 實際: ${totals[job].實際}${cWarn}`;
    if(cWarn) p.style.color='red';
    div.appendChild(p);
  });
}

// ================== 儲存設定 ==================
document.getElementById('saveWeightsBtn').onclick = ()=>{
  localStorage.setItem('personalityWeights',JSON.stringify(personalityWeights));
  localStorage.setItem('practicalWeights',JSON.stringify(practicalWeights));
  alert('權重已儲存！');
}

// ================== 初始化 ==================
renderWeights();
loadQuiz();
