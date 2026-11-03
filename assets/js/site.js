/*
 * Автошкола «Сто дорог» — скрипты сайта. Без библиотек.
 * Закреплённая шапка, меню на телефоне, версия для слабовидящих, видео-отзывы, машинка на дороге шагов, формы заявок (docs/lead-api.md),
 * метки рекламы, карта по нажатию, уведомление о cookies.
 * Всё содержимое страниц работает и без этого файла.
 */
(function () {
  'use strict';

  var PHONE = '+7 (983) 234-56-56';
  var PHONE_TEL = '+79832345656';
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'];

  function storage() {
    try { return window.sessionStorage; } catch (e) { return null; }
  }

  /* ---------- Меню ---------- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    var setOpen = function (open) {
      if (open) {
        // Панель меню — сразу под шапкой: над ней полоса, страница может быть прокручена, в версии для
        // слабовидящих страница увеличена через zoom (координаты окна делим на него)
        var zoom = parseFloat(window.getComputedStyle(document.body).zoom) || 1;
        var bottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
        document.documentElement.style.setProperty('--nav-top', Math.max(0, bottom / zoom) + 'px');
      }
      document.documentElement.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.getElementById('main-nav').addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---------- Шапка закреплена (CSS sticky); класс is-stuck, когда она прилипла к верху окна: тень, на главной
     язычок логотипа — отдельной плашкой. Метка нулевой высоты перед шапкой уходит за верх окна ровно тогда ---------- */
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader && window.IntersectionObserver) {
    var headerMark = document.createElement('div');
    headerMark.setAttribute('aria-hidden', 'true');
    siteHeader.parentNode.insertBefore(headerMark, siteHeader);
    new IntersectionObserver(function (entries) {
      siteHeader.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(headerMark);
  }

  /* ---------- Версия для слабовидящих: шрифт, цвета, картинки; выбор помнится (скрипт в <head> применяет его
     до отрисовки, чтобы страница не мелькала обычной) ---------- */
  var a11yToggle = document.querySelector('[data-a11y-toggle]');
  if (a11yToggle) {
    var a11y = { on: false, font: 1, theme: 'light', img: 1 };
    try { Object.assign(a11y, JSON.parse(window.localStorage.getItem('sd_a11y') || '{}') || {}); } catch (e) { /* по умолчанию */ }
    var a11yLabels = a11yToggle.querySelectorAll('.topbar__label');
    // Меняем только то, что отличается: правка атрибутов <html> заставляет браузер пересчитать стили всей страницы,
    // а при открытии страницы всё уже выставил скрипт в <head>
    var setAttr = function (el, name, value) { if (el.getAttribute(name) !== value) el.setAttribute(name, value); };
    var setText = function (el, value) { if (el.textContent !== value) el.textContent = value; };
    var a11yApply = function () {
      var html = document.documentElement;
      html.classList.toggle('a11y', !!a11y.on);
      html.classList.toggle('a11y-noimg', !!a11y.on && a11y.img === 0);
      if (a11y.on) {
        setAttr(html, 'data-a11y-font', String(a11y.font));
        setAttr(html, 'data-a11y-theme', a11y.theme);
      }
      setAttr(a11yToggle, 'aria-pressed', a11y.on ? 'true' : 'false');
      setText(a11yLabels[0], a11y.on ? 'Обычная версия сайта' : 'Версия для слабовидящих');
      setText(a11yLabels[1], a11y.on ? 'Обычная версия' : 'Для слабовидящих');
      document.querySelectorAll('.a11y-panel button').forEach(function (b) {
        var on = b.dataset.a11yFont === String(a11y.font) || b.dataset.a11yTheme === a11y.theme || b.dataset.a11yImg === String(a11y.img);
        setAttr(b, 'aria-pressed', on ? 'true' : 'false');
      });
      try { window.localStorage.setItem('sd_a11y', JSON.stringify(a11y)); } catch (e) { /* выбор не запомнится */ }
    };
    a11yToggle.hidden = false;
    a11yToggle.addEventListener('click', function () {
      a11y.on = !a11y.on;
      a11yApply();
    });
    document.querySelector('.a11y-panel').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a11yFont) a11y.font = Number(b.dataset.a11yFont);
      if (b.dataset.a11yTheme) a11y.theme = b.dataset.a11yTheme;
      if (b.dataset.a11yImg) a11y.img = Number(b.dataset.a11yImg);
      a11yApply();
    });
    a11yApply();
  }

  /* ---------- Видео-отзывы: кнопка поверх кадра запускает ролик, одновременно играет только один ---------- */
  var vreviews = document.querySelectorAll('.vreview');
  vreviews.forEach(function (item) {
    var video = item.querySelector('video');
    var play = item.querySelector('.vreview__play');
    video.controls = false;
    play.hidden = false;
    play.addEventListener('click', function () {
      play.hidden = true;
      video.controls = true;
      var started = video.play();
      if (started) started.catch(function () { /* браузер не дал запустить — остаются кнопки ролика */ });
    });
    video.addEventListener('play', function () {
      vreviews.forEach(function (other) {
        var v = other.querySelector('video');
        if (v !== video && !v.paused) v.pause();
      });
    });
  });

  /* ---------- «От первого занятия до прав»: машинка едет по дороге от шага 1 к пятому вместе с прокруткой
     (заказчик 03.11.2026). Только там, где видна дорога (компьютер); без скрипта, при «уменьшить движение»
     и в версии для слабовидящих стоит в конце пути, как в CSS ---------- */
  var routeFinish = document.querySelector('.route__finish');
  var routeCar = routeFinish && routeFinish.querySelector('.route__car');
  if (routeCar && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var routeCarSvg = routeCar.querySelector('svg');
    var routeStreet = document.querySelector('.route__path');
    var routeRoads = [routeStreet.querySelector('path'), routeFinish.querySelector('.route__rise path')];
    var routePoints = [];

    // Точки дороги через ~8 px в координатах обёртки машинки. Дорога — два SVG, растянутых по сетке,
    // поэтому точки берём уже на экране (getScreenCTM учитывает растяжение)
    var routeMeasure = function () {
      routePoints = [];
      if (getComputedStyle(routeFinish).display === 'none' || document.documentElement.classList.contains('a11y')) return;
      var box = routeFinish.getBoundingClientRect();
      var total = 0;
      routeRoads.forEach(function (road) {
        var length = road.getTotalLength();
        var matrix = road.getScreenCTM();
        var steps = Math.ceil(length / 8);
        for (var i = 0; i <= steps; i++) {
          var p = road.getPointAtLength(length * i / steps).matrixTransform(matrix);
          var x = p.x - box.left;
          var y = p.y - box.top;
          var prev = routePoints[routePoints.length - 1];
          if (prev) {
            var step = Math.hypot(x - prev.x, y - prev.y);
            if (step < 0.5) continue; // стык двух SVG — одна и та же точка
            total += step;
          }
          routePoints.push({ x: x, y: y, d: total });
        }
      });
    };

    // Полоса дороги проходит по экрану от 80% высоты окна до 30% — за это время машинка проезжает весь путь
    var routePlace = function () {
      if (routePoints.length < 2) {
        routeCar.style.left = routeCar.style.top = routeCarSvg.style.transform = '';
        return;
      }
      var street = routeStreet.getBoundingClientRect();
      var vh = window.innerHeight;
      var t = Math.min(1, Math.max(0, (vh * 0.8 - (street.top + street.height / 2)) / (vh * 0.5)));
      var total = routePoints[routePoints.length - 1].d;
      var start = Math.min(90, total * 0.08); // стартует сразу за меткой, а не на ней
      var dist = start + (total - start) * t;
      var i = 1;
      while (i < routePoints.length - 1 && routePoints[i].d < dist) i++;
      var a = routePoints[i - 1];
      var b = routePoints[i];
      var k = Math.min(1, Math.max(0, (dist - a.d) / (b.d - a.d)));
      routeCar.style.left = (a.x + (b.x - a.x) * k) + 'px';
      routeCar.style.top = (a.y + (b.y - a.y) * k) + 'px';
      routeCarSvg.style.transform = 'rotate(' + (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI) + 'deg)';
    };

    var routeQueued = false;
    var routeRefresh = function () { routeMeasure(); routePlace(); };
    window.addEventListener('scroll', function () {
      if (routeQueued) return;
      routeQueued = true;
      window.requestAnimationFrame(function () { routeQueued = false; routePlace(); });
    }, { passive: true });
    // Первый замер — в обратном вызове ResizeObserver: он приходит после раскладки и не заставляет браузер
    // раскладывать страницу лишний раз, пока она грузится
    window.addEventListener('load', routeRefresh);
    if (window.ResizeObserver) {
      new ResizeObserver(routeRefresh).observe(routeStreet.parentNode);
    } else {
      window.addEventListener('resize', routeRefresh);
      routeRefresh();
    }
  }

  /* ---------- Метки рекламы: запоминаем на время визита, подставляем во все формы ---------- */
  var utm = {};
  var store = storage();
  try { utm = JSON.parse((store && store.getItem('sd_utm')) || '{}') || {}; } catch (e) { utm = {}; }
  var params = new URLSearchParams(window.location.search);
  var fresh = false;
  UTM_KEYS.forEach(function (key) {
    var value = params.get(key);
    if (value) { utm[key] = value.slice(0, 200); fresh = true; }
  });
  if (fresh && store) {
    try { store.setItem('sd_utm', JSON.stringify(utm)); } catch (e) { /* приватный режим */ }
  }

  /* ---------- Формы заявок ---------- */
  var forms = document.querySelectorAll('[data-lead-form]');

  forms.forEach(function (form) {
    UTM_KEYS.forEach(function (key) {
      var input = form.elements[key];
      if (input && !input.value && utm[key]) input.value = utm[key];
    });
    // Фактический адрес страницы вместе с метками — так в заявке видно, откуда пришёл человек.
    if (form.elements.page_url) form.elements.page_url.value = window.location.href.split('#')[0];
    form.addEventListener('submit', onSubmit);
    form.addEventListener('input', function (e) { clearError(form, e.target.name); });
    form.addEventListener('change', function (e) { clearError(form, e.target.name); });
  });

  /* ---------- Маска телефона +7 (XXX) XXX-XX-XX: поля с data-phone-mask ---------- */
  function formatPhone(raw, deleting) {
    var d = raw.replace(/\D/g, '');
    // «+7…» — первая цифра код страны; «8 913…» и «7 913…» без плюса — тоже
    if (raw.trim().charAt(0) === '+' || d.charAt(0) === '8' || d.charAt(0) === '7') d = d.slice(1);
    d = d.slice(0, 10);
    if (!d) return '';
    var out = '+7 (' + d.slice(0, 3);
    if (d.length > 3 || (d.length === 3 && !deleting)) out += ') ' + d.slice(3, 6);
    if (d.length > 6 || (d.length === 6 && !deleting)) out += '-' + d.slice(6, 8);
    if (d.length > 8 || (d.length === 8 && !deleting)) out += '-' + d.slice(8, 10);
    return out;
  }

  document.querySelectorAll('[data-phone-mask]').forEach(function (input) {
    input.addEventListener('input', function (e) {
      input.value = formatPhone(input.value, (e.inputType || '').indexOf('delete') === 0);
    });
    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 (';
    });
    input.addEventListener('blur', function () {
      if (input.value.replace(/\D/g, '').length <= 1) input.value = '';
    });
  });

  // Кнопки «Записаться» в наборах подставляют услугу в форму блока записи.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-service]');
    if (!link) return;
    var target = document.getElementById('zayavka');
    var form = target && target.querySelector('[data-lead-form]');
    if (!form) return;
    form.elements.service.value = link.getAttribute('data-service');
    window.setTimeout(function () {
      var name = form.elements.name;
      if (name) name.focus({ preventScroll: true });
    }, 400);
  });

  function fieldError(form, name) {
    return form.querySelector('[data-error-for="' + name + '"]');
  }

  function clearError(form, name) {
    if (!name) return;
    var box = fieldError(form, name);
    if (box) { box.hidden = true; box.textContent = ''; }
    var input = form.elements[name];
    if (input && input.removeAttribute) input.removeAttribute('aria-invalid');
  }

  function showFieldErrors(form, errors) {
    var first = null;
    Object.keys(errors || {}).forEach(function (name) {
      var box = fieldError(form, name);
      var input = form.elements[name];
      if (box) { box.textContent = errors[name]; box.hidden = false; }
      if (input && input.setAttribute) {
        input.setAttribute('aria-invalid', 'true');
        if (box && box.id === '') box.id = (input.id || name) + '-error';
        if (box) input.setAttribute('aria-describedby', box.id);
        if (!first) first = input;
      }
    });
    if (first && first.focus) first.focus();
  }

  function validate(form) {
    var errors = {};
    if (!form.elements.name.value.trim()) errors.name = 'Как к вам обращаться?';
    var digits = form.elements.phone.value.replace(/\D/g, '');
    if (digits.length < 10) errors.phone = 'Укажите номер телефона, например ' + PHONE + '.';
    if (!form.elements.consent.checked) errors.consent = 'Без согласия на обработку данных мы не сможем связаться с вами.';
    return errors;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function showResult(form, kind, title, message, maxLink) {
    var box = form.querySelector('.lead-form__result');
    box.innerHTML = '';
    box.className = 'lead-form__result is-' + kind;
    if (title) box.appendChild(el('strong', '', title));
    if (message) box.appendChild(el('p', '', message));
    if (maxLink) {
      var a = el('a', 'btn btn--primary', 'Написать в MAX');
      a.href = maxLink;
      a.target = '_blank';
      a.rel = 'noopener';
      box.appendChild(a);
    }
    if (kind === 'error') {
      var p = el('p', '');
      p.appendChild(document.createTextNode('Или позвоните нам: '));
      var tel = el('a', '', PHONE);
      tel.href = 'tel:' + PHONE_TEL;
      p.appendChild(tel);
      box.appendChild(p);
    }
    box.hidden = false;
  }

  function onSubmit(e) {
    e.preventDefault();
    var form = e.currentTarget;
    var button = form.querySelector('[type="submit"]');
    if (button.disabled) return;

    ['name', 'phone', 'consent'].forEach(function (n) { clearError(form, n); });
    var errors = validate(form);
    if (Object.keys(errors).length) {
      showFieldErrors(form, errors);
      return;
    }

    var label = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Отправляем…';
    form.querySelector('.lead-form__result').hidden = true;

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    }).then(function (response) {
      var type = response.headers.get('Content-Type') || '';
      if (type.indexOf('application/json') === -1) {
        throw new Error('not-json:' + response.status);
      }
      return response.json().then(function (data) { return { status: response.status, data: data }; });
    }).then(function (res) {
      var data = res.data || {};
      if (data.success) {
        form.classList.add('is-sent');
        showResult(form, 'success', data.title || 'Заявка принята!', data.message || '', data.max_link || '');
        if (typeof window.ym === 'function' && document.body.dataset.metrika) {
          window.ym(Number(document.body.dataset.metrika), 'reachGoal', 'lead');
        }
        return;
      }
      showResult(form, 'error', '', data.message || 'Не удалось отправить заявку.', '');
      if (data.errors) showFieldErrors(form, data.errors);
    }).catch(function () {
      showResult(form, 'error', 'Не удалось отправить заявку', 'Похоже, сервер заявок сейчас недоступен. Попробуйте ещё раз через минуту.', '');
    }).then(function () {
      button.disabled = false;
      button.innerHTML = label;
    });
  }

  /* ---------- Яндекс SmartCaptcha: загружаем, только когда человек начал заполнять форму ---------- */
  var captchaLoaded = false;
  document.addEventListener('focusin', function (e) {
    if (captchaLoaded || !e.target.closest('[data-captcha]')) return;
    captchaLoaded = true;
    var s = document.createElement('script');
    s.src = 'https://smartcaptcha.yandexcloud.net/captcha.js';
    s.defer = true;
    document.head.appendChild(s);
  });

  /* ---------- Карта по нажатию: тяжёлый виджет не грузится вместе со страницей ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-map-src]');
    if (!btn) return;
    var box = btn.closest('.map-box');
    var frame = document.createElement('iframe');
    frame.src = btn.getAttribute('data-map-src');
    frame.title = btn.getAttribute('data-map-title') || 'Карта';
    frame.loading = 'lazy';
    frame.allowFullscreen = true;
    box.innerHTML = '';
    box.appendChild(frame);
  });

  /* ---------- Уведомление о cookies — только если подключена Метрика ---------- */
  if (document.body.dataset.metrika) {
    var seen = false;
    try { seen = window.localStorage.getItem('sd_cookie_ok') === '1'; } catch (e) { seen = false; }
    if (!seen) {
      var note = el('div', 'cookie-note');
      note.setAttribute('role', 'region');
      note.setAttribute('aria-label', 'Уведомление о cookies');
      var text = el('p', '', 'Сайт использует cookies и Яндекс.Метрику, чтобы понимать, какие страницы полезны. ');
      var more = el('a', '', 'Подробнее');
      more.href = '/politika-konfidentsialnosti';
      text.appendChild(more);
      var ok = el('button', 'btn btn--primary', 'Понятно');
      ok.type = 'button';
      ok.addEventListener('click', function () {
        try { window.localStorage.setItem('sd_cookie_ok', '1'); } catch (err) { /* ничего */ }
        note.remove();
      });
      note.appendChild(text);
      note.appendChild(ok);
      document.body.appendChild(note);
    }
  }
})();
