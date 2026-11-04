(() => {
  const videos = [...document.querySelectorAll('video')];
  const featureVideos = [...document.querySelectorAll('[data-film]')];
  videos.forEach(video => video.addEventListener('play', () => {
    videos.forEach(other => { if (other !== video) other.pause(); });
  }));
  featureVideos.forEach(video => {
    video.controls = false;
    const player = video.closest('.film-player');
    const button = player.querySelector('.film-cover');
    const error = player.parentElement.querySelector('.film-error');
    button.addEventListener('click', async () => {
      error.hidden = true;
      button.hidden = true;
      player.classList.add('is-started');
      video.controls = true;
      try { await video.play(); video.focus({ preventScroll: true }); }
      catch { button.hidden = false; player.classList.remove('is-started'); error.hidden = false; }
    });
    video.addEventListener('error', () => { error.hidden = false; button.hidden = false; });
  });
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (!entry.isIntersecting) entry.target.pause(); });
    }, { threshold: 0.08 });
    featureVideos.forEach(video => visibility.observe(video));
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach(video => video.pause()); });
  const rail = document.querySelector('.film-rail');
  const dots = [...document.querySelectorAll('.film-pager button')];
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    const card = rail.children[i];
    const first = rail.children[0];
    rail.scrollTo({ left: card.offsetLeft - first.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));
  if (rail) rail.addEventListener('scroll', () => {
    const index = rail.scrollLeft > rail.children[0].offsetWidth / 2 ? 1 : 0;
    dots.forEach((dot,i) => dot.setAttribute('aria-pressed',String(i===index)));
  }, { passive: true });
})();
