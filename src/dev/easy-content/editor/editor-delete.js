const button = document.querySelector('#delete-top');
if (button) {
  const api = '/__easy-content/api';
  let token = '';
  let context;
  let revision = '';
  async function load() {
    const contextResponse = await fetch(`${api}/context?path=${encodeURIComponent(location.pathname)}`);
    const contextData = await contextResponse.json();
    if (!contextResponse.ok || !['project', 'article'].includes(contextData.context?.type) || contextData.context?.mode === 'new') return;
    token = contextData.token;
    context = contextData.context;
    const entityResponse = await fetch(`${api}/read?context=${encodeURIComponent(JSON.stringify(context))}`, { headers: { 'x-easy-content-token': token } });
    const entityData = await entityResponse.json();
    if (!entityResponse.ok) return;
    revision = entityData.entity.revision;
    button.classList.remove('hidden');
  }
  button.addEventListener('click', async () => {
    if (!context || !revision || !confirm(`Move this ${context.type} to local trash? Child articles and incoming references block project deletion.`)) return;
    const response = await fetch(`${api}/delete-entity`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-easy-content-token': token }, body: JSON.stringify({ context, expectedRevision: revision }) });
    const data = await response.json();
    if (!response.ok) { document.querySelector('#status-message').textContent = data.error || 'Deletion failed'; document.querySelector('#status-message').classList.add('is-error'); return; }
    location.assign('/dev/content/');
  });
  load().catch(() => {});
}
