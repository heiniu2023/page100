// FastextBar: renders the four coloured link labels for the current page.
// Lives in the #fastext-bar element below the screen; dimmed when no target.
export function renderFastextBar(bar, fastext) {
  if (!bar) return;
  bar.innerHTML = '';
  (fastext || []).forEach((link) => {
    const b = document.createElement('button');
    b.className = `ft ft-${link.color}`;
    b.textContent = link.label || '—';
    b.disabled = link.target == null;
    if (link.target != null) b.dataset.target = link.target;
    bar.appendChild(b);
  });
}
