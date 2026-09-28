lucide.createIcons();

const RECAPTCHA_SITE_KEY = '6LeaN9QtAAAAAK9JhDr5-mPwB26VghVpk-wmYrq0';
const GOOGLE_SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyp1qXmvyq-Ev3hNO5f9kUPoZK9vXGj__Ij3q5sHLpHhWY0gU4dDLa98K5Wx1eJuYC3/exec';

window.renderRecaptchas = function renderRecaptchas() {
    if (!window.grecaptcha) return;

    document.querySelectorAll('.g-recaptcha').forEach((captcha) => {
        if (captcha.dataset.widgetId) return;

        const widgetId = window.grecaptcha.render(captcha, {
            sitekey: RECAPTCHA_SITE_KEY,
            theme: 'light',
        });
        captcha.dataset.widgetId = String(widgetId);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    saveTrafficSource();
    setupPhoneInputs();
    setupDateInputs();

    if (window.grecaptcha) {
        window.renderRecaptchas();
    }
});

function validateCaptcha(form) {
    const captcha = form.querySelector('.g-recaptcha');
    if (!captcha) return true;

    if (!window.grecaptcha) {
        showFormMessage(form, 'error', 'РљР°РїС‡Р° РµС‰Рµ Р·Р°РіСЂСѓР¶Р°РµС‚СЃСЏ', 'РџРѕРґРѕР¶РґРёС‚Рµ РїР°СЂСѓ СЃРµРєСѓРЅРґ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.');
        return false;
    }

    if (!captcha.dataset.widgetId) {
        window.renderRecaptchas();
    }

    const widgetId = Number(captcha.dataset.widgetId);
    const token = window.grecaptcha.getResponse(widgetId);
    if (token) return true;

    showFormMessage(form, 'error', 'РџРѕРґС‚РІРµСЂРґРёС‚Рµ РґРµР№СЃС‚РІРёРµ', 'РџРѕСЃС‚Р°РІСЊС‚Рµ РіР°Р»РѕС‡РєСѓ В«РЇ РЅРµ СЂРѕР±РѕС‚В», С‡С‚РѕР±С‹ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ.');
    return false;
}

function resetCaptcha(form) {
    const captcha = form.querySelector('.g-recaptcha');
    if (!captcha || !window.grecaptcha || !captcha.dataset.widgetId) return;
    window.grecaptcha.reset(Number(captcha.dataset.widgetId));
}

function formatMoscowDate(date = new Date()) {
    return new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(date).replace(',', '');
}

function getStoredTrafficSource() {
    return sessionStorage.getItem('trafficSource') || '';
}

function saveTrafficSource() {
    if (getStoredTrafficSource()) return;

    const params = new URLSearchParams(window.location.search);
    const utmSource = (params.get('utm_source') || '').toLowerCase();
    const referrer = document.referrer || '';
    let referrerHost = '';

    try {
        referrerHost = referrer ? new URL(referrer).hostname.toLowerCase() : '';
    } catch (error) {
        referrerHost = '';
    }

    let trafficSource = 'РџСЂСЏРјРѕР№ Р·Р°С…РѕРґ';

    if (utmSource.includes('vk') || params.has('vkclid')) {
        trafficSource = 'VK Р РµРєР»Р°РјР°';
    } else if (utmSource.includes('yandex') || utmSource.includes('ya') || params.has('yclid') || params.has('ymclid')) {
        trafficSource = 'РЇРЅРґРµРєСЃ Р РµРєР»Р°РјР°';
    } else if (utmSource.includes('google')) {
        trafficSource = 'Google Р РµРєР»Р°РјР°';
    } else if (utmSource) {
        trafficSource = 'Р РµРєР»Р°РјР°: ' + utmSource;
    } else if (referrerHost.includes('vk.com') || referrerHost.includes('vk.ru')) {
        trafficSource = 'VK';
    } else if (referrerHost.includes('yandex.')) {
        trafficSource = 'РЇРЅРґРµРєСЃ РџРѕРёСЃРє';
    } else if (referrerHost.includes('google.')) {
        trafficSource = 'Google РџРѕРёСЃРє';
    } else if (referrerHost) {
        trafficSource = 'Р”СЂСѓРіРѕР№ СЃР°Р№С‚: ' + referrerHost;
    }

    sessionStorage.setItem('trafficSource', trafficSource);
}

function calculateAge(dateText) {
    if (!dateText) return '';
    const match = dateText.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return '';

    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const birthDate = new Date(year, month, day);
    if (Number.isNaN(birthDate.getTime())) return '';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
    }

    return age > 0 && age < 100 ? String(age) : '';
}

function getFieldValue(form, selector) {
    const field = form.querySelector(selector);
    return field ? field.value.trim() : '';
}

function showFormMessage(form, type, title, text) {
    const box = form.querySelector('.form-result');
    if (!box) return;

    box.className = 'form-result is-' + type;
    box.innerHTML = '<strong>' + title + '</strong><span>' + text + '</span>';
    box.classList.remove('hidden');
}

function clearFormMessage(form) {
    const box = form.querySelector('.form-result');
    if (!box) return;
    box.className = 'form-result hidden';
    box.innerHTML = '';
}

function setFormPending(form, isPending) {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;

    if (isPending) {
        button.dataset.defaultText = button.innerHTML;
        button.disabled = true;
        button.classList.add('opacity-70', 'pointer-events-none');
    } else {
        button.disabled = false;
        button.classList.remove('opacity-70', 'pointer-events-none');
        if (button.dataset.defaultText) {
            button.innerHTML = button.dataset.defaultText;
        }
    }
}

function isValidPhone(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 11 && digits.length <= 12;
}

function isValidDateText(value) {
    const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return false;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day
        && year >= 1940
        && year <= new Date().getFullYear();
}

function markInvalidField(field) {
    if (!field) return;
    field.focus({ preventScroll: false });
    field.classList.add('border-red-400');
    window.setTimeout(() => field.classList.remove('border-red-400'), 1800);
}

function validateLeadForm(form) {
    const phone = form.querySelector('input[type="tel"]');
    if (phone && !isValidPhone(phone.value)) {
        showFormMessage(form, 'error', 'РџСЂРѕРІРµСЂСЊС‚Рµ С‚РµР»РµС„РѕРЅ', 'РЈРєР°Р¶РёС‚Рµ РїРѕР»РЅС‹Р№ РЅРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°, С‡С‚РѕР±С‹ РєРѕРѕСЂРґРёРЅР°С‚РѕСЂ РјРѕРі СЃРІСЏР·Р°С‚СЊСЃСЏ СЃ РІР°РјРё.');
        markInvalidField(phone);
        return false;
    }

    const date = form.querySelector('.date-input');
    if (date && date.value.trim() && !isValidDateText(date.value.trim())) {
        showFormMessage(form, 'error', 'РџСЂРѕРІРµСЂСЊС‚Рµ РґР°С‚Сѓ СЂРѕР¶РґРµРЅРёСЏ', 'Р’РІРµРґРёС‚Рµ РґР°С‚Сѓ РІ С„РѕСЂРјР°С‚Рµ РґРґ.РјРј.РіРіРіРі, РЅР°РїСЂРёРјРµСЂ 18.01.2001.');
        markInvalidField(date);
        return false;
    }

    const requiredFields = Array.from(form.querySelectorAll('input[required], select[required]'));

    for (const field of requiredFields) {
        if (field.type === 'checkbox' && !field.checked) {
            showFormMessage(form, 'error', 'Р—Р°РїРѕР»РЅРёС‚Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ', 'РџРѕРґС‚РІРµСЂРґРёС‚Рµ СЃРѕРіР»Р°СЃРёРµ, С‡С‚РѕР±С‹ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ.');
            markInvalidField(field);
            return false;
        }

        if (field.tagName === 'SELECT' && !field.value.trim()) {
            showFormMessage(form, 'error', 'Р—Р°РїРѕР»РЅРёС‚Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ', 'Р’С‹Р±РµСЂРёС‚Рµ РІР°РєР°РЅСЃРёСЋ РёР· СЃРїРёСЃРєР°.');
            markInvalidField(field);
            return false;
        }

        if (field.type !== 'checkbox' && !field.value.trim()) {
            showFormMessage(form, 'error', 'Р—Р°РїРѕР»РЅРёС‚Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ', 'Р—Р°РїРѕР»РЅРёС‚Рµ РІСЃРµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ С„РѕСЂРјС‹.');
            markInvalidField(field);
            return false;
        }
    }

    if (date && !isValidDateText(date.value.trim())) {
        showFormMessage(form, 'error', 'РџСЂРѕРІРµСЂСЊС‚Рµ РґР°С‚Сѓ СЂРѕР¶РґРµРЅРёСЏ', 'Р’РІРµРґРёС‚Рµ РґР°С‚Сѓ РІ С„РѕСЂРјР°С‚Рµ РґРґ.РјРј.РіРіРіРі, РЅР°РїСЂРёРјРµСЂ 18.01.2001.');
        markInvalidField(date);
        return false;
    }

    return true;
}

function trackYandexGoal(goalName) {
    if (typeof window.ym !== 'function') return;
    window.ym(113130698, 'reachGoal', goalName);
}

function trackVkGoal(goalName) {
    window._tmr = window._tmr || [];
    window._tmr.push({ id: '3797789', type: 'reachGoal', goal: goalName });
}

function trackLeadGoals(goalName) {
    trackYandexGoal('lead_submit');
    trackYandexGoal(goalName);
    trackVkGoal('lead_submit');
    trackVkGoal(goalName);
}

function collectLeadData(form, source) {
    const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="range"]), select');
    const dateValue = getFieldValue(form, '.date-input');

    return {
        submittedAt: formatMoscowDate(),
        phone: getFieldValue(form, 'input[type="tel"]'),
        name: inputs[0] ? inputs[0].value.trim() : '',
        vacancy: getFieldValue(form, '#modal-job-input') || (inputs[2] ? inputs[2].value.trim() : ''),
        city: getFieldValue(form, 'input[placeholder="Р’Р°С€ РіРѕСЂРѕРґ"]'),
        age: calculateAge(dateValue),
        trafficSource: getStoredTrafficSource() || 'РџСЂСЏРјРѕР№ Р·Р°С…РѕРґ',
        source,
    };
}

async function submitLead(form, source) {
    if (!GOOGLE_SHEETS_ENDPOINT) {
        throw new Error('РќРµ РїРѕРґРєР»СЋС‡РµРЅ URL Google Apps Script РґР»СЏ РѕС‚РїСЂР°РІРєРё Р·Р°СЏРІРѕРє.');
    }

    const payload = collectLeadData(form, source);
    if (!isValidPhone(payload.phone)) {
        throw new Error('РЈРєР°Р¶РёС‚Рµ РєРѕСЂСЂРµРєС‚РЅС‹Р№ РЅРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°.');
    }

    await fetch(GOOGLE_SHEETS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
    });
}

function setupPhoneInputs() {
    document.querySelectorAll('.phone-input').forEach((input) => {
        if (!input.value.trim()) input.value = '+7 ';
        input.maxLength = 18;

        input.addEventListener('focus', () => {
            if (!input.value.trim()) input.value = '+7 ';
        });

        input.addEventListener('input', () => {
            const startsWithPlus = input.value.trim().startsWith('+');
            let digits = input.value.replace(/\D/g, '').slice(0, 11);

            if (!digits) {
                input.value = startsWithPlus ? '+' : '+7 ';
                return;
            }

            if (digits[0] === '8') digits = '7' + digits.slice(1);
            if (digits[0] !== '7' && !startsWithPlus) digits = '7' + digits;

            const country = digits[0] || '7';
            const rest = digits.slice(1);
            const parts = ['+' + country];
            if (rest.slice(0, 3)) parts.push(' ' + rest.slice(0, 3));
            if (rest.slice(3, 6)) parts.push(' ' + rest.slice(3, 6));
            if (rest.slice(6, 8)) parts.push('-' + rest.slice(6, 8));
            if (rest.slice(8, 10)) parts.push('-' + rest.slice(8, 10));
            input.value = parts.join('');
        });
    });
}

function setupDateInputs() {
    document.querySelectorAll('.date-input').forEach((input) => {
        input.addEventListener('input', () => {
            const digits = input.value.replace(/\D/g, '').slice(0, 8);
            const parts = [];
            if (digits.slice(0, 2)) parts.push(digits.slice(0, 2));
            if (digits.slice(2, 4)) parts.push(digits.slice(2, 4));
            if (digits.slice(4, 8)) parts.push(digits.slice(4, 8));
            input.value = parts.join('.');
        });
    });
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function openModal(title = 'Р—Р°РєР°Р·Р°С‚СЊ Р·РІРѕРЅРѕРє') {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-job-input').value = 'РРЅРґРёРІРёРґСѓР°Р»СЊРЅС‹Р№ РїРѕРґР±РѕСЂ';
    document.getElementById('modal-calc-data').value = '';
    window.renderRecaptchas();
}

function openModalWithPrefill(jobTitle, salary) {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'РћС‚РєР»РёРє: ' + jobTitle;
    document.getElementById('modal-subtitle').textContent = 'РЎС‚Р°РІРєР°: ' + salary + '. РљРѕРѕСЂРґРёРЅР°С‚РѕСЂ СЃРІСЏР¶РµС‚СЃСЏ РґР»СЏ СЃРѕРіР»Р°СЃРѕРІР°РЅРёСЏ Р±РёР»РµС‚РѕРІ.';
    document.getElementById('modal-job-input').value = jobTitle;
    document.getElementById('modal-calc-data').value = salary;
    window.renderRecaptchas();
}

function closeModal() {
    document.getElementById('modal-backdrop').classList.add('hidden');
}

function filterVacancies(category) {
    const cards = document.querySelectorAll('.vacancy-card');
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach((btn) => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    cards.forEach((card) => {
        card.style.display = category === 'all' || card.classList.contains(category) ? 'flex' : 'none';
    });
}

function updateCalculator() {
    const sliderVal = parseInt(document.getElementById('days-slider').value, 10);
    const daysMap = { 1: 30, 2: 45, 3: 60, 4: 90 };
    const days = daysMap[sliderVal];

    const ratePerMonth = parseInt(document.getElementById('calc-prof').value, 10);
    document.getElementById('days-val').textContent = days + ' РґРЅРµР№';

    const total = Math.round((ratePerMonth / 30) * days);
    document.getElementById('total-income').textContent = total.toLocaleString('ru-RU') + ' в‚Ѕ';
}

function handleCalcApply() {
    const selectEl = document.getElementById('calc-prof');
    const profName = selectEl.options[selectEl.selectedIndex].getAttribute('data-name');

    const sliderVal = parseInt(document.getElementById('days-slider').value, 10);
    const daysMap = { 1: 30, 2: 45, 3: 60, 4: 90 };
    const days = daysMap[sliderVal];

    const total = document.getElementById('total-income').textContent;

    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'Р‘СЂРѕРЅРёСЂРѕРІР°РЅРёРµ СЃС‚Р°РІРєРё: ' + total;
    document.getElementById('modal-subtitle').textContent = 'Р Р°СЃС‡РµС‚ РЅР° РІР°С…С‚Сѓ ' + days + ' РґРЅРµР№ (' + profName + ').';
    document.getElementById('modal-job-input').value = profName;
    document.getElementById('modal-calc-data').value = 'Р’Р°С…С‚Р°: ' + days + ' РґРЅ., Р Р°СЃС‡РµС‚: ' + total;
    window.renderRecaptchas();
}

async function handleFormSubmit(e, source = 'Р“Р»Р°РІРЅС‹Р№ СЌРєСЂР°РЅ') {
    e.preventDefault();
    const form = e.target;
    clearFormMessage(form);
    if (!validateLeadForm(form)) return;
    if (!validateCaptcha(form)) return;
    try {
        setFormPending(form, true);
        showFormMessage(form, 'pending', 'РћС‚РїСЂР°РІР»СЏРµРј Р·Р°СЏРІРєСѓ', 'РџРѕРґРѕР¶РґРёС‚Рµ РЅРµСЃРєРѕР»СЊРєРѕ СЃРµРєСѓРЅРґ, РґР°РЅРЅС‹Рµ РїРµСЂРµРґР°СЋС‚СЃСЏ РєРѕРѕСЂРґРёРЅР°С‚РѕСЂСѓ.');
        await submitLead(form, source);
        showFormMessage(form, 'success', 'Р—Р°СЏРІРєР° РїСЂРёРЅСЏС‚Р°', 'Р”Р°РЅРЅС‹Рµ РїРµСЂРµРґР°РЅС‹ РєРѕРѕСЂРґРёРЅР°С‚РѕСЂСѓ. РњС‹ СЃРІСЏР¶РµРјСЃСЏ СЃ РІР°РјРё РІ Р±Р»РёР¶Р°Р№С€РµРµ РІСЂРµРјСЏ.');
        trackLeadGoals('lead_hero');
        form.reset();
        resetCaptcha(form);
        setupPhoneInputs();
    } catch (error) {
        showFormMessage(form, 'error', 'Р—Р°СЏРІРєР° РЅРµ РѕС‚РїСЂР°РІР»РµРЅР°', error.message || 'РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕР»СЏ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·.');
    } finally {
        setFormPending(form, false);
    }
}

async function handleBottomFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    clearFormMessage(form);
    if (!validateLeadForm(form)) return;
    if (!validateCaptcha(form)) return;
    try {
        setFormPending(form, true);
        showFormMessage(form, 'pending', 'РћС‚РїСЂР°РІР»СЏРµРј Р·Р°СЏРІРєСѓ', 'РџРѕРґРѕР¶РґРёС‚Рµ РЅРµСЃРєРѕР»СЊРєРѕ СЃРµРєСѓРЅРґ, РґР°РЅРЅС‹Рµ РїРµСЂРµРґР°СЋС‚СЃСЏ РєРѕРѕСЂРґРёРЅР°С‚РѕСЂСѓ.');
        await submitLead(form, 'РђРЅРєРµС‚Р° РєР°РЅРґРёРґР°С‚Р°');
        showFormMessage(form, 'success', 'РђРЅРєРµС‚Р° Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅР°', 'РљРѕРѕСЂРґРёРЅР°С‚РѕСЂ СЃРІСЏР¶РµС‚СЃСЏ СЃ РІР°РјРё РІ Р±Р»РёР¶Р°Р№С€РµРµ РІСЂРµРјСЏ.');
        trackLeadGoals('lead_bottom');
        form.reset();
        resetCaptcha(form);
        setupPhoneInputs();
    } catch (error) {
        showFormMessage(form, 'error', 'РђРЅРєРµС‚Р° РЅРµ РѕС‚РїСЂР°РІР»РµРЅР°', error.message || 'РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕР»СЏ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·.');
    } finally {
        setFormPending(form, false);
    }
}

async function handleModalSubmit(e) {
    e.preventDefault();
    const form = e.target;
    clearFormMessage(form);
    if (!validateLeadForm(form)) return;
    if (!validateCaptcha(form)) return;
    try {
        setFormPending(form, true);
        showFormMessage(form, 'pending', 'РћС‚РїСЂР°РІР»СЏРµРј Р°РЅРєРµС‚Сѓ', 'РџРѕРґРѕР¶РґРёС‚Рµ РЅРµСЃРєРѕР»СЊРєРѕ СЃРµРєСѓРЅРґ, РґР°РЅРЅС‹Рµ РїРµСЂРµРґР°СЋС‚СЃСЏ РєРѕРѕСЂРґРёРЅР°С‚РѕСЂСѓ.');
        await submitLead(form, 'РњРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ');
        showFormMessage(form, 'success', 'РђРЅРєРµС‚Р° РѕС‚РїСЂР°РІР»РµРЅР°', 'РњС‹ СЃРІСЏР¶РµРјСЃСЏ СЃ РІР°РјРё РІ С‚РµС‡РµРЅРёРµ СЂР°Р±РѕС‡РµРіРѕ РґРЅСЏ.');
        trackLeadGoals('lead_modal');
        form.reset();
        resetCaptcha(form);
        setupPhoneInputs();
    } catch (error) {
        showFormMessage(form, 'error', 'РђРЅРєРµС‚Р° РЅРµ РѕС‚РїСЂР°РІР»РµРЅР°', error.message || 'РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕР»СЏ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·.');
    } finally {
        setFormPending(form, false);
    }
}

