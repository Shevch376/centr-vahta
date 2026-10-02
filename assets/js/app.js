lucide.createIcons();

const GOOGLE_SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw9cC5ZFoS7hJ7c6XvcdY3T4BWNaSBp5XwEuVw_f6t9AnCcJFhPHHDuDFc92CfChsce/exec';
const LEAD_FAST_CONFIRM_MS = 1500;

document.addEventListener('DOMContentLoaded', () => {
    saveTrafficSource();
    setupPhoneInputs();
    setupDateInputs();
    setupModalControls();
    setupLeadOpenTracking();
});

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
    sessionStorage.setItem('trafficSource', detectTrafficSource());
}

function detectTrafficSource() {
    const params = new URLSearchParams(window.location.search);
    const utmSource = (params.get('utm_source') || '').toLowerCase();
    const referrer = document.referrer || '';
    let referrerHost = '';
    let currentHost = '';

    try {
        referrerHost = referrer ? new URL(referrer).hostname.toLowerCase() : '';
    } catch (error) {
        referrerHost = '';
    }

    try {
        currentHost = window.location.hostname.toLowerCase();
    } catch (error) {
        currentHost = '';
    }

    let trafficSource = '\u041f\u0440\u044f\u043c\u043e\u0439 \u0437\u0430\u0445\u043e\u0434';

    if (utmSource.includes('vk') || params.has('vkclid')) {
        trafficSource = 'VK \u0440\u0435\u043a\u043b\u0430\u043c\u0430';
    } else if (utmSource.includes('yandex') || utmSource.includes('ya') || params.has('yclid') || params.has('ymclid')) {
        trafficSource = '\u042f\u043d\u0434\u0435\u043a\u0441 \u0440\u0435\u043a\u043b\u0430\u043c\u0430';
    } else if (utmSource.includes('google')) {
        trafficSource = 'Google \u0440\u0435\u043a\u043b\u0430\u043c\u0430';
    } else if (utmSource) {
        trafficSource = '\u0420\u0435\u043a\u043b\u0430\u043c\u0430: ' + utmSource;
    } else if (referrerHost.includes('vk.com') || referrerHost.includes('vk.ru')) {
        trafficSource = 'VK';
    } else if (referrerHost.includes('yandex.')) {
        trafficSource = '\u042f\u043d\u0434\u0435\u043a\u0441 \u043f\u043e\u0438\u0441\u043a';
    } else if (referrerHost.includes('google.')) {
        trafficSource = 'Google \u043f\u043e\u0438\u0441\u043a';
    } else if (referrerHost && referrerHost !== currentHost) {
        trafficSource = '\u0414\u0440\u0443\u0433\u043e\u0439 \u0441\u0430\u0439\u0442: ' + referrerHost;
    }

    return trafficSource;
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
    if (type === 'success') {
        if (form.closest('#modal-backdrop')) {
            box.innerHTML += '<button type="button" class="form-result-close" onclick="closeModal()">Закрыть</button>';
        } else {
            box.innerHTML += '<button type="button" class="form-result-dismiss" onclick="dismissFormMessage(this)" aria-label="Закрыть сообщение">×</button>';
        }
    }
    box.classList.remove('hidden');
}

function dismissFormMessage(button) {
    const box = button.closest('.form-result');
    if (!box) return;
    box.className = 'form-result hidden';
    box.innerHTML = '';
}

function clearFormMessage(form) {
    const box = form.querySelector('.form-result');
    if (!box) return;
    box.className = 'form-result hidden';
    box.innerHTML = '';
}

function showLeadToast() {
    const toast = document.getElementById('lead-toast');
    if (!toast) return;

    window.clearTimeout(showLeadToast.timer);
    toast.classList.remove('hidden');
    toast.classList.add('is-visible');
    showLeadToast.timer = window.setTimeout(() => {
        toast.classList.remove('is-visible');
        window.setTimeout(() => toast.classList.add('hidden'), 250);
    }, 4200);
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

function normalizePhoneDigits(value) {
    return value.replace(/\D/g, '').slice(0, 11);
}

function formatPhoneValue(value) {
    const digits = normalizePhoneDigits(value);
    if (!digits) return '';

    const hasCountryCode = digits.length > 10 && (digits[0] === '7' || digits[0] === '8');
    const prefix = hasCountryCode ? digits[0] : '';
    const rest = hasCountryCode ? digits.slice(1) : digits;
    const parts = prefix ? [prefix] : [];

    if (rest.slice(0, 3)) parts.push(' ' + rest.slice(0, 3));
    if (rest.slice(3, 6)) parts.push(' ' + rest.slice(3, 6));
    if (rest.slice(6, 8)) parts.push('-' + rest.slice(6, 8));
    if (rest.slice(8, 10)) parts.push('-' + rest.slice(8, 10));

    return parts.join('').trim();
}

function countDigitsBeforeCursor(value, cursorPosition) {
    return value.slice(0, cursorPosition).replace(/\D/g, '').length;
}

function getCursorPositionByDigitCount(value, digitCount) {
    if (digitCount <= 0) return 0;

    let seenDigits = 0;
    for (let index = 0; index < value.length; index += 1) {
        if (/\d/.test(value[index])) {
            seenDigits += 1;
        }
        if (seenDigits >= digitCount) {
            return index + 1;
        }
    }

    return value.length;
}

function isValidPhone(value) {
    const digits = normalizePhoneDigits(value);
    return digits.length === 10 || (digits.length === 11 && (digits[0] === '7' || digits[0] === '8'));
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
        showFormMessage(form, 'error', 'Проверьте телефон', 'Укажите полный номер телефона, чтобы координатор мог связаться с вами.');
        markInvalidField(phone);
        return false;
    }

    const date = form.querySelector('.date-input');
    if (date && date.value.trim() && !isValidDateText(date.value.trim())) {
        showFormMessage(form, 'error', 'Проверьте дату рождения', 'Введите дату в формате дд.мм.гггг, например 18.01.2001.');
        markInvalidField(date);
        return false;
    }

    const requiredFields = Array.from(form.querySelectorAll('input[required], select[required]'));

    for (const field of requiredFields) {
        if (field.type === 'checkbox' && !field.checked) {
            showFormMessage(form, 'error', 'Заполните обязательные поля', 'Подтвердите согласие, чтобы отправить заявку.');
            markInvalidField(field);
            return false;
        }

        if (field.tagName === 'SELECT' && !field.value.trim()) {
            showFormMessage(form, 'error', 'Заполните обязательные поля', 'Выберите вакансию из списка.');
            markInvalidField(field);
            return false;
        }

        if (field.type !== 'checkbox' && !field.value.trim()) {
            showFormMessage(form, 'error', 'Заполните обязательные поля', 'Заполните все обязательные поля формы.');
            markInvalidField(field);
            return false;
        }
    }

    if (date && !isValidDateText(date.value.trim())) {
        showFormMessage(form, 'error', 'Проверьте дату рождения', 'Введите дату в формате дд.мм.гггг, например 18.01.2001.');
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
        city: getFieldValue(form, 'input[placeholder="Ваш город"]'),
        age: calculateAge(dateValue),
        trafficSource: getStoredTrafficSource() || 'Прямой заход',
        source,
    };
}

async function submitLead(form, source) {
    if (!GOOGLE_SHEETS_ENDPOINT) {
        throw new Error('Не подключен URL Google Apps Script для отправки заявок.');
    }

    const payload = collectLeadData(form, source);
    if (!isValidPhone(payload.phone)) {
        throw new Error('Укажите корректный номер телефона.');
    }

    const payloadText = JSON.stringify(payload);
    const request = fetch(GOOGLE_SHEETS_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: payloadText,
            keepalive: true,
        })
        .catch((error) => {
            console.warn('Lead background submission failed', error);
        });

    await Promise.race([
        request,
        new Promise((resolve) => window.setTimeout(resolve, LEAD_FAST_CONFIRM_MS)),
    ]);
}

function setupPhoneInputs() {
    document.querySelectorAll('.phone-input').forEach((input) => {
        input.maxLength = 18;

        input.addEventListener('input', () => {
            const cursorPosition = input.selectionStart || 0;
            const digitCount = countDigitsBeforeCursor(input.value, cursorPosition);
            const formattedValue = formatPhoneValue(input.value);
            const nextCursorPosition = getCursorPositionByDigitCount(formattedValue, digitCount);

            input.value = formattedValue;
            input.setSelectionRange(nextCursorPosition, nextCursorPosition);
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

function setupLeadOpenTracking() {
    document.querySelectorAll('form[onsubmit*="handleFormSubmit"], form[onsubmit*="handleBottomFormSubmit"]').forEach((form) => {
        const trackOnce = () => {
            if (form.dataset.leadOpenTracked) return;
            form.dataset.leadOpenTracked = 'true';
            trackVkGoal('lead_open');
        };

        form.addEventListener('focusin', trackOnce);
        form.addEventListener('input', trackOnce);
        form.addEventListener('change', trackOnce);
    });
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function setModalJobValue(value) {
    const field = document.getElementById('modal-job-input');
    if (!field) return;

    const hasOption = Array.from(field.options || []).some((option) => option.value === value);
    if (!hasOption && value) {
        field.add(new Option(value, value));
    }
    field.value = value;
}

function resetModalForm() {
    const backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) return;

    const form = backdrop.querySelector('form');
    if (!form) return;

    form.reset();
    clearFormMessage(form);
    setFormPending(form, false);

    const calcData = document.getElementById('modal-calc-data');
    if (calcData) calcData.value = '';
}

function openModal(title = 'Заказать звонок') {
    trackVkGoal('lead_open');
    resetModalForm();
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-subtitle').textContent = 'Оставьте контакты для согласования даты выезда и бронирования билетов.';
    setModalJobValue('Индивидуальный подбор');
    document.getElementById('modal-calc-data').value = '';
}

function openModalWithPrefill(jobTitle, salary) {
    trackVkGoal('lead_open');
    resetModalForm();
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'Отклик: ' + jobTitle;
    document.getElementById('modal-subtitle').textContent = 'Ставка: ' + salary + '. Координатор свяжется для согласования билетов.';
    setModalJobValue(jobTitle);
    document.getElementById('modal-calc-data').value = salary;
}

function closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.classList.add('hidden');
    resetModalForm();
}

function setupModalControls() {
    const backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) return;

    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !backdrop.classList.contains('hidden')) {
            closeModal();
        }
    });
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
    document.getElementById('days-val').textContent = days + ' дней';

    const total = Math.round((ratePerMonth / 30) * days);
    document.getElementById('total-income').textContent = total.toLocaleString('ru-RU') + ' ₽';
}

function handleCalcApply() {
    trackVkGoal('lead_open');
    const selectEl = document.getElementById('calc-prof');
    const profName = selectEl.options[selectEl.selectedIndex].getAttribute('data-name');

    const sliderVal = parseInt(document.getElementById('days-slider').value, 10);
    const daysMap = { 1: 30, 2: 45, 3: 60, 4: 90 };
    const days = daysMap[sliderVal];

    const total = document.getElementById('total-income').textContent;

    resetModalForm();
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'Бронирование ставки: ' + total;
    document.getElementById('modal-subtitle').textContent = 'Расчет на вахту ' + days + ' дней (' + profName + ').';
    setModalJobValue(profName);
    document.getElementById('modal-calc-data').value = 'Вахта: ' + days + ' дн., Расчет: ' + total;
}

async function handleFormSubmit(e, source = 'Главный экран') {
    e.preventDefault();
    const form = e.target;
    clearFormMessage(form);
    if (!validateLeadForm(form)) return;
    try {
        setFormPending(form, true);
        await submitLead(form, source);
        showFormMessage(form, 'success', 'Заявка принята', 'Данные переданы координатору. Мы свяжемся с вами в ближайшее время.');
        showLeadToast();
        trackLeadGoals('lead_hero');
        form.reset();
        setupPhoneInputs();
    } catch (error) {
        showFormMessage(form, 'error', 'Заявка не отправлена', error.message || 'Проверьте поля и попробуйте еще раз.');
    } finally {
        setFormPending(form, false);
    }
}

async function handleBottomFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    clearFormMessage(form);
    if (!validateLeadForm(form)) return;
    try {
        setFormPending(form, true);
        await submitLead(form, 'Анкета кандидата');
        showFormMessage(form, 'success', 'Анкета зарегистрирована', 'Координатор свяжется с вами в ближайшее время.');
        showLeadToast();
        trackLeadGoals('lead_bottom');
        form.reset();
        setupPhoneInputs();
    } catch (error) {
        showFormMessage(form, 'error', 'Анкета не отправлена', error.message || 'Проверьте поля и попробуйте еще раз.');
    } finally {
        setFormPending(form, false);
    }
}

async function handleModalSubmit(e) {
    e.preventDefault();
    const form = e.target;
    clearFormMessage(form);
    if (!validateLeadForm(form)) return;
    try {
        setFormPending(form, true);
        await submitLead(form, 'Модальное окно');
        trackLeadGoals('lead_modal');
        form.reset();
        setupPhoneInputs();
        closeModal();
        showLeadToast();
    } catch (error) {
        showFormMessage(form, 'error', 'Анкета не отправлена', error.message || 'Проверьте поля и попробуйте еще раз.');
    } finally {
        setFormPending(form, false);
    }
}

