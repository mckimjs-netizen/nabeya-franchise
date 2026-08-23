/* ===========================================================
   NABEYA — 인터랙션
   =========================================================== */
(() => {
  'use strict';

  /* ---------- 히어로 배경 영상 ----------
     포스터 이미지가 먼저 그려진 뒤 영상을 내려받습니다.
     모바일은 세로 크롭 경량본(1.3MB)을, 데스크톱은 가로본(2.6MB)을 사용합니다.
     모션 최소화 · 데이터 절약 · 2G 환경에서는 포스터 이미지만 유지합니다.      */
  const video = document.getElementById('heroVideo');
  function loadHeroVideo() {
    if (!video || video.src) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const conn = navigator.connection;
    if (conn && (conn.saveData || /^(slow-)?2g$/.test(conn.effectiveType || ''))) return;
    if (document.hidden) return;           // 탭이 가려져 있으면 보일 때까지 대기

    const show = () => video.classList.add('playing');
    video.addEventListener('playing', show, { once: true });
    video.addEventListener('canplay', show, { once: true });
    video.src = innerWidth <= 900 ? video.dataset.srcM : video.dataset.src;
    video.play().catch(() => {});          // 자동재생이 막히면 포스터 이미지 유지
  }
  if (document.readyState === 'complete') loadHeroVideo();
  else addEventListener('load', loadHeroVideo);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (!video || !video.src) loadHeroVideo();
    else if (video.paused) video.play().catch(() => {});
  });

  /* 히어로를 벗어나면 재생을 멈춰 배터리·CPU를 아낍니다 */
  if (video && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => {
      if (!video.src) return;
      e.isIntersecting ? video.play().catch(() => {}) : video.pause();
    }), { threshold: .05 }).observe(document.querySelector('.hero'));
  }

  /* ---------- 브랜드 로고송 ----------
     소리가 있는 영상이므로 자동재생하지 않고 사용자가 누를 때만 재생합니다. */
  const song = document.getElementById('logoSong');
  const songBtn = document.querySelector('.ls-play');
  if (song && songBtn) {
    songBtn.addEventListener('click', () => {
      song.controls = true;                 // 재생 전에는 컨트롤바를 숨겨 포스터를 온전히 보여줍니다
      song.play().then(() => { songBtn.hidden = true; }).catch(() => { song.controls = false; });
    });
    song.addEventListener('ended', () => {
      song.currentTime = 0; song.controls = false; songBtn.hidden = false;
    });
    /* 화면에서 벗어나면 소리가 계속 나지 않도록 정지 */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting && !song.paused) song.pause();
      }), { threshold: .25 }).observe(song);
    }
  }

  /* ---------- 헤더 스크롤 ---------- */
  const header = document.querySelector('.site-header');
  addEventListener('scroll', () => {
    header.classList.toggle('scrolled', scrollY > 30);
  }, { passive: true });

  /* ---------- 맨 위로 ----------
     고정 헤더에 앵커가 걸려 있으면 브라우저가 스크롤하지 않으므로 직접 처리합니다. */
  document.querySelectorAll('a[href="#top"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
      history.replaceState(null, '', location.pathname + location.search);
    });
  });

  /* ---------- 모바일 메뉴 ---------- */
  const menu = document.getElementById('mobileMenu');
  const toggle = document.querySelector('.nav-toggle');
  const openMenu = () => {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', openMenu);
  menu.querySelector('.mm-close').addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* ---------- 창업비용 계산기 ----------
     가맹 개설비 : 가맹비 500 + 교육비 500 + 물류보증금 300 = 1,300만원 (평수 무관)
     점포 개설비 : 인테리어(평당 200) + 주방설비 1,500 + 주방용품 1,200
                  + 의탁자 700 + 간판 700 + 오픈준비물 1,000 + 포스기 150
     ※ 인테리어 외 항목은 나베야 공식 안내(15평 기준) 금액을 그대로 적용   */
  const FRANCHISE_FEE = 500 + 500 + 300;       // 1,300만원
  const INTERIOR_PER_PYEONG = 200;             // 평당 200만원
  const STORE_FIXED = 1500 + 1200 + 700 + 700 + 1000 + 150; // 5,250만원

  const won = n => n.toLocaleString('ko-KR');
  const el = id => document.getElementById(id);
  const tabs = [...document.querySelectorAll('.calc-tabs button')];

  function render(pyeong) {
    const interior = pyeong * INTERIOR_PER_PYEONG;
    const store = interior + STORE_FIXED;
    const total = FRANCHISE_FEE + store;

    el('calcPyeong').textContent = pyeong;
    el('calcTotal').textContent = won(total);
    el('sumA').textContent = won(FRANCHISE_FEE) + '만원';
    el('sumB').textContent = won(store) + '만원';
    el('barA').style.width = (FRANCHISE_FEE / total * 100) + '%';
    el('barB').style.width = (store / total * 100) + '%';
    el('rowInterior').textContent = won(interior) + '만원';
    el('rowSubB').textContent = won(store) + '만원';
    el('pyeongLabel').textContent = pyeong + '평 기준';

    tabs.forEach(b => {
      const on = Number(b.dataset.pyeong) === pyeong;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on);
    });
  }
  tabs.forEach(b => b.addEventListener('click', () => render(Number(b.dataset.pyeong))));
  render(15);

  /* ===========================================================
     상담 신청 접수
     ───────────────────────────────────────────────────────────
     구글 시트 「나베야 창업상담」의 Apps Script 웹앱으로 접수됩니다.
     접수 내용은 시트의 「상담신청」 탭에 쌓이고, illetta@naver.com 으로 알림이 갑니다.
     주소를 비우면 메일 앱으로 대체 전송됩니다.
     =========================================================== */
  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz6-I22NaWgGANzp5c00Z8raDjX0BxDaXsg3HUInHcY_9uFR9K4T_wf6yht_GhJZNWh0g/exec';
  const MAIL_TO = 'illetta@naver.com';          // 대체 수단

  const MSG = {
    need: '이름과 연락처를 입력해 주세요.',
    agree: '개인정보 수집 및 이용에 동의해 주세요.',
    phone: '연락처를 정확히 입력해 주세요.',
    sending: '접수 중입니다…',
    done: '상담 신청이 접수되었습니다. 담당자가 곧 연락드리겠습니다.',
    fail: '접수에 실패했습니다. 1668-5236으로 전화 주시면 바로 도와드리겠습니다.',
    mail: '메일 앱으로 상담 내용을 전달했습니다. 전송이 어려우시면 1668-5236으로 전화 주세요.'
  };

  const say = (el, text, ok) => {
    if (!el) { if (!ok) alert(text); return; }
    el.textContent = text;
    el.classList.toggle('ok', !!ok);
  };

  function toMail(data) {
    const lines = [
      `이름: ${data.name || '-'}`, `나이: ${data.age || '-'}`,
      `연락처: ${data.phone || '-'}`, `오픈 희망지역: ${data.area || '-'}`,
      `창업 예산: ${data.budget || '-'}`, `희망 평수: ${data.size || '-'}`,
      `유입경로: ${data.route || '-'}`, `문의 내용: ${data.memo || '-'}`
    ].join('\n');
    location.href = `mailto:${MAIL_TO}`
      + `?subject=${encodeURIComponent(`[나베야 창업상담] ${data.name || ''} / ${data.area || ''}`)}`
      + `&body=${encodeURIComponent(lines)}`;
  }

  function bindForm(form, msgEl) {
    if (!form) return;
    const btn = form.querySelector('button[type=submit]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.dataset.sending === '1') return;              // 중복 전송 방지

      const data = Object.fromEntries(new FormData(form).entries());
      if (data.company) return;                              // 허니팟: 봇이면 조용히 무시
      if (!data.name || !data.phone) return say(msgEl, MSG.need);
      if (data.phone.replace(/\D/g, '').length < 9) return say(msgEl, MSG.phone);
      if (!data.agree) return say(msgEl, MSG.agree);

      delete data.company;
      data.신청경로 = form.id === 'quickBar' ? '하단 빠른문의' : '상담 폼';
      data.페이지 = location.href;

      if (!FORM_ENDPOINT) { toMail(data); return say(msgEl, MSG.mail, true); }

      form.dataset.sending = '1';
      if (btn) { btn.dataset.label = btn.textContent; btn.textContent = '접수 중…'; btn.disabled = true; }
      say(msgEl, MSG.sending);

      try {
        // 구글 앱스 스크립트는 CORS 사전요청을 받지 않으므로 단순 요청으로 보냅니다.
        await fetch(FORM_ENDPOINT, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });
        say(msgEl, MSG.done, true);
        form.reset();
      } catch (err) {
        say(msgEl, MSG.fail);
      } finally {
        form.dataset.sending = '0';
        if (btn) { btn.textContent = btn.dataset.label; btn.disabled = false; }
      }
    });
  }
  bindForm(document.getElementById('applyForm'), document.getElementById('formMsg'));
  bindForm(document.getElementById('quickBar'), document.getElementById('quickMsg'));

  /* ---------- 진입 팝업 ---------- */
  const popup = document.getElementById('popup');
  /* 팝업 내용을 바꾸면 뒤 번호를 올립니다. 예전에 '오늘 하루 보지 않기' 를
     누른 방문자에게도 새 소식이 한 번은 보이게 하기 위해서입니다. */
  const KEY = 'nabeya-popup-hidden-until-2';
  const hiddenUntil = Number(localStorage.getItem(KEY) || 0);
  if (Date.now() > hiddenUntil) {
    setTimeout(() => { popup.hidden = false; }, 900);
  }
  const closePopup = () => { popup.hidden = true; };
  const boxes = [...popup.querySelectorAll('.popup-box')];
  /* 카드는 한 장씩 닫습니다. 남은 카드가 없으면 배경까지 걷어냅니다.
     좁은 화면에서는 창업비용 카드가 CSS 로 감춰지므로 hidden 속성이 아니라
     실제로 그려지고 있는지를 봐야 합니다. */
  const closeCard = box => {
    box.hidden = true;
    if (!boxes.some(b => !b.hidden && b.offsetParent)) closePopup();
  };
  boxes.forEach(box => box.querySelectorAll('.popup-x,[data-close]')
       .forEach(el => el.addEventListener('click', () => closeCard(box))));
  /* 버튼을 눌러 페이지 안으로 이동할 때와 '오늘 하루 보지 않기' 는 전체를 닫습니다 */
  popup.querySelectorAll('.popup-cta').forEach(el => el.addEventListener('click', closePopup));
  popup.querySelectorAll('[data-today]').forEach(el => el.addEventListener('click', () => {
    localStorage.setItem(KEY, String(Date.now() + 86400000));
    closePopup();
  }));
  popup.addEventListener('click', e => { if (e.target === popup) closePopup(); });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!popup.hidden) closePopup();
    if (menu.classList.contains('open')) closeMenu();
  });

  /* ---------- 스크롤 등장 (실패해도 콘텐츠는 항상 보이도록) ---------- */
  const targets = document.querySelectorAll('.story-grid,.trust-grid li,.menu-card,.craft-copy,.calc,.cost-table,.cost-guide,.royalty-copy,.royalty-chart,.steps li,.poster-wall img,.faq-list,.apply-copy,.apply-form');
  if ('IntersectionObserver' in window) {
    targets.forEach(t => t.classList.add('reveal'));
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    targets.forEach(t => io.observe(t));
  }
})();
