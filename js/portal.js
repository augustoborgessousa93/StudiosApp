const state = { tools: [], query: '', category: 'Todas' };

const categoryMeta = {
  'Criar': { icon: '✦', bg: '#fff1db' },
  'Jogos': { icon: '◆', bg: '#eee8ff' },
  'Avaliação': { icon: '✓', bg: '#eaf3ff' },
  'Revisar': { icon: '↻', bg: '#eafeaf' },
  'Interatividade': { icon: '↗', bg: '#e5fbfd' },
  'Organizar': { icon: '≡', bg: '#f2f4f8' }
};

const normalize = (value = '') => value.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

async function loadTools() {
  try {
    const response = await fetch('./data/tools.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Não foi possível carregar o catálogo.');
    state.tools = (await response.json()).filter(tool => tool.status === 'active');
    renderCategories();
    renderFilters();
    renderTools();
  } catch (error) {
    console.error(error);
    document.querySelector('#toolsGrid').innerHTML = '<div class="empty-state" style="display:block;grid-column:1/-1"><h3>O catálogo não carregou.</h3><p>Atualize a página para tentar novamente.</p></div>';
  }
}

function allCategories() {
  return [...new Set(state.tools.flatMap(tool => tool.category || []))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function renderCategories() {
  const container = document.querySelector('#categoryChips');
  const preferred = ['Criar', 'Jogos', 'Avaliação', 'Revisar', 'Interatividade', 'Organizar'];
  container.innerHTML = preferred.map(name => {
    const meta = categoryMeta[name];
    return `<button class="quick-card" type="button" data-category="${name}" aria-label="Ver ferramentas de ${name}">
      <span class="quick-icon" style="background:${meta.bg}">${meta.icon}</span>
      <strong>${name}</strong>
    </button>`;
  }).join('');

  container.querySelectorAll('[data-category]').forEach(button => {
    button.addEventListener('click', () => setCategory(button.dataset.category));
  });
}

function renderFilters() {
  const categories = ['Todas', ...allCategories()];
  document.querySelector('#filterRow').innerHTML = categories.map(category =>
    `<button class="filter-chip ${state.category === category ? 'active' : ''}" type="button" data-filter="${category}" aria-pressed="${state.category === category}">${category}</button>`
  ).join('');

  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => setCategory(button.dataset.filter));
  });
}

function setCategory(category) {
  state.category = category;
  renderFilters();
  renderTools();
  document.querySelector('#ferramentas').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function searchableText(tool) {
  return normalize([
    tool.name,
    tool.description,
    ...(tool.category || []),
    ...(tool.subjects || []),
    ...(tool.schoolStages || []),
    ...(tool.grades || []),
    ...(tool.tags || [])
  ].join(' '));
}

function filteredTools() {
  const query = normalize(state.query.trim());
  return state.tools.filter(tool => {
    const categoryMatch = state.category === 'Todas' || (tool.category || []).includes(state.category);
    const searchMatch = !query || searchableText(tool).includes(query);
    return categoryMatch && searchMatch;
  });
}

function coverIcon(tool) {
  if (tool.coverType === 'video') return '▶';
  return '✦';
}

function toolCard(tool) {
  const primaryCategory = tool.category?.[0] || 'Ferramenta';
  const stages = (tool.schoolStages || []).slice(0, 2).join(' • ');
  return `<article class="tool-card">
    <div class="tool-cover" aria-hidden="true"><div class="cover-icon">${coverIcon(tool)}</div></div>
    <div class="tool-body">
      <div class="tool-topline">
        <span class="badge">${primaryCategory}</span>
        ${tool.new ? '<span class="badge new-badge">Novo</span>' : ''}
      </div>
      <h3>${tool.name}</h3>
      <p>${tool.description}</p>
      <div class="tool-meta">
        <span>${stages}</span>
        <span>•</span>
        <span>${tool.estimatedTime || 'Uso rápido'}</span>
      </div>
      <div class="tool-actions">
        <a class="btn btn-primary" href="${tool.url}" aria-label="Usar ${tool.name} agora">Usar agora</a>
      </div>
    </div>
  </article>`;
}

function renderTools() {
  const tools = filteredTools();
  const grid = document.querySelector('#toolsGrid');
  const empty = document.querySelector('#emptyState');
  const count = document.querySelector('#resultCount');

  count.textContent = `${tools.length} ${tools.length === 1 ? 'ferramenta encontrada' : 'ferramentas encontradas'}`;
  grid.innerHTML = tools.map(toolCard).join('');
  empty.hidden = tools.length !== 0;
}

function submitSearch(event) {
  event.preventDefault();
  state.query = document.querySelector('#searchInput').value;
  state.category = 'Todas';
  renderFilters();
  renderTools();
  document.querySelector('#ferramentas').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelector('#heroSearch').addEventListener('submit', submitSearch);
document.querySelector('#searchInput').addEventListener('input', event => {
  state.query = event.target.value;
  if (!state.query) renderTools();
});
document.querySelector('#openSearch').addEventListener('click', () => {
  document.querySelector('#searchInput').focus();
  document.querySelector('#inicio').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.querySelector('#clearFilters').addEventListener('click', () => {
  state.query = '';
  state.category = 'Todas';
  document.querySelector('#searchInput').value = '';
  renderFilters();
  renderTools();
});

loadTools();