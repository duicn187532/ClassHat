// ================== 模擬員工資料 ==================
let employees = [];
fetch('data/employees.json')
  .then(res => res.json())
  .then(data => { employees = data; renderFitTable(); });

// ================== 欄位分類 ==================
const personalityFields = ['EI_score','SN_score','TF_score','JP_score'];
const practicalFields = [
  '管理','財務會計','金融專業','風險管理',
  '人力資源','稽核內控','資訊系統','外語','其他',
  '已歷練職位數','累積訓練時數','累積加班時數',
  '已取得證照張數','進行年資',
];

const jobNames = {deposit:'存款科長', personal:'個金業務', corp:'企金業務', advisor:'理專業務'};
const jobKeys = Object.keys(jobNames);

// ================== 權重初始化 ==================
let personalityWeights = {
  EI_score:0.25, SN_score:0.25, TF_score:0.25, JP_score:0.25
};

let practicalWeights = {
  管理:0.1, 財務會計:0.1, 金融專業:0.1, 風險管理:0.1,
  人力資源:0.05, 稽核內控:0.05, 資訊系統:0.05, 外語:0.05, 其他:0.05,
  已歷練職位數:0.05, 累積訓練時數:0.05, 累積加班時數:0.05,
  已取得證照張數:0.05, 進行年資:0.05, 情緒分數:0.05, 潛力人才:0.05
};

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
        input.value = weightsObj[field] || 0;
        input.addEventListener('input', ()=>{
          weightsObj[field] = parseFloat(input.value) || 0;
          renderTotalWeights();
          renderFitTable();
        });
        rowDiv.appendChild(document.createTextNode(`${job}: `));
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
function calcPersonalityFit(emp){
  return Object.entries(personalityWeights).reduce((sum,[f,w])=>{
    const val = emp[f] || 0;
    return sum + val*w;
  },0).toFixed(2);
}

function calcPracticalFit(emp){
  return Object.entries(practicalWeights).reduce((sum,[f,w])=>{
    let val = emp[f] || 0;
    if(f==='潛力人才') val = val?1:0;
    return sum + val*w;
  },0).toFixed(2);
}

function calcOverallFit(emp){
  const pFit = parseFloat(calcPersonalityFit(emp));
  const rFit = parseFloat(calcPracticalFit(emp));
  // 綜合比例可調整，例如 40%性格 + 60%實際
  return (pFit*0.4 + rFit*0.6).toFixed(2);
}

// ================== 推薦職務 ==================
function getRecommendation(emp){
  const scores = {};
  jobKeys.forEach(job=>{
    scores[job] = calcOverallFit(emp);
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
    tr.innerHTML = `<td>${emp.姓名}</td>` +
      jobKeys.map(job=>{
        return `<td>${calcPersonalityFit(emp)}</td>` +
               `<td>${calcPracticalFit(emp)}</td>` +
               `<td>${calcOverallFit(emp)}</td>`;
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
    const personalitySum = Object.values(personalityWeights).reduce((a,b)=>a+b,0);
    const practicalSum = Object.values(practicalWeights).reduce((a,b)=>a+b,0);
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
