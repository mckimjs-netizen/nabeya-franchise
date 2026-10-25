(() => {
  const header = document.getElementById('siteHeader');
  const topButton = document.querySelector('.top-button');
  const syncHeader = () => {
    header?.classList.toggle('scrolled', window.scrollY > 24);
    const showTopButton = window.scrollY > 480;
    topButton?.classList.toggle('show', showTopButton);
    topButton?.setAttribute('aria-hidden', String(!showTopButton));
  };
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

  const popup = document.getElementById('entryNotice');
  if (popup) {
    const popupKey = 'nabeya-popup-hidden-until-4';
    const hiddenUntil = Number(localStorage.getItem(popupKey) || 0);
    const forcePreview = new URLSearchParams(location.search).has('previewPopup');
    const closePopup = () => {
      popup.hidden = true;
    };
    const popupBoxes = [...popup.querySelectorAll('.popup-box')];

    if (forcePreview) popup.hidden = false;
    else if (Date.now() > hiddenUntil) setTimeout(() => { popup.hidden = false; }, 900);

    popupBoxes.forEach(box => {
      box.querySelectorAll('.popup-x,[data-close]').forEach(button => {
        button.addEventListener('click', () => {
          box.hidden = true;
          if (!popupBoxes.some(item => !item.hidden && item.offsetParent)) closePopup();
        });
      });
    });
    popup.querySelectorAll('.popup-cta').forEach(link => link.addEventListener('click', closePopup));
    popup.querySelectorAll('[data-today]').forEach(button => {
      button.addEventListener('click', () => {
        localStorage.setItem(popupKey, String(Date.now() + 86400000));
        closePopup();
      });
    });
    popup.addEventListener('click', event => {
      if (event.target === popup) closePopup();
    });
    addEventListener('keydown', event => {
      if (event.key === 'Escape' && !popup.hidden) closePopup();
    });
  }

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

  const mobileSliderMedia = matchMedia('(max-width: 560px)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const setupMobileContinuousSlider = (selector, label, speed = 46) => {
    const slider = document.querySelector(selector);
    if (!slider || !mobileSliderMedia.matches || reduceMotion.matches || slider.children.length < 2) return;

    const slides = [...slider.children];
    slides.forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.classList.add('mobile-slider-clone');
      clone.setAttribute('aria-hidden', 'true');
      slider.append(clone);
    });
    slider.classList.add('is-continuous-mobile');

    let frame = 0;
    let resumeTimer = 0;
    let lastTime = 0;
    let sequenceWidth = 0;
    let userPaused = false;
    let visible = false;

    const measure = () => {
      const firstClone = slider.children[slides.length];
      sequenceWidth = firstClone ? firstClone.offsetLeft - slider.children[0].offsetLeft : 0;
    };
    const normalizePosition = () => {
      if (!sequenceWidth) return;
      while (slider.scrollLeft >= sequenceWidth) slider.scrollLeft -= sequenceWidth;
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };
    const tick = time => {
      if (!visible || userPaused || document.hidden) return stop();
      if (!lastTime) lastTime = time;
      const elapsed = Math.min(time - lastTime, 40);
      lastTime = time;
      slider.scrollLeft += speed * elapsed / 1000;
      normalizePosition();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      stop();
      if (!visible || userPaused || document.hidden) return;
      measure();
      normalizePosition();
      frame = requestAnimationFrame(tick);
    };
    const resumeAfterInteraction = () => {
      clearTimeout(resumeTimer);
      normalizePosition();
      if (!userPaused) resumeTimer = setTimeout(start, 700);
    };
    const setPaused = paused => {
      userPaused = paused;
      slider.setAttribute('aria-pressed', String(paused));
      slider.setAttribute('aria-label', paused ? `${label}. 눌러서 슬라이드 재생` : `${label}. 눌러서 슬라이드 정지`);
      paused ? stop() : start();
    };

    slider.setAttribute('role', 'button');
    slider.setAttribute('tabindex', '0');
    setPaused(false);
    slider.addEventListener('click', event => {
      if (event.target.closest('a,button,input,select,textarea,video')) return;
      setPaused(!userPaused);
    });
    slider.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setPaused(!userPaused);
    });
    slider.addEventListener('pointerdown', stop, { passive: true });
    slider.addEventListener('pointerup', resumeAfterInteraction, { passive: true });
    slider.addEventListener('pointercancel', resumeAfterInteraction, { passive: true });
    slider.addEventListener('wheel', () => {
      stop();
      resumeAfterInteraction();
    }, { passive: true });
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', start);
    addEventListener('resize', () => {
      measure();
      normalizePosition();
      start();
    }, { passive: true });

    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }, { threshold: .25 });
    observer.observe(slider);
  };

  setupMobileContinuousSlider('.economics-grid', '나베야 사업 수익 구조');
  setupMobileContinuousSlider('.support-cards', '나베야 운영 지원');
  setupMobileContinuousSlider('.marketing-grid', '나베야 마케팅 지원');
  setupMobileContinuousSlider('.poster-row', '나베야 브랜드 포스터', 34);

  const revealTargets = document.querySelectorAll('.origin-card,.review-close,.reorder-grid,.reorder-closing,.daily-grid,.standard-head,.standard-grid,.standard-sauce,.proof-numbers,.proof-statement,.economics-grid,.delivery-grid,.category-row,.conversion-copy,.support-grid,.site-analysis,.marketing-grid,.brand-kit,.credential-viewport,.cost-summary,.process,.faq-grid,.apply-grid');
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

/* 숫자 카운트업: 01 POS 데이터(265·116·48.3), 02 재주문율(64.67%·그래프·+15.17%p), 06 마케팅(800만원), 11 재료 기준(168·0.1·100) */
(() => {
  if (!('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const format = (value, decimals) => value.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  // 요소 안 첫 숫자만 분리해 애니메이션 대상으로 만든다 (앞뒤 글자 '재주문율 ', '만원 상당', '%p' 등은 그대로 둠)
  const prepare = (el, opts = {}) => {
    const node = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && /\d/.test(n.textContent));
    if (!node) return null;
    const match = node.textContent.match(/^([^\d]*?)([\d,]+(?:\.\d+)?)(.*)$/s);
    if (!match) return null;
    const [, lead, numText, rest] = match;
    const target = parseFloat(numText.replace(/,/g, ''));
    if (!Number.isFinite(target)) return null;
    let numNode = node;
    if (lead || rest) {
      numNode = document.createTextNode(numText);
      const frag = document.createDocumentFragment();
      if (lead) frag.append(lead);
      frag.append(numNode);
      if (rest) frag.append(rest);
      node.replaceWith(frag);
    }
    el.style.fontVariantNumeric = 'tabular-nums';
    const decimals = (numText.split('.')[1] || '').length;
    const from = opts.from ?? 0;
    numNode.textContent = format(from, decimals);
    return { node: numNode, text: numText, target, decimals, from, bar: opts.bar || null };
  };

  const setBar = (bar, value) => { if (bar) bar.style.setProperty('--rate', `${value}%`); };

  const animate = (items, duration = 1600) => {
    items.forEach(item => setBar(item.bar, item.from));
    const start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      items.forEach(item => {
        const value = item.from + (item.target - item.from) * eased;
        item.node.textContent = p < 1 ? format(value, item.decimals) : item.text;
        setBar(item.bar, p < 1 ? value : item.target);
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const watch = (boxSelector, items, duration) => {
    const box = document.querySelector(boxSelector);
    items = items.filter(Boolean);
    if (!box || !items.length) return;
    let done = false;
    const io = new IntersectionObserver(entries => {
      if (done || !entries.some(e => e.isIntersecting)) return;
      done = true;
      io.disconnect();
      animate(items, duration);
    }, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
    io.observe(box);
  };

  const all = selector => [...document.querySelectorAll(selector)];

  // 01 POS 데이터
  watch('.proof-numbers', all('.proof-numbers b').map(el => prepare(el)));

  // 02 재주문율: 제목 숫자
  watch('.reorder-copy', all('.reorder-copy h2 strong').map(el => prepare(el)));

  // 02 재주문율: 그래프 (부산본점은 0에서 커지고, 비교 대상은 100%에서 줄어듦)
  const reorderItems = all('.reorder-data .reorder-row').map(row => {
    const num = row.querySelector('b');
    const bar = row.querySelector('i');
    if (!num || !bar) return null;
    const grows = row.classList.contains('featured');
    const item = prepare(num, { from: grows ? 0 : 100, bar });
    if (item) setBar(bar, item.from);
    return item;
  });
  const delta = document.querySelector('.reorder-delta strong');
  watch('.reorder-data', [...reorderItems, delta && prepare(delta)], 2000);

  // 06 마케팅 지원 800만원
  watch('.marketing-head', all('.marketing-head h2 strong').map(el => prepare(el)));

  // 11 재료 기준 카드
  watch('.standard-grid', all('.standard-grid .standard-metric strong').map(el => prepare(el)));
})();

/* 첫 화면 연출: SINCE 2026→2004, 첫 줄 한 글자씩, 23년·하단 지표 숫자 올라가기 */
(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  if (!hero || !root.classList.contains('hero-fx')) return;

  // 첫 줄 "수많은 외식 브랜드가"를 한 글자씩 나눔
  const line = hero.querySelector('h1 span.hero-title-line');
  if (line && !line.children.length) {
    const text = line.textContent;
    line.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'hero-char';
      s.style.setProperty('--i', i);
      s.textContent = ch;
      line.append(s);
    });
    line.classList.add('is-split');
  }

  const tween = (duration, frame) => {
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / duration);
      frame(1 - Math.pow(1 - p, 3), p);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // CSS 등장 애니메이션이 시작되는 시점에 맞춰 실행
  const whenShown = (el, fallbackMs, fn) => {
    if (!el) return;
    const anim = el.getAnimations ? el.getAnimations()[0] : null;
    const timing = anim && anim.effect && anim.effect.getTiming ? anim.effect.getTiming() : null;
    const wait = timing ? Math.max(0, (Number(timing.delay) || 0) - (Number(anim.currentTime) || 0)) : fallbackMs;
    setTimeout(fn, wait);
  };

  // 텍스트 안 숫자들을 0부터 올림 (자리 폭 고정으로 글자 밀림 방지)
  const countText = (node, duration) => {
    const original = node.textContent;
    const parts = original.split(/(\d+(?:\.\d+)?)/);
    const frag = document.createDocumentFragment();
    const nums = [];
    parts.forEach((s, i) => {
      if (i % 2) {
        const sp = document.createElement('span');
        sp.textContent = s;
        sp.style.cssText = 'display:inline-block;font:inherit;color:inherit;letter-spacing:inherit;text-align:right;font-variant-numeric:tabular-nums';
        frag.append(sp);
        nums.push({ sp, s, v: parseFloat(s), dec: (s.split('.')[1] || '').length });
      } else if (s) frag.append(s);
    });
    node.replaceWith(frag);
    nums.forEach(n => { n.sp.style.minWidth = `${n.sp.getBoundingClientRect().width}px`; n.sp.textContent = (0).toFixed(n.dec); });
    return () => tween(duration, (e, p) => nums.forEach(n => { n.sp.textContent = p < 1 ? (n.v * e).toFixed(n.dec) : n.s; }));
  };
  const numberNode = el => el && [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && /\d/.test(n.textContent));

  // SINCE 2026 → 2004 (거꾸로 돌아가는 연도)
  const since = hero.querySelector('.heritage-since');
  const yearNode = numberNode(since);
  if (yearNode) {
    const original = yearNode.textContent;
    const m = original.match(/^(.*?)(\d{4})(.*)$/s);
    if (m) {
      const from = 2026, to = Number(m[2]);
      since.style.fontVariantNumeric = 'tabular-nums';
      yearNode.textContent = m[1] + from + m[3];
      whenShown(hero.querySelector('.heritage'), 100, () => tween(1300, (e, p) => {
        yearNode.textContent = p < 1 ? m[1] + Math.round(from + (to - from) * e) + m[3] : original;
      }));
    }
  }

  // "23년 동안 살아남았을까요?"의 23
  const n23 = numberNode(hero.querySelector('.hero-question em'));
  if (n23) { const start = countText(n23, 1100); whenShown(hero.querySelector('.hero-question'), 2100, start); }

  // 하단 지표 23년 · 100만+ · 1~3분
  const proofStarts = [...hero.querySelectorAll('.hero-proof b')].map(numberNode).filter(Boolean).map(n => countText(n, 1300));
  if (proofStarts.length) whenShown(hero.querySelector('.hero-proof'), 3200, () => proofStarts.forEach(f => f()));
})();

/* 04 수익 구조: 제목 30% 올라가기 + "아직도 속고 계십니까?" 도장, 카드별 효과(원 그래프·계기판·스톱워치) */
(() => {
  if (!('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const section = document.querySelector('.economics');
  if (!section) return;
  const svgNS = 'http://www.w3.org/2000/svg';
  const ease = p => 1 - Math.pow(1 - p, 3);
  const tween = (duration, frame) => {
    const start = performance.now();
    const step = now => { const p = Math.min(1, (now - start) / duration); frame(ease(p), p); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const onVisible = (el, fn) => {
    if (!el) return;
    let done = false;
    const io = new IntersectionObserver(entries => {
      if (done || !entries.some(e => e.isIntersecting)) return;
      done = true; io.disconnect(); fn();
    }, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
    io.observe(el);
  };
  const svg = (tag, attrs) => { const n = document.createElementNS(svgNS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; };

  // 제목: "30%" 숫자 + "아직도 속고 계십니까?" 도장
  const head = section.querySelector('.section-intro');
  const headNums = [];
  section.querySelectorAll('.section-intro h2 > span').forEach(span => {
    const node = [...span.childNodes].find(n => n.nodeType === Node.TEXT_NODE && /\d/.test(n.textContent));
    if (!node) return;
    const m = node.textContent.match(/^(.*?)(\d+)(.*)$/s);
    if (!m) return;
    const num = document.createElement('span');
    num.textContent = m[2];
    num.style.cssText = 'display:inline-block;text-align:right;font-variant-numeric:tabular-nums';
    node.replaceWith(m[1], num, m[3]);
    num.style.minWidth = `${num.getBoundingClientRect().width}px`;
    num.textContent = '0';
    headNums.push({ num, target: Number(m[2]) });
  });
  const ems = [...section.querySelectorAll('.section-intro h2 em')];
  ems.forEach(em => { em.style.opacity = '0'; });
  onVisible(head, () => {
    tween(1300, (e, p) => headNums.forEach(h => { h.num.textContent = p < 1 ? Math.round(h.target * e) : h.target; }));
    setTimeout(() => ems.forEach(em => { em.style.opacity = ''; em.classList.add('econ-stamp'); }), 1100);
  });

  const cards = [...section.querySelectorAll('.economics-grid article')];
  const restore = (b, html) => { b.innerHTML = html; b.removeAttribute('aria-label'); b.classList.remove('econ-restore'); void b.offsetWidth; b.classList.add('econ-restore'); };

  // 카드 1: 원가 30% → 원 그래프
  const setupCost = card => {
    const b = card.querySelector('b'); if (!b) return null;
    const ring = svg('svg', { class: 'econ-viz econ-ring', viewBox: '0 0 100 100', 'aria-hidden': 'true' });
    const r = 40, len = 2 * Math.PI * r;
    ring.append(svg('circle', { class: 'track', cx: 50, cy: 50, r }));
    const arc = svg('circle', { class: 'arc', cx: 50, cy: 50, r, 'stroke-dasharray': len, 'stroke-dashoffset': len });
    ring.append(arc);
    const label = svg('text', { x: 50, y: 50 }); label.textContent = '원가'; ring.append(label);
    card.append(ring);
    const node = [...b.childNodes].find(n => n.nodeType === Node.TEXT_NODE && /\d/.test(n.textContent));
    const target = node ? parseInt(node.textContent, 10) : 30;
    if (node) node.textContent = '0';
    return () => tween(1500, (e, p) => {
      if (node) node.textContent = p < 1 ? Math.round(target * e) : target;
      arc.setAttribute('stroke-dashoffset', String(len * (1 - (target / 100) * e)));
    });
  };

  // 카드 2: 100만+ → 자동차 계기판처럼 1,000,000 굴러간 뒤 100만+
  const setupBowls = card => {
    const b = card.querySelector('b'); if (!b) return null;
    const original = b.innerHTML;
    const odo = document.createElement('span');
    odo.className = 'econ-odo';
    const strips = [];
    const digits = '1,000,000'.split('');
    let place = 0;
    for (let i = digits.length - 1; i >= 0; i--) {
      const ch = digits[i];
      if (ch === ',') { const s = document.createElement('span'); s.className = 'sep'; s.textContent = ','; odo.prepend(s); continue; }
      const col = document.createElement('span'); col.className = 'col';
      const strip = document.createElement('span'); strip.className = 'strip';
      const rounds = 1 + Math.min(place, 3);
      const seq = [];
      for (let k = 0; k < rounds; k++) for (let n = 0; n < 10; n++) seq.push(n);
      seq.push(Number(ch));
      seq.forEach(n => { const it = document.createElement('i'); it.textContent = n; strip.append(it); });
      strip.style.transitionDelay = `${place * 0.06}s`;
      col.append(strip); odo.prepend(col);
      strips.push({ strip, last: seq.length - 1 });
      place++;
    }
    const unit = document.createElement('small'); unit.textContent = '그릇'; odo.append(unit);
    b.setAttribute('aria-label', b.textContent.trim()); odo.setAttribute('aria-hidden', 'true');
    b.innerHTML = ''; b.append(odo);
    return () => {
      requestAnimationFrame(() => strips.forEach(s => { s.strip.style.transform = `translateY(-${s.last}em)`; }));
      setTimeout(() => restore(b, original), 2600);
    };
  };

  // 카드 3: 1–3분 → 스톱워치 초침이 돌고 00:00 → 03:00 뒤 1–3분
  const setupSpeed = card => {
    const b = card.querySelector('b'); if (!b) return null;
    const original = b.innerHTML;
    const watch = svg('svg', { class: 'econ-viz econ-watch', viewBox: '0 0 100 100', 'aria-hidden': 'true' });
    watch.append(svg('rect', { class: 'knob', x: 44, y: 2, width: 12, height: 9, rx: 2 }));
    watch.append(svg('circle', { class: 'face', cx: 50, cy: 54, r: 40 }));
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6;
      watch.append(svg('line', { class: 'tick', x1: 50 + Math.sin(a) * 33, y1: 54 - Math.cos(a) * 33, x2: 50 + Math.sin(a) * 37, y2: 54 - Math.cos(a) * 37 }));
    }
    const hand = svg('line', { class: 'hand', x1: 50, y1: 54, x2: 50, y2: 24 });
    watch.append(hand);
    watch.append(svg('circle', { class: 'pin', cx: 50, cy: 54, r: 4 }));
    card.append(watch);
    const digital = document.createElement('span');
    digital.className = 'econ-digital';
    digital.textContent = '00:00';
    b.setAttribute('aria-label', b.textContent.trim()); digital.setAttribute('aria-hidden', 'true');
    b.innerHTML = ''; b.append(digital);
    return () => {
      tween(1700, (e, p) => {
        const secs = Math.round(180 * e);
        digital.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
        hand.style.transform = `rotate(${1080 * e}deg)`;
      });
      setTimeout(() => restore(b, original), 2500);
    };
  };

  const setups = [setupCost, setupBowls, setupSpeed];
  const runs = [[], [], []];
  cards.forEach((card, i) => {
    const kind = i % 3;
    const run = setups[kind](card);
    if (run) runs[kind].push(run);
  });
  onVisible(section.querySelector('.economics-grid'), () => {
    runs.forEach((list, kind) => setTimeout(() => list.forEach(run => run()), kind * 300));
  });
})();

/* 09 데일리 돈까스: 일주일 식단표 (요일이 하루씩 켜지며 그날 메뉴 사진·이름이 바뀜, 7일 배지, 오늘 표시, 김 모락모락) */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const media = document.querySelector('.daily-media');
  const week = media && media.querySelector('.daily-week');
  const wordmark = media && media.querySelector('.daily-wordmark');
  if (!media || !week || !wordmark) return;
  const days = [...week.children];
  if (days.length !== 7) return;

  const menus = [
    { name: '평창김치나베', src: null },
    { name: '통등심 돈까스', src: 'assets/brand/pork-cutlet.webp' },
    { name: '리얼 치즈 돈까스', src: 'assets/brand/cheese-cutlet.webp' },
    { name: '수제 경양식 왕 돈까스', src: 'assets/brand/king-cutlet.webp' },
    { name: '안심 김치우동세트', src: 'assets/brand/kimchi-udon.webp' },
    { name: '김치말이 냉모밀', src: 'assets/brand/kimchi-cold-soba.webp' },
    { name: '평창 김치우동', src: 'assets/brand/kimchi-udon-hot.webp' }
  ];
  const dayNames = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

  // 김 모락모락
  const steam = document.createElement('div');
  steam.className = 'daily-steam';
  steam.setAttribute('aria-hidden', 'true');
  steam.innerHTML = '<i></i><i></i><i></i>';
  media.insertBefore(steam, wordmark);

  // 요일별 메뉴 사진 (월요일은 기존 끓는 나베 영상 그대로)
  let loaded = false;
  const slides = menus.map(m => {
    if (!m.src) return null;
    const img = document.createElement('img');
    img.className = 'daily-slide';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    img.dataset.src = m.src;
    media.insertBefore(img, steam);
    return img;
  });
  const loadSlides = () => { if (loaded) return; loaded = true; slides.forEach(s => { if (s) s.src = s.dataset.src; }); };

  // 메뉴 이름 줄, 7일 배지
  const nameLine = document.createElement('p');
  nameLine.className = 'daily-menu-name';
  nameLine.setAttribute('aria-hidden', 'true');
  week.after(nameLine);
  const badge = document.createElement('div');
  badge.className = 'daily-badge';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = '7일 연속, 나베야';
  wordmark.append(badge);

  // 오늘 요일 표시
  days[(new Date().getDay() + 6) % 7].classList.add('today');

  let visible = false, running = false, timer = 0;
  const showSlide = k => slides.forEach((s, i) => s && s.classList.toggle('show', i === k));
  const setName = k => {
    nameLine.innerHTML = `<b>${dayNames[k]}</b>${menus[k].name}`;
    nameLine.classList.remove('swap'); void nameLine.offsetWidth; nameLine.classList.add('swap');
  };
  const reset = () => {
    days.forEach(d => d.classList.remove('on', 'now'));
    badge.classList.remove('show');
  };
  const step = k => {
    if (!visible) { running = false; return; }
    if (k === 0) reset();
    if (k < 7) {
      days.forEach(d => d.classList.remove('now'));
      days[k].classList.add('on', 'now');
      showSlide(k);
      setName(k);
      timer = setTimeout(() => step(k + 1), 1150);
    } else {
      days.forEach(d => d.classList.remove('now'));
      badge.classList.add('show');
      timer = setTimeout(() => step(0), 3800);
    }
  };
  const start = () => {
    if (running) return;
    running = true;
    week.classList.add('is-anim');
    loadSlides();
    step(0);
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries.some(e => e.isIntersecting);
      if (visible) start();
      else { clearTimeout(timer); running = false; }
    }, { threshold: 0, rootMargin: '0px 0px -15% 0px' }).observe(media);
  } else { visible = true; start(); }
})();

/* 첫 화면 "경쟁하지 않겠습니다. 독점하겠습니다." 쉼 없는 강조: 독점 네온 + 5초마다 경쟁 취소선 → 독점 도장 쿵 */
(() => {
  const root = document.documentElement;
  const box = document.querySelector('.hero-declaration');
  if (!box || !root.classList.contains('hero-fx')) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const word = box.querySelector('strong');
  if (!word) return;

  let visible = true, timer = 0, started = false;
  const stamp = () => {
    if (word.animate) word.animate([
      { transform: 'scale(1.75) rotate(-4deg)', opacity: 0 },
      { transform: 'scale(.93) rotate(1deg)', opacity: 1, offset: .6 },
      { transform: 'scale(1.04)', offset: .8 },
      { transform: 'none', opacity: 1 }
    ], { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' });
    if (box.animate) box.animate([
      { transform: 'translate(0,0)' }, { transform: 'translate(-3px,1px)' }, { transform: 'translate(3px,-1px)' }, { transform: 'translate(-2px,0)' }, { transform: 'translate(0,0)' }
    ], { duration: 320, delay: 300, easing: 'ease-in-out' });
  };
  const cycle = () => {
    if (!visible) { timer = 0; return; }
    box.classList.add('decl-strike');
    setTimeout(stamp, 420);
    setTimeout(() => box.classList.remove('decl-strike'), 2900);
    timer = setTimeout(cycle, 5000);
  };
  const begin = () => {
    if (started) return;
    started = true;
    box.classList.add('decl-live');
    timer = setTimeout(cycle, 1200);
  };
  // 첫 등장 도장 효과가 끝난 뒤(약 4.3초) 반복 시작
  setTimeout(begin, 4300);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries.some(e => e.isIntersecting);
      if (visible && started && !timer) timer = setTimeout(cycle, 600);
    }).observe(box);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible && started && !timer) timer = setTimeout(cycle, 600);
  });
})();