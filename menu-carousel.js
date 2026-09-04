/* NABEYA menu carousel — no dependencies; keeps the static grid as fallback. */
(() => {
  'use strict';
  const root = document.querySelector('.menu-carousel');
  if (!root) return;
  const viewport = root.querySelector('.menu-viewport');
  const track = root.querySelector('.menu-track');
  const originals = [...track.children];
  const count = originals.length;
  if (count < 2) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = root.querySelector('.menu-controls');
  const play = root.querySelector('.menu-play');
  const current = root.querySelector('.menu-current');
  const progress = root.querySelector('.menu-progress i');
  const announcement = root.querySelector('.menu-announcement');
  const copies = Math.min(3, count);
  let index = 0, stride = 0, timer = 0, settleTimer = 0;
  let moving = false, paused = reduce.matches, hovering = false, focused = false;
  let visible = !('IntersectionObserver' in window), gesture = null;
  const logical = () => (index % count + count) % count;
  const stopTimer = () => { clearTimeout(timer); timer = 0; };
  const clone = card => {
    const copy = card.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.setAttribute('inert', '');
    copy.dataset.clone = 'true';
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    return copy;
  };
  originals.slice(-copies).reverse().forEach(card => track.prepend(clone(card)));
  originals.slice(0, copies).forEach(card => track.append(clone(card)));
  originals.forEach((card, n) => {
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', '슬라이드');
    card.setAttribute('aria-label', `${n + 1} / ${count}`);
  });
  root.classList.add('is-ready');
  controls.hidden = false;
  root.querySelector('.menu-total').textContent = String(count).padStart(2, '0');

  function schedule() {
    stopTimer();
    if (paused || hovering || focused || !visible || document.hidden || moving || gesture) return;
    timer = setTimeout(() => move(1, false), 3000);
  }
  function paint(animate = false, offset = 0) {
    track.style.transition = animate && !reduce.matches ? 'transform 800ms cubic-bezier(.22,.61,.36,1)' : 'none';
    track.style.transform = `translate3d(${-(index + copies) * stride + offset}px,0,0)`;
  }
  function update(manual = false) {
    const n = logical();
    current.textContent = String(n + 1).padStart(2, '0');
    progress.style.transform = `scaleX(${(n + 1) / count})`;
    // Only cards whose originals are actually on screen belong in the accessibility tree.
    const shown = Math.ceil(viewport.clientWidth / stride);
    originals.forEach((card, i) => {
      const onScreen = i >= index && i < index + shown;
      card.setAttribute('aria-hidden', String(!onScreen));
    });
    if (manual) announcement.textContent = `${n + 1} / ${count}, ${originals[n].querySelector('h3').textContent}`;
  }
  function settle() {
    clearTimeout(settleTimer);
    if (!moving) return;
    moving = false;
    index = logical();
    paint();
    update();
    schedule();
  }
  function move(direction, manual = true) {
    if (moving || !stride) return;
    stopTimer();
    moving = true;
    index += direction;
    paint(true);
    update(manual);
    if (reduce.matches) settle();
    else settleTimer = setTimeout(settle, 850);
  }
  function measure() {
    stopTimer();
    clearTimeout(settleTimer);
    moving = false;
    index = logical();
    gesture = null;
    root.classList.remove('is-dragging');
    stride = originals[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 0);
    paint();
    update();
    schedule();
  }
  function updatePlay() {
    play.setAttribute('aria-label', paused ? '메뉴 자동 넘김 재생' : '메뉴 자동 넘김 정지');
    root.querySelector('.menu-play-icon').textContent = paused ? '▶' : 'Ⅱ';
    root.querySelector('.menu-play-text').textContent = paused ? '자동재생' : '일시정지';
  }
  root.querySelector('.menu-prev').addEventListener('click', () => move(-1));
  root.querySelector('.menu-next').addEventListener('click', () => move(1));
  play.addEventListener('click', () => {
    paused = !paused;
    if (!paused) focused = false;
    updatePlay();
    schedule();
  });
  viewport.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    move(e.key === 'ArrowLeft' ? -1 : 1);
  });
  viewport.addEventListener('mouseenter', () => { hovering = true; stopTimer(); });
  viewport.addEventListener('mouseleave', () => { hovering = false; schedule(); });
  root.addEventListener('focusin', () => { focused = true; stopTimer(); });
  root.addEventListener('focusout', e => {
    if (!root.contains(e.relatedTarget)) { focused = false; schedule(); }
  });
  track.addEventListener('transitionend', e => {
    if (e.target === track && e.propertyName === 'transform') settle();
  });
  viewport.addEventListener('pointerdown', e => {
    if (moving || (e.pointerType === 'mouse' && e.button !== 0)) return;
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dragging: false, vertical: false };
    stopTimer();
  });
  viewport.addEventListener('pointermove', e => {
    if (!gesture || gesture.id !== e.pointerId || gesture.vertical) return;
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    if (!gesture.dragging) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { gesture.vertical = true; return; }
      if (Math.abs(dx) < 8) return;
      gesture.dragging = true;
      viewport.setPointerCapture(e.pointerId);
      root.classList.add('is-dragging');
    }
    gesture.dx = Math.max(-stride, Math.min(stride, dx));
    paint(false, gesture.dx);
  });
  function release(e) {
    if (!gesture || gesture.id !== e.pointerId) return;
    const { dx, dragging } = gesture;
    gesture = null;
    root.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    if (dragging && e.type !== 'pointercancel' && Math.abs(dx) > Math.min(65, stride * .18)) move(dx < 0 ? 1 : -1);
    else { paint(); schedule(); }
  }
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); schedule(); });
  reduce.addEventListener('change', () => {
    if (reduce.matches) paused = true;
    settle(); updatePlay(); schedule();
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    schedule();
  }, { threshold: .2 }).observe(viewport);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(viewport);
  else window.addEventListener('resize', measure);
  updatePlay();
  measure();
})();
