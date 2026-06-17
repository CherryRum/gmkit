
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tabs]').forEach(wrap => {
    const name = wrap.getAttribute('data-tabs');
    const tabs = wrap.querySelectorAll('[data-tab]');
    const panels = document.querySelectorAll(`[data-panel="${name}"]`);
    tabs.forEach(tab => tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => p.classList.toggle('hide', p.getAttribute('data-key') !== key));
    }));
  });
  document.querySelectorAll('[data-langs]').forEach(wrap => {
    const name = wrap.getAttribute('data-langs');
    const tabs = wrap.querySelectorAll('[data-lang]');
    const panels = document.querySelectorAll(`[data-lang-panel="${name}"]`);
    tabs.forEach(tab => tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-lang');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => p.classList.toggle('hide', p.getAttribute('data-lang-key') !== key));
    }));
  });
  document.querySelectorAll('[data-copy-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = document.querySelector(btn.getAttribute('data-copy-target'));
      if (!el) return;
      const text = (el.value || el.textContent || '').trim();
      if (!text) return;
      navigator.clipboard?.writeText(text);
      const old = btn.textContent;
      btn.textContent = '已复制';
      setTimeout(() => btn.textContent = old, 1200);
    });
  });
});
