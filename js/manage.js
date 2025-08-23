// ================== 模擬員工資料 ==================
let employees = [];
let personalityResults = [];

function loadData() {
  const cacheBuster = `?v=${Date.now()}`;
  Promise.all([
    fetch(`data/employees.json${cacheBuster}`).then(res => res.json()),
    fetch(`data/results.json${cacheBuster}`).then(res => res.json())
  ]).then(([empData, resData]) => {
    employees = empData;
    personalityResults = resData;

    employees.forEach(emp => {
      const p = personalityResults.find(r => r.employee_id === emp.序號);
      if(p){
        emp.EI = p.EI;
        emp.SN = p.SN;
        emp.TF = p.TF;
        emp.JP = p.JP;
        emp.type = p.type;
      } else {
        emp.EI = 0;
        emp.SN = 0;
        emp.TF = 0;
        emp.JP = 0;
        emp.type = '';
      }
    });

    renderTargetsPanel();
    renderFitTable();
  });
}

// 頁面初次載入
loadData();
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
      renderQuizManage();   // 題庫管理用
      renderQuizQuestions(); // 測驗用
    })
    .catch(err=>{
      console.error("題庫讀取失敗:", err);
      questions = [];
      renderQuizManage();
      renderQuizQuestions();
    });
}

// ===== 渲染題庫管理頁 =====
function renderQuizManage() {
  const div = document.getElementById('quizManageDiv');
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
      renderQuizManage();
    });
  });
}

document.getElementById('addQuestionBtn').addEventListener('click', ()=>{
  questions.push({question:"新題目", dimension:"EI", reverse:false});
  renderQuizManage();
});

document.getElementById('saveQuizBtn').addEventListener('click', ()=>{
  localStorage.setItem('mbtiQuestions',JSON.stringify(questions));
  alert('題庫已儲存到 localStorage！');
});

// ===== MBTI 測驗頁 =====
function renderQuizQuestions(){
  const div = document.getElementById('quizQuestions');
  div.innerHTML = '';
  questions.forEach((q,i)=>{
    const row = document.createElement('div');
    row.className='quizRow';
    row.innerHTML = `
      <p>${i+1}. ${q.question}</p>
      <label><input type="radio" name="q${i}" value="1"> 非常同意</label>
      <label><input type="radio" name="q${i}" value="0.5"> 同意</label>
      <label><input type="radio" name="q${i}" value="0"> 普通</label>
      <label><input type="radio" name="q${i}" value="-0.5"> 不同意</label>
      <label><input type="radio" name="q${i}" value="-1"> 非常不同意</label>
    `;
    div.appendChild(row);
  });
}

document.getElementById('submitQuizBtn').addEventListener('click', ()=>{
  let scores = {EI:0, SN:0, TF:0, JP:0};
  let counts = {EI:0, SN:0, TF:0, JP:0};

  questions.forEach((q,i)=>{
    const radios = document.getElementsByName('q'+i);
    let val = 0.5; // 預設中立
    radios.forEach(r=>{
      if(r.checked) {
        if(r.value === "1") val = 1;
        if(r.value === "0.5") val = 0.75;
        if(r.value === "0") val = 0.5;
        if(r.value === "-0.5") val = 0.25;
        if(r.value === "-1") val = 0;
      }
    });
    if(q.reverse) val = 1 - val; // 反向題處理

    scores[q.dimension] += val;
    counts[q.dimension] += 1;
  });

  // 正規化成 0~1 (平均分數)
  for(let dim in scores){
    if(counts[dim] > 0) scores[dim] = scores[dim] / counts[dim];
    else scores[dim] = 0.5; // 沒題目就給中立
  }

  // 轉成 MBTI 四字母
  const type =
    (scores.EI>=0.5?'E':'I') +
    (scores.SN>=0.5?'S':'N') +
    (scores.TF>=0.5?'T':'F') +
    (scores.JP>=0.5?'J':'P');

  // 顯示結果
  document.getElementById('quizResult').innerHTML = `
    <div>EI = ${scores.EI.toFixed(2)}</div>
    <div>SN = ${scores.SN.toFixed(2)}</div>
    <div>TF = ${scores.TF.toFixed(2)}</div>
    <div>JP = ${scores.JP.toFixed(2)}</div>
    <br>
    👉 判斷類型: <span style="color:#007bff; font-weight:bold">${type}</span>
  `;

  // ✅ 自動帶入「即時測試」Tab 的輸入框
  document.getElementById('testEI').value = scores.EI.toFixed(2);
  document.getElementById('testSN').value = scores.SN.toFixed(2);
  document.getElementById('testTF').value = scores.TF.toFixed(2);
  document.getElementById('testJP').value = scores.JP.toFixed(2);
});



// ================== 即時測試功能 ==================
document.getElementById('runTestBtn').addEventListener('click', ()=>{
  const emp = {
    EI: parseFloat(document.getElementById('testEI').value) || 0,
    SN: parseFloat(document.getElementById('testSN').value) || 0,
    TF: parseFloat(document.getElementById('testTF').value) || 0,
    JP: parseFloat(document.getElementById('testJP').value) || 0
  };

  let results = jobKeys.map(job=>{
    const dist = calcDistance(emp, job);
    const scores = calcFitScores(emp);
    return `${jobNames[job]}: 適合度 = ${scores[job].toFixed(2)}% 距離 = ${dist.toFixed(2)}`;
  }).join('<br>');

  const bestJob = getRecommendation(emp);

  const resultBox = document.getElementById('testResult');
  resultBox.style.display = "block";   // 顯示
  resultBox.innerHTML = results + 
    `<br><br>👉 最推薦職務: <span>${jobNames[bestJob]}</span>`;
});


// ================== 欄位分類 ==================
const personalityFields = ['EI','SN','TF','JP'];

const jobNames = {internal:'內勤', operation:'作業', sales:'業務'};
const jobKeys = Object.keys(jobNames);

// ================== 職務理想 MBTI 向量 ==================
let personalityTargets = {
  internal:  {EI:0.40, SN:0.37, TF:0.99, JP:0.60},
  operation: {EI:0.25, SN:0.90, TF:1, JP:0.82},
  sales:     {EI:1, SN:0.92, TF:0.76, JP:0.90}
};

// ================== 渲染控制面板 ==================
function renderTargetsPanel(){
  const div = document.getElementById('targetsDiv');

  jobKeys.forEach(job=>{
    const jobDiv = document.createElement('div');
    jobDiv.className = 'jobTarget';
    jobDiv.innerHTML = `<h4>${jobNames[job]}</h4>`;

    personalityFields.forEach(dim=>{
      const wrapper = document.createElement('span');
      wrapper.style.marginRight = "50px";   // 每個輸入間距
      wrapper.innerHTML = `${dim}: `;
    
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 0; input.max = 1; input.step = 0.05;
      input.value = personalityTargets[job][dim];
      // input.style.width = "100px"; // 適合投影幕的大小
      input.className = 'targetInput';
      input.addEventListener('input', ()=>{
        personalityTargets[job][dim] = parseFloat(input.value) || 0;
        renderFitTable();
      });
    
      wrapper.appendChild(input);
      jobDiv.appendChild(wrapper);
    });
    

    div.appendChild(jobDiv);
  });

  // 儲存按鈕
  const saveBtn = document.createElement('button');
  saveBtn.textContent = "儲存設定";
  saveBtn.onclick = ()=>{
    localStorage.setItem('personalityTargets', JSON.stringify(personalityTargets));
    alert('理想向量已儲存！');
  };
  div.appendChild(saveBtn);

  // 如果有 localStorage 設定，讀取回來
  const saved = localStorage.getItem('personalityTargets');
  if(saved){
    personalityTargets = JSON.parse(saved);
  }
}

// ================== 計算距離 ==================
function calcDistance(emp, job){
  const target = personalityTargets[job];
  let sumSq = 0;
  personalityFields.forEach(dim=>{
    const val = emp[dim];
    const t = target[dim];
    sumSq += Math.pow(val - t, 2);
  });
  return Math.sqrt(sumSq); // <-- 保持原始距離 (不四捨五入)
}
// ================== 適配度分數 (倒數 + 比率) ==================
function calcFitScores(emp){
  const epsilon = 1e-6;
  let scores = {};
  let sumScore = 0;

  jobKeys.forEach(job=>{
    const dist = calcDistance(emp, job);
    const score = 1 / (dist + epsilon); // 距離轉倒數
    scores[job] = score;
    sumScore += score;
  });

  // 正規化成比例
  jobKeys.forEach(job=>{
    scores[job] = scores[job] / sumScore;
  });

  return scores; // {internal:0.3, operation:0.2, sales:0.5}
}


// ================== 推薦職務 ==================
function getRecommendation(emp){
  const scores = calcFitScores(emp);
  return Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0]; // 取最高分職務
}

// ================== 渲染適配度表格 ==================
function renderFitTable(){
  const tbody = document.querySelector('#fitTable tbody');
  tbody.innerHTML='';

  employees.forEach(emp=>{
    const scores = calcFitScores(emp);

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${emp.序號}</td>` +
      jobKeys.map(job=>{
        const ratio = (scores[job]*100).toFixed(1);
        return `<td>
          <div class="fit-bar" style="width:${ratio}%">${ratio}%</div>
        </td>`;
      }).join('');

    const bestJob = getRecommendation(emp);
    tr.innerHTML += `<td style="font-weight:bold;color:#ff6600;font-size:22px">
      ${jobNames[bestJob]}
    </td>`;
    tbody.appendChild(tr);
  });
}


// ================== 初始化 ==================
loadQuiz();
