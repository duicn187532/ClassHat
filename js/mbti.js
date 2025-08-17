let questions = [];

async function loadQuestions() {
  try {
    const response = await fetch('data/questions.json');
    questions = await response.json();
    renderQuiz();
  } catch(err) { console.error('讀取題庫失敗:', err); }
}

function renderQuiz() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
  
    questions.forEach((q, i) => {
      const div = document.createElement('div');
      div.className = 'question';
  
      // 題目文字
      const p = document.createElement('p');
      p.textContent = `${i+1}. ${q.question}`;
      div.appendChild(p);
  
      // 建立 1~5 的 radio 按鈕
      for (let val = 1; val <= 5; val++) {
        const label = document.createElement('label');
        label.style.marginRight = '10px';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `q${i}`;
        radio.value = val;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(val));
        div.appendChild(label);
      }
  
      quizDiv.appendChild(div);
    });
  }
  

async function submitQuiz() {
  const employeeId = document.getElementById('employeeId').value.trim();
  if(!employeeId){ alert('請輸入員工ID'); return; }

  const scores = { EI:0, SN:0, TF:0, JP:0 };
  const counts = { EI:0, SN:0, TF:0, JP:0 };

  questions.forEach((q,i) => {
    let val = parseInt(document.querySelector(`input[name="q${i}"]:checked`)?.value || 3);
    if(q.reverse) val = 6 - val;
    scores[q.dimension] += val;
    counts[q.dimension] += 5;
  });

  const results = {};
  for(let d in scores) results[d] = scores[d]/counts[d];
  const type = (results.EI>0.5?'E':'I') +
               (results.SN>0.5?'S':'N') +
               (results.TF>0.5?'T':'F') +
               (results.JP>0.5?'J':'P');

  document.getElementById('result').innerHTML = `測驗結果: ${type} <br>` +
    `四維度得分: EI=${results.EI.toFixed(2)}, SN=${results.SN.toFixed(2)}, TF=${results.TF.toFixed(2)}, JP=${results.JP.toFixed(2)}`;

  // 雷達圖
  const ctx = document.getElementById('radarChart').getContext('2d');
  if(window.radarChart) window.radarChart.destroy();
  window.radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['EI','SN','TF','JP'],
      datasets: [{ label:'四維度得分', data:[results.EI, results.SN, results.TF, results.JP],
        backgroundColor:'rgba(255,127,80,0.2)', borderColor:'rgba(255,127,80,1)', pointBackgroundColor:'rgba(255,127,80,1)'
      }]
    },
    options: { scales: { r:{ min:0, max:1 } } }
  });

  // 模擬結果存入 results.json（實際可透過後端 API）
  console.log("JSON 輸出:", { employeeId, results, type });
}

loadQuestions();
