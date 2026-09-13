(() => {
  const header = document.getElementById('siteHeader');
  const syncHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  syncHeader();
  addEventListener('scroll', syncHeader, { passive: true });

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
      scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      history.replaceState(null, '', location.pathname + location.search);
    });
  });

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

      if (!FORM_ENDPOINT) {
        mailFallback(data);
        return;
      }

      form.dataset.sending = '1';
      const originalLabel = submitButton?.textContent;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '접수 중…';
      }
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
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
    });
  }

  bindForm(document.getElementById('applyForm'), document.getElementById('formMsg'));
  bindForm(document.getElementById('quickBar'), document.getElementById('quickMsg'));

  const standardSlider = document.querySelector('.standard-grid');
  if (standardSlider && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const standardSlides = [...standardSlider.children];
    const standardMobile = matchMedia('(max-width: 900px)');
    standardSlides.forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.classList.add('standard-clone');
      clone.setAttribute('aria-hidden', 'true');
      standardSlider.append(clone);
    });

    const setStandardFlow = () => {
      standardSlider.classList.remove('is-flowing');
      if (!standardMobile.matches) return;
      const firstClone = standardSlider.children[standardSlides.length];
      const sequenceWidth = firstClone ? firstClone.offsetLeft - standardSlider.children[0].offsetLeft : 0;
      if (!sequenceWidth) return;
      standardSlider.style.setProperty('--standard-loop-shift', `${-sequenceWidth}px`);
      standardSlider.style.setProperty('--standard-duration', `${Math.max(22, standardSlides.length * 6.5)}s`);
      standardSlider.offsetWidth;
      standardSlider.classList.add('is-flowing');
    };

    const setStandardPaused = paused => {
      standardSlider.classList.toggle('is-paused', paused);
      standardSlider.setAttribute('aria-pressed', String(paused));
      standardSlider.setAttribute('aria-label', paused
        ? '나베야의 세 가지 핵심 재료 기준. 눌러서 슬라이드 재생'
        : '나베야의 세 가지 핵심 재료 기준. 눌러서 슬라이드 정지');
    };

    standardSlider.setAttribute('role', 'button');
    standardSlider.setAttribute('tabindex', '0');
    setStandardPaused(false);
    standardSlider.addEventListener('click', () => {
      if (standardMobile.matches) setStandardPaused(!standardSlider.classList.contains('is-paused'));
    });
    standardSlider.addEventListener('keydown', event => {
      if (!standardMobile.matches || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      setStandardPaused(!standardSlider.classList.contains('is-paused'));
    });
    requestAnimationFrame(setStandardFlow);
    addEventListener('load', setStandardFlow, { once: true });
    addEventListener('resize', setStandardFlow, { passive: true });
    standardMobile.addEventListener?.('change', setStandardFlow);
  }

  const credentialSlider = document.querySelector('.credential-row');
  if (credentialSlider && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const slides = [...credentialSlider.children];
    slides.forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      credentialSlider.append(clone);
    });

    const setCredentialFlow = () => {
      const firstClone = credentialSlider.children[slides.length];
      const sequenceWidth = firstClone ? firstClone.offsetLeft - credentialSlider.children[0].offsetLeft : 0;
      if (!sequenceWidth) return;
      credentialSlider.style.setProperty('--credential-loop-shift', `${-sequenceWidth}px`);
      credentialSlider.style.setProperty('--credential-duration', `${Math.max(24, slides.length * 4.8)}s`);
      credentialSlider.classList.remove('is-flowing');
      credentialSlider.offsetWidth;
      credentialSlider.classList.add('is-flowing');
    };

    const setCredentialPaused = paused => {
      credentialSlider.classList.toggle('is-paused', paused);
      credentialSlider.setAttribute('aria-pressed', String(paused));
      credentialSlider.setAttribute('aria-label', paused
        ? '나베야 대표 자격 및 수료 이력. 눌러서 슬라이드 재생'
        : '나베야 대표 자격 및 수료 이력. 눌러서 슬라이드 정지');
    };

    credentialSlider.setAttribute('role', 'button');
    credentialSlider.setAttribute('tabindex', '0');
    setCredentialPaused(false);
    credentialSlider.addEventListener('click', () => setCredentialPaused(!credentialSlider.classList.contains('is-paused')));
    credentialSlider.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setCredentialPaused(!credentialSlider.classList.contains('is-paused'));
    });
    credentialSlider.addEventListener('mouseenter', () => credentialSlider.style.animationPlayState = 'paused');
    credentialSlider.addEventListener('mouseleave', () => credentialSlider.style.animationPlayState = '');
    requestAnimationFrame(setCredentialFlow);
    addEventListener('load', setCredentialFlow, { once: true });
    addEventListener('resize', setCredentialFlow, { passive: true });
  }

  const menuSlider = document.querySelector('.menu-row');
  if (menuSlider && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const menuSlides = [...menuSlider.children];
    menuSlides.forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      menuSlider.append(clone);
    });

    const setMenuFlow = () => {
      const firstClone = menuSlider.children[menuSlides.length];
      const sequenceWidth = firstClone ? firstClone.offsetLeft - menuSlider.children[0].offsetLeft : 0;
      if (!sequenceWidth) return;
      menuSlider.style.setProperty('--menu-loop-shift', `${-sequenceWidth}px`);
      menuSlider.style.setProperty('--menu-duration', `${Math.max(34, menuSlides.length * 4.2)}s`);
      menuSlider.classList.remove('is-flowing');
      menuSlider.offsetWidth;
      menuSlider.classList.add('is-flowing');
    };

    const setMenuPaused = paused => {
      menuSlider.classList.toggle('is-paused', paused);
      menuSlider.setAttribute('aria-pressed', String(paused));
      menuSlider.setAttribute('aria-label', paused
        ? '나베야 대표 메뉴. 눌러서 슬라이드 재생'
        : '나베야 대표 메뉴. 눌러서 슬라이드 정지');
    };

    menuSlider.setAttribute('role', 'button');
    menuSlider.setAttribute('tabindex', '0');
    setMenuPaused(false);
    menuSlider.addEventListener('click', () => setMenuPaused(!menuSlider.classList.contains('is-paused')));
    menuSlider.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setMenuPaused(!menuSlider.classList.contains('is-paused'));
    });
    menuSlider.addEventListener('mouseenter', () => menuSlider.style.animationPlayState = 'paused');
    menuSlider.addEventListener('mouseleave', () => menuSlider.style.animationPlayState = '');
    requestAnimationFrame(setMenuFlow);
    addEventListener('load', setMenuFlow, { once: true });
    addEventListener('resize', setMenuFlow, { passive: true });
  }

  const revealTargets = document.querySelectorAll('.origin-card,.review-close,.reorder-grid,.reorder-closing,.daily-grid,.standard-head,.standard-grid,.standard-sauce,.proof-numbers,.proof-statement,.economics-grid,.delivery-grid,.category-row,.conversion-copy,.opening-row,.support-grid,.site-analysis,.marketing-grid,.brand-kit,.credential-viewport,.cost-summary,.process,.faq-grid,.apply-grid');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach(target => target.classList.add('reveal'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealTargets.forEach(target => observer.observe(target));
  }
})();
