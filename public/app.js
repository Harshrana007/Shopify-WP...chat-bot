const suggestions = [
  'What does research say about BPC-157?',
  'Compare BPC-157 and thymosin alpha-1',
  'What human studies are available?',
  'What are the evidence limitations?'
];

function setSuggestions(containerId, list = suggestions) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = list
    .map((item) => `<button type="button" class="suggestion" data-question="${item}">${item}</button>`)
    .join('');

  container.querySelectorAll('.suggestion').forEach((button) => {
    button.addEventListener('click', () => sendQuestion(button.dataset.question));
  });
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function renderChatMessage(role, html) {
  const target = document.getElementById('chatBody');
  if (!target) return;

  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  row.innerHTML = `<div class="message ${role}">${html}</div>`;
  target.appendChild(row);
  target.scrollTop = target.scrollHeight;
}

function renderFloatingChatMessage(role, html) {
  const target = document.getElementById('floatingChatBody');
  if (!target) return;

  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  row.innerHTML = `<div class="message ${role}">${html}</div>`;
  target.appendChild(row);
  target.scrollTop = target.scrollHeight;
}

function getSmartRecommendations(question = '') {
  return suggestions;
}

function renderAssistantGuidance(question = '') {
  // Guidance is handled by the server-side intent detection.
}

function buildAssistantHtml(response = {}) {
  const citations = Array.isArray(response.citations) ? response.citations : [];
  const evidenceLevel = response.evidenceLevel || 'Research review';
  const hasEvidence = citations.length > 0;
  const responseType = response.responseType || 'research';

  const baseCard = `
    <div class="research-structure">
      <div class="research-section">
        <h4>${responseType === 'greeting' ? 'Assistant' : responseType === 'capabilities' ? 'What I can do' : responseType === 'boundary' ? 'Scope' : responseType === 'clarification' ? 'Clarification' : responseType === 'comparison' ? 'Comparison' : responseType === 'human_studies' ? 'Human research' : responseType === 'limitations' ? 'Evidence limitations' : 'What the research says'}</h4>
        <p>${String(response.answer || '').replace(/\n/g, '<br>')}</p>
      </div>
      ${responseType !== 'greeting' && responseType !== 'capabilities' && responseType !== 'boundary' && responseType !== 'clarification' ? `
        <div class="evidence-grid">
          <div class="evidence-chip"><strong>Evidence level</strong>${evidenceLevel}</div>
          <div class="evidence-chip"><strong>Sources used</strong>${citations.length}</div>
          <div class="evidence-chip"><strong>Confidence</strong>${response.confidence || 'low'}</div>
        </div>
      ` : ''}
      ${response.whyThisAnswer ? `<div class="research-section"><h4>Why this answer?</h4><p>${response.whyThisAnswer}</p></div>` : ''}
      ${hasEvidence ? `<div class="research-section"><h4>Sources</h4><ul class="message-citation-list">${citations.map((source) => `<li><span>•</span><button type="button" data-source-id="${source.id}">View source</button></li>`).join('')}</ul></div>` : ''}
      ${responseType === 'comparison' && Array.isArray(response.comparisonItems) ? `<div class="research-section"><h4>Items compared</h4><p>${response.comparisonItems.join(' • ')}</p></div>` : ''}
      ${responseType === 'human_studies' && Array.isArray(response.citations) && response.citations.length ? `<div class="research-section"><h4>Study list</h4><ul class="message-citation-list">${response.citations.map((source) => `<li><span>•</span><button type="button" data-source-id="${source.id}">${source.title}</button></li>`).join('')}</ul></div>` : ''}
      <div class="message-meta">
        <button type="button" class="btn btn-ghost" data-copy-answer="${String(response.answer || '').replace(/"/g, '&quot;')}">Copy answer</button>
        ${response.whyThisAnswer ? `<button type="button" class="btn btn-ghost" data-why="${String(response.whyThisAnswer).replace(/"/g, '&quot;')}">Why this answer?</button>` : ''}
      </div>
    </div>
  `;

  return baseCard;
}

async function sendQuestion(question) {
  const trimmed = String(question || '').trim();
  if (!trimmed) return;

  renderChatMessage('user', `<p>${trimmed}</p>`);
  renderFloatingChatMessage('user', `<p>${trimmed}</p>`);

  const chatInput = document.getElementById('chatInput');
  if (chatInput) chatInput.value = '';

  const floatingInput = document.getElementById('floatingChatInput');
  if (floatingInput) floatingInput.value = '';

  const loaderHtml = '<p><strong>Searching research sources...</strong></p><p>Reviewing the relevant evidence and preparing a cited response.</p>';
  renderChatMessage('assistant', loaderHtml);
  renderFloatingChatMessage('assistant', loaderHtml);

  try {
    const response = await fetchJSON('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: trimmed })
    });

    const assistantHtml = buildAssistantHtml(response);

    const target = document.getElementById('chatBody');
    const floatingTarget = document.getElementById('floatingChatBody');
    if (target) {
      const lastAssistant = [...target.querySelectorAll('.message.assistant')].at(-1);
      if (lastAssistant) lastAssistant.innerHTML = assistantHtml;
    }
    if (floatingTarget) {
      const lastAssistant = [...floatingTarget.querySelectorAll('.message.assistant')].at(-1);
      if (lastAssistant) lastAssistant.innerHTML = assistantHtml;
    }

    bindInteractiveButtons();
  } catch (error) {
    const fallback = '<p>The research assistant is temporarily unavailable. Please try again shortly.</p>';
    if (document.getElementById('chatBody')) {
      const lastAssistant = [...document.getElementById('chatBody').querySelectorAll('.message.assistant')].at(-1);
      if (lastAssistant) lastAssistant.innerHTML = fallback;
    }
    if (document.getElementById('floatingChatBody')) {
      const lastAssistant = [...document.getElementById('floatingChatBody').querySelectorAll('.message.assistant')].at(-1);
      if (lastAssistant) lastAssistant.innerHTML = fallback;
    }
    showGuidedPopup({
      title: 'Research assistant unavailable',
      message: 'The assistant is temporarily unavailable. Please retry in a moment or rephrase the research question.',
      kind: 'error',
      buttonText: 'Retry'
    });
    console.error(error);
  }
}

function showGuidedPopup({ title = 'Research assistant', message = '', kind = 'info', buttonText = 'OK' }) {
  const host = document.getElementById('researchPopupHost');
  if (!host) return;

  const shell = document.createElement('div');
  shell.className = 'research-popup-shell';

  const kindMap = {
    info: { icon: '✦', label: 'Research' },
    warning: { icon: '⚠', label: 'Notice' },
    error: { icon: '⛔', label: 'Error' },
    success: { icon: '✓', label: 'Updated' }
  };

  const kindMeta = kindMap[kind] || kindMap.info;

  shell.innerHTML = `
    <div class="research-popup" data-kind="${kind}">
      <div class="research-popup-header">
        <div class="research-popup-icon">${kindMeta.icon}</div>
        <h3 class="research-popup-title">${title}</h3>
      </div>
      <p class="research-popup-body">${message}</p>
      <div class="research-popup-actions">
        <button type="button" class="btn btn-primary" data-close-popup>${buttonText}</button>
      </div>
    </div>
  `;

  host.appendChild(shell);

  const closeButton = shell.querySelector('[data-close-popup]');
  closeButton.addEventListener('click', () => {
    shell.classList.add('hidden');
    setTimeout(() => shell.remove(), 200);
  });

  return shell;
}

function showResearchToast({ title = 'Research update', message = '', kind = 'info' }) {
  const host = document.getElementById('researchPopupHost');
  if (!host) return;

  const toastHost = host.querySelector('.research-toast-stack') || (() => {
    const node = document.createElement('div');
    node.className = 'research-toast-stack';
    host.appendChild(node);
    return node;
  })();

  const toast = document.createElement('div');
  toast.className = 'research-toast';
  toast.dataset.kind = kind;
  toast.innerHTML = `<h4>${title}</h4><p>${message}</p>`;
  toastHost.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(18px)';
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function bindInteractiveButtons() {
  document.querySelectorAll('[data-copy-answer]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copyAnswer || '';
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Copied';
        showResearchToast({ title: 'Answer copied', message: 'The response is ready to paste anywhere.', kind: 'success' });
      } catch {
        button.textContent = 'Copy failed';
        showResearchToast({ title: 'Copy unavailable', message: 'Your browser blocked direct copy access. You can still select the text manually.', kind: 'warning' });
      }
    });
  });

  document.querySelectorAll('[data-source-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const source = await fetchJSON(`/api/sources/${button.dataset.sourceId}`);
      openSourceModal(source.source);
    });
  });

  document.querySelectorAll('[data-why]').forEach((button) => {
    button.addEventListener('click', () => {
      const content = button.dataset.why || 'Evidence provenance is available from the research library.';
      showGuidedPopup({
        title: 'Why this answer?',
        message: `${content} This response stays within the configured research scope and is constrained by the current evidence threshold.`,
        kind: 'info',
        buttonText: 'Understood'
      });
    });
  });
}

async function loadLibrary() {
  const list = document.getElementById('sourceList');
  if (!list) return;

  try {
    const data = await fetchJSON('/api/sources');
    renderLibrary(data.sources || []);
  } catch (error) {
    list.innerHTML = '<div class="card"><p>Unable to load research sources right now.</p></div>';
    console.error(error);
  }
}

function renderLibrary(sources) {
  const list = document.getElementById('sourceList');
  if (!list) return;

  if (!sources.length) {
    list.innerHTML = '<div class="card"><h3>No sources match your filters.</h3></div>';
    return;
  }

  list.innerHTML = sources.map((source) => `
    <article class="source-card">
      <div>
        <div class="meta">
          <span class="chip">${source.peptide}</span>
          <span class="chip ${source.evidenceLevel === 'Tier 6' ? 'danger' : source.evidenceLevel === 'Tier 5' ? 'warning' : 'success'}">${source.evidenceLevel}</span>
          <span class="chip">${source.studyType}</span>
        </div>
        <h3>${source.title}</h3>
        <p>${source.authors.join(', ')}</p>
        <p>${source.year} · ${source.journal}</p>
        <p>${source.abstract}</p>
      </div>
      <div>
        <button type="button" class="btn btn-secondary" data-source-view="${source.id}">View source</button>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-source-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      const source = await fetchJSON(`/api/sources/${button.dataset.sourceView}`);
      openSourceModal(source.source);
    });
  });
}

function openSourceModal(source) {
  const modal = document.getElementById('sourceModal');
  const title = document.getElementById('sourceModalTitle');
  const body = document.getElementById('sourceModalBody');

  if (!modal || !title || !body) return;

  title.textContent = source.title;
  body.innerHTML = `
    <div class="meta" style="margin-bottom: 12px;">
      <span class="chip">${source.peptide}</span>
      <span class="chip">${source.evidenceLevel}</span>
      <span class="chip">${source.studyType}</span>
    </div>
    <p><strong>Authors:</strong> ${source.authors.join(', ')}</p>
    <p><strong>Publication:</strong> ${source.year} · ${source.journal}</p>
    <p><strong>DOI:</strong> ${source.doi || 'Not available'}</p>
    <p><strong>PubMed:</strong> ${source.pubmed || 'Not available'}</p>
    <p><strong>URL:</strong> <a href="${source.url}" target="_blank" rel="noreferrer">${source.url || 'No source URL available'}</a></p>
    <p><strong>Abstract:</strong> ${source.abstract}</p>
    <p><strong>Limitations:</strong> ${source.limitations}</p>
    <p><strong>Status:</strong> ${source.status}</p>
  `;
  modal.classList.add('visible');
}

function closeSourceModal() {
  const modal = document.getElementById('sourceModal');
  if (modal) modal.classList.remove('visible');
}

async function loadStats() {
  const statsGrid = document.getElementById('statsGrid');
  if (!statsGrid) return;

  try {
    const stats = await fetchJSON('/api/admin/stats');
    statsGrid.innerHTML = `
      <div class="metric-box"><span>Questions answered</span><strong>${stats.questionsAnswered}</strong></div>
      <div class="metric-box"><span>Sources indexed</span><strong>${stats.totalSources}</strong></div>
      <div class="metric-box"><span>Human studies</span><strong>${stats.humanStudies}</strong></div>
      <div class="metric-box"><span>Preclinical</span><strong>${stats.preclinicalStudies}</strong></div>
      <div class="metric-box"><span>Clinical trials</span><strong>${stats.clinicalTrials}</strong></div>
      <div class="metric-box"><span>Topics</span><strong>${stats.topics}</strong></div>
      <div class="metric-box"><span>Abstentions</span><strong>${stats.abstentions}</strong></div>
      <div class="metric-box"><span>Avg. response</span><strong>${stats.averageResponseTime}</strong></div>
    `;
  } catch (error) {
    statsGrid.innerHTML = '<div class="metric-box"><span>Stats</span><strong>Unavailable</strong></div>';
    console.error(error);
  }
}

async function applyLibraryFilters() {
  const query = document.getElementById('libraryQuery')?.value || '';
  const peptide = document.getElementById('libraryPeptide')?.value || '';
  const evidenceLevel = document.getElementById('libraryEvidence')?.value || '';
  const studyType = document.getElementById('libraryType')?.value || '';

  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (peptide) params.set('peptide', peptide);
  if (evidenceLevel) params.set('evidenceLevel', evidenceLevel);
  if (studyType) params.set('studyType', studyType);

  const data = await fetchJSON(`/api/sources?${params.toString()}`);
  renderLibrary(data.sources || []);
}

function initFloatingChat() {
  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('floatingChatPanel');
  const close = document.getElementById('closeFloatingChat');

  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => panel.classList.toggle('visible'));
  close.addEventListener('click', () => panel.classList.remove('visible'));

  const form = document.getElementById('floatingChatForm');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById('floatingChatInput');
      if (input) sendQuestion(input.value);
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setSuggestions('suggestions');
  setSuggestions('floatingSuggestions');
  loadLibrary();
  loadStats();
  initFloatingChat();

  const form = document.getElementById('chatForm');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById('chatInput');
      if (input) sendQuestion(input.value);
    });
  }

  const applyButton = document.getElementById('applyLibraryFilters');
  if (applyButton) applyButton.addEventListener('click', applyLibraryFilters);

  const modalClose = document.getElementById('closeSourceModal');
  if (modalClose) modalClose.addEventListener('click', closeSourceModal);

  const modal = document.getElementById('sourceModal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeSourceModal();
    });
  }

  try {
    const config = await fetchJSON('/api/configuration');
    const assistantName = document.getElementById('assistantMode');
    if (assistantName) assistantName.textContent = `${config.assistantName} • research mode active`;
  } catch (error) {
    console.error('Unable to load config', error);
  }
});
