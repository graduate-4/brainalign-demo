(() => {
  'use strict';

  const app = document.getElementById('app');
  const rows = [];

  const storyPages = [
    `<div class="study-card">
      <h2>Story</h2>
      <p>Nora worked in the administrative office of a small research foundation and had recently been handling a batch of fellowship applications. One morning, she received a message that an invited speaker had mistakenly gone to the wrong building and would arrive later than expected. Nora rescheduled the speaker’s seminar for later that afternoon and updated the office calendar.</p>
      <p>Once that was settled, she turned to the fellowship applications. She needed to prepare the final folders for two candidates, Chen and Patel. Each folder contained a research proposal, a CV, recommendation letters, and several administrative forms. Nora placed the two folders side by side on her desk and began attaching the candidates’ name labels.</p>
      <p>As she was attaching the candidates’ name labels, the office phone rang. Nora answered the call while continuing to work on the folders. During the call, she accidentally attached Chen’s label to Patel’s folder and Patel’s label to Chen’s folder. Not noticing the mistake, she placed both folders with the other completed applications.</p>
    </div>`,
    `<div class="study-card">
      <h2>Story</h2>
      <p>Later that morning, Nora attended a staff meeting about the fellowship review schedule. The committee planned to begin evaluating applications the following week, and several staff members discussed how to distribute the files among reviewers. Nora took notes during the meeting and agreed to prepare a spreadsheet showing which reviewer would receive each application.</p>
      <p>After the meeting, she returned to her desk and spent some time answering emails. Several applicants had written with questions about when decisions would be announced. Nora replied that the first round of reviews would take approximately two weeks. She then updated the program website with a short notice explaining the expected timeline.</p>
      <p>Around lunchtime, Chen called the office to confirm that an additional recommendation letter had arrived. Nora checked the electronic submission system and confirmed that the letter had been received. She told Chen that the application was complete and would soon be forwarded to the review committee.</p>
    </div>`,
    `<div class="study-card">
      <h2>Story</h2>
      <p>That afternoon, Patel sent an email asking whether minor formatting changes could still be made to the research proposal. Nora explained that the submission deadline had already passed and that the committee would review the version currently on file. Patel thanked her for the clarification and said no further changes were necessary.</p>
      <p>Over the next two days, the office was busy with several unrelated tasks. Nora helped organize a workshop for previous fellowship recipients, prepared reimbursement forms for invited speakers, and assisted a colleague who was updating the foundation’s contact database. She also spent several hours checking whether all fellowship applicants had submitted the required documents.</p>
      <p>On Thursday afternoon, another staff member collected the completed application folders from Nora’s desk and placed them in a cabinet for delivery to the review committee. Nora was working on another project at the time and did not reopen the folders. The following morning, the folders were delivered to the committee together with applications from several other candidates.</p>
    </div>`,
    `<div class="study-card">
      <h2>Story</h2>
      <p>The committee did not begin reviewing the applications immediately. Its members first met to discuss the evaluation criteria and decide how much weight should be given to research quality, feasibility, and potential impact. Each reviewer was assigned several applications and asked to submit preliminary comments before the next meeting.</p>
      <p>Several days later, one of the reviewers began reading Chen’s application. The cover sheet on the folder clearly displayed Chen’s name. However, after opening the folder and beginning to read the research proposal, the reviewer noticed something unexpected: the proposal described a project on urban water management, even though Chen’s stated research area was computational linguistics. The reviewer checked the first page again and saw that the proposal itself was written by Patel.</p>
      <p>The reviewer contacted the administrative office to report the problem.</p>
    </div>`
  ];

  const questions = [
    {order: 1, type: 'non_causal_retrieval', text: 'What had happened to the invited speaker?'},
    {order: 2, type: 'causal_relevant_retrieval', text: 'What happened while Nora was answering the phone?'},
    {order: 3, type: 'causal_integration', text: 'How did Patel’s proposal most likely end up in the folder marked with Chen’s name?'}
  ];

  function render(html) {
    app.innerHTML = html;
  }

  function addButtonHandler(id, fn) {
    document.getElementById(id).addEventListener('click', fn, {once: true});
  }

  function showInstructions() {
    render(`<div class="study-card">
      <h1>Long-Range Narrative Understanding</h1>
      <p>You will first read a short narrative. Please read it carefully at your normal pace.</p>
      <p>After the story, you will answer three questions one at a time.</p>
      <p><strong>When you have understood a question, press the SPACE BAR once. You do not need to have thought of the answer yet.</strong></p>
      <p><strong>When you have thought of your answer, press the SPACE BAR again.</strong></p>
      <p>After the first press, the question will remain on the screen and a short thinking prompt will appear. After the second press, a text box will appear so that you can type the answer you had in mind.</p>
      <button id="begin">Begin</button>
    </div>`);
    addButtonHandler('begin', () => showStoryPage(0));
  }

  function showStoryPage(i) {
    const label = i === storyPages.length - 1 ? 'Continue to questions' : 'Continue';
    render(storyPages[i].replace('</div>', `<button id="next-story">${label}</button></div>`));
    addButtonHandler('next-story', () => {
      if (i + 1 < storyPages.length) showStoryPage(i + 1);
      else showQuestion(0);
    });
  }

  function showQuestion(i) {
    const q = questions[i];
    render(`<div class="question-wrap"><div class="question-text">${q.text}</div></div>`);

    let firstPressTime = null;
    let secondPressHandled = false;

    const handler = (event) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      const now = performance.now();

      if (firstPressTime === null) {
        firstPressTime = now;
        render(`<div class="question-wrap"><div class="question-text">${q.text}</div><div class="thinking-note">Thinking… Press SPACE when you have your answer.</div></div>`);
        return;
      }

      if (secondPressHandled) return;
      secondPressHandled = true;
      const rt = Math.round(now - firstPressTime);
      document.removeEventListener('keydown', handler);
      showAnswerBox(i, q, rt);
    };

    document.addEventListener('keydown', handler);
  }

  function showAnswerBox(i, q, rt) {
    render(`<div class="answer-panel">
      <label for="answer-box">Please type the answer you had in mind.</label>
      <textarea id="answer-box"></textarea>
      <button id="submit-answer">Continue</button>
    </div>`);

    const answerBox = document.getElementById('answer-box');
    answerBox.focus();

    const submit = () => {
      const response = answerBox.value.trim();
      if (!response) {
        answerBox.focus();
        return;
      }
      rows.push({
        question_order: q.order,
        question_type: q.type,
        question: q.text,
        response_text: response,
        retrieval_integration_rt_ms: rt
      });
      if (i + 1 < questions.length) showQuestion(i + 1);
      else showFinished();
    };

    document.getElementById('submit-answer').addEventListener('click', submit);
    answerBox.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit();
    });
  }

  function csvEscape(value) {
    const s = value == null ? '' : String(value);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function makeCsv() {
    const headers = ['question_order','question_type','question','response_text','retrieval_integration_rt_ms'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push(headers.map(h => csvEscape(r[h])).join(','));
    }
    return lines.join('\n');
  }

  function downloadResults() {
    const blob = new Blob([makeCsv()], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainalign_human_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showFinished() {
    render(`<div class="study-card">
      <h2>Finished</h2>
      <p>Thank you. Click the button below to download your response file.</p>
      <button id="finish">Finish</button>
    </div>`);
    addButtonHandler('finish', () => {
      downloadResults();
      document.getElementById('finish').disabled = true;
      document.getElementById('finish').textContent = 'Downloaded';
    });
  }

  showInstructions();
})();
