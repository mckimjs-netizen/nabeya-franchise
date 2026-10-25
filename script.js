(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileQuery = matchMedia('(max-width: 960px)');

  /* header, top button, quickbar visibility */
  const header = document.getElementById('siteHeader');
  const topButton = document.querySelector('.top-button');
  const quickBar = document.getElementById('quickBar');
  const mobileCta = document.querySelector('.mobile-cta');
  const hero = document.querySelector('.hero');
  const applySection = document.getElementById('apply');
  const syncScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 24);
    const pastHero = hero ? y > hero.offsetHeight * 0.6 : y > 480;
    const applyTop = applySection ? applySection.getBoundingClientRect().top : Infinity;
    const nearApply = applyTop < innerHeight * 0.85;
    const showBars = pastHero && !nearApply;
    quickBar?.classList.toggle('show', showBars);
    mobileCta?.classList.toggle('show', showBars);
    topButton?.classList.toggle('show', y > 600);
    topButton?.setAttribute('aria-hidden', String(y <= 600));
  };
  syncScroll();
  addEventListener('scroll', syncScroll, { passive: true });
  addEventListener('resize', syncScroll);

  /* hero video: pick source by screen */
  const video = document.querySelector('.hero-video');
  if (video) {
    const src = mobileQuery.matches ? video.dataset.srcM : video.dataset.srcD;
    if (src && !reduceMotion) {
      video.src = src;
      video.play?.().catch(() => {});
    }
  }

  /* mobile menu */
  const mobileMenu = document.getElementById('mobileMenu');
  const navToggle = document.querySelector('.nav-toggle');
  const closeButton = mobileMenu?.querySelector('.mm-close');
  function setMenu(open) {
    if (!mobileMenu || !navToggle) return;
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  }
  navToggle?.addEventListener('click', () => setMenu(true));
  closeButton?.addEventListener('click', () => setMenu(false));
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });

  document.querySelectorAll('a[href="#top"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', location.pathname + location.search);
    });
  });

  /* reveal on scroll + counters */
  const countUp = el => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    if (!Number.isFinite(target) || reduceMotion) return;
    const start = performance.now();
    const duration = 1400;
    const tick = now => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
    setTimeout(() => reveals.forEach(el => el.classList.add('in')), 6000);
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* menu rail arrows */
  const rail = document.querySelector('.menu-rail');
  const step = () => (rail?.querySelector('figure')?.offsetWidth || 300) + 18;
  document.querySelector('.menu-prev')?.addEventListener('click', () => rail?.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
  document.querySelector('.menu-next')?.addEventListener('click', () => rail?.scrollBy({ left: step() * 2, behavior: 'smooth' }));

  /* review marquee: duplicate for seamless loop */
  document.querySelectorAll('.review-track').forEach(track => {
    [...track.children].forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelector('img')?.setAttribute('alt', '');
      track.append(clone);
    });
  });

  /* cost calculator (official figures) */
  const FRANCHISE_FEE = 1300;
  const INTERIOR_PER_PYEONG = 200;
  const STORE_FIXED = 1500 + 1200 + 700 + 700 + 1000 + 150;
  const won = value => value.toLocaleString('ko-KR');
  const calcTabs = [...document.querySelectorAll('.calc-tabs button')];
  const calcPyeong = document.getElementById('calcPyeong');
  const calcTotal = document.getElementById('calcTotal');
  const rowInterior = document.getElementById('rowInterior');
  function renderCost(pyeong) {
    const interior = pyeong * INTERIOR_PER_PYEONG;
    const total = FRANCHISE_FEE + STORE_FIXED + interior;
    if (calcPyeong) calcPyeong.textContent = pyeong;
    if (calcTotal) calcTotal.textContent = won(total);
    if (rowInterior) rowInterior.textContent = `${won(interior)}만원`;
    calcTabs.forEach(button => {
      const selected = Number(button.dataset.pyeong) === pyeong;
      button.classList.toggle('on', selected);
      button.setAttribute('aria-selected', String(selected));
    });
  }
  calcTabs.forEach(button => button.addEventListener('click', () => renderCost(Number(button.dataset.pyeong))));
  renderCost(15);

  /* lead forms (same endpoint and payload as before) */
  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz6-I22NaWgGANzp5c00Z8raDjX0BxDaXsg3HUInHcY_9uFR9K4T_wf6yht_GhJZNWh0g/exec';
  const MAIL_TO = 'illetta@naver.com';
  const messages = {
    required: '이름과 연락처를 입력해 주세요.',
    area: '오픈 희망지역을 입력해 주세요.',
    phone: '연락처를 정확히 입력해 주세요.',
    agree: '개인정보 수집 및 이용에 동의해 주세요.',
    sending: '접수 중입니다…',
    done: '상담 신청이 접수되었습니다. 담당자가 곧 연락드리겠습니다.',
    fail: '접수에 실패했습니다. 1668-5236으로 전화 주시면 바로 도와드리겠습니다.'
  };
  function showMessage(element, message, ok = false) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('ok', ok);
  }
  function mailFallback(data) {
    const lines = [
      `이름: ${data.name || '-'}`,
      `연락처: ${data.phone || '-'}`,
      `오픈 희망지역: ${data.area || '-'}`,
      `창업 형태: ${data.startupType || '-'}`,
      `창업 예산: ${data.budget || '-'}`,
      `희망 평수: ${data.size || '-'}`,
      `문의 내용: ${data.memo || '-'}`
    ].join('\n');
    location.href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(`[나베야 창업상담] ${data.name || ''} / ${data.area || ''}`)}&body=${encodeURIComponent(lines)}`;
  }
  function bindForm(form, messageElement) {
    if (!form) return;
    const submitButton = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (form.dataset.sending === '1') return;
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.company) return;
      if (!data.name || !data.phone) return showMessage(messageElement, messages.required);
      if (data.phone.replace(/\D/g, '').length < 9) return showMessage(messageElement, messages.phone);
      if (form.id === 'applyForm' && !data.area) return showMessage(messageElement, messages.area);
      if (!data.agree) return showMessage(messageElement, messages.agree);
      delete data.company;
      data.신청경로 = form.id === 'quickBar' ? '하단 빠른문의' : '상담 폼';
      data.페이지 = location.href;
      data.광고파라미터 = location.search || '-';
      if (!FORM_ENDPOINT) { mailFallback(data); return; }
      form.dataset.sending = '1';
      const originalLabel = submitButton?.textContent;
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = '접수 중…'; }
      showMessage(messageElement, messages.sending);
      try {
        await fetch(FORM_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });
        showMessage(messageElement, messages.done, true);
        form.reset();
        if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: 'franchise_lead', form_id: form.id });
      } catch (error) {
        showMessage(messageElement, messages.fail);
      } finally {
        form.dataset.sending = '0';
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalLabel; }
      }
    });
  }
  bindForm(document.getElementById('applyForm'), document.getElementById('formMsg'));
  bindForm(document.getElementById('quickBar'), document.getElementById('quickMsg'));

  /* entry popup (single card) */
  const popup = document.getElementById('entryNotice');
  if (popup) {
    const popupKey = 'nabeya-popup-hidden-until-4';
    const hiddenUntil = Number(localStorage.getItem(popupKey) || 0);
    const params = new URLSearchParams(location.search);
    const closePopup = () => { popup.hidden = true; };
    if (params.has('previewPopup')) popup.hidden = false;
    else if (!params.has('noPopup') && Date.now() > hiddenUntil) setTimeout(() => { popup.hidden = false; }, 1200);
    popup.querySelectorAll('.popup-x,[data-close],.popup-cta').forEach(el => el.addEventListener('click', closePopup));
    popup.querySelectorAll('[data-today]').forEach(button => {
      button.addEventListener('click', () => {
        localStorage.setItem(popupKey, String(Date.now() + 86400000));
        closePopup();
      });
    });
    popup.addEventListener('click', event => { if (event.target === popup) closePopup(); });
    addEventListener('keydown', event => { if (event.key === 'Escape' && !popup.hidden) closePopup(); });
  }
})();
