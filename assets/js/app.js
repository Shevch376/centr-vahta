lucide.createIcons();

const RECAPTCHA_SITE_KEY = '6LeaN9QtAAAAAK9JhDr5-mPwB26VghVpk-wmYrq0';
const GOOGLE_SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzUhOtqiNofsFX5pJJVjbuC7roHCMDmrZN6HuNfQngC9Uu6P-Qjn4FOw1vDcSzWSnDD/exec';

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
        showFormMessage(form, 'error', 'Капча еще загружается', 'Подождите пару секунд и попробуйте снова.');
        return false;
    }

    if (!captcha.dataset.widgetId) {
        window.renderRecaptchas();
    }

    const widgetId = Number(captcha.dataset.widgetId);
    const token = window.grecaptcha.getResponse(widgetId);
    if (token) return true;

    showFormMessage(form, 'error', 'Подтвердите действие', 'Поставьте галочку «Я не робот», чтобы отправить заявку.');
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

function collectLeadData(form, source) {
    const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="range"]), select');
    const dateValue = getFieldValue(form, '.date-input');

    return {
        submittedAt: formatMoscowDate(),
        phone: getFieldValue(form, 'input[type="tel"]'),
        name: inputs[0] ? inputs[0].value.trim() : '',
        vacancy: getFieldValue(form, '#modal-job-input') || (inputs[2] ? inputs[2].value.trim() : '') || source,
        city: getFieldValue(form, 'input[placeholder="Ваш город"]'),
        age: calculateAge(dateValue),
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

function openModal(title = 'Заказать звонок') {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-job-input').value = 'Индивидуальный подбор';
    document.getElementById('modal-calc-data').value = '';
    window.renderRecaptchas();
}

function openModalWithPrefill(jobTitle, salary) {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'Отклик: ' + jobTitle;
    document.getElementById('modal-subtitle').textContent = 'Ставка: ' + salary + '. Координатор свяжется для согласования билетов.';
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
    document.getElementById('days-val').textContent = days + ' дней';

    const total = Math.round((ratePerMonth / 30) * days);
    document.getElementById('total-income').textContent = total.toLocaleString('ru-RU') + ' ₽';
}

function handleCalcApply() {
    const selectEl = document.getElementById('calc-prof');
    const profName = selectEl.options[selectEl.selectedIndex].getAttribute('data-name');

    const sliderVal = parseInt(document.getElementById('days-slider').value, 10);
    const daysMap = { 1: 30, 2: 45, 3: 60, 4: 90 };
    const days = daysMap[sliderVal];

    const total = document.getElementById('total-income').textContent;

    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'Бронирование ставки: ' + total;
    document.getElementById('modal-subtitle').textContent = 'Расчет на вахту ' + days + ' дней (' + profName + ').';
    document.getElementById('modal-job-input').value = profName;
    document.getElementById('modal-calc-data').value = 'Вахта: ' + days + ' дн., Расчет: ' + total;
    window.renderRecaptchas();
}

async function handleFormSubmit(e, source = 'Главный экран') {
    e.preventDefault();
    const form = e.target;
    clearFormMessage(form);
    if (!validateCaptcha(form)) return;
    try {
        setFormPending(form, true);
        showFormMessage(form, 'pending', 'Отправляем заявку', 'Подождите несколько секунд, данные передаются координатору.');
        await submitLead(form, source);
        showFormMessage(form, 'success', 'Заявка принята', 'Данные переданы координатору. Мы свяжемся с вами в ближайшее время.');
        form.reset();
        resetCaptcha(form);
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
    if (!validateCaptcha(form)) return;
    try {
        setFormPending(form, true);
        showFormMessage(form, 'pending', 'Отправляем заявку', 'Подождите несколько секунд, данные передаются координатору.');
        await submitLead(form, 'Анкета кандидата');
        showFormMessage(form, 'success', 'Анкета зарегистрирована', 'Координатор свяжется с вами в ближайшее время.');
        form.reset();
        resetCaptcha(form);
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
    if (!validateCaptcha(form)) return;
    try {
        setFormPending(form, true);
        showFormMessage(form, 'pending', 'Отправляем анкету', 'Подождите несколько секунд, данные передаются координатору.');
        await submitLead(form, 'Модальное окно');
        showFormMessage(form, 'success', 'Анкета отправлена', 'Мы свяжемся с вами в течение рабочего дня.');
        form.reset();
        resetCaptcha(form);
        setupPhoneInputs();
    } catch (error) {
        showFormMessage(form, 'error', 'Анкета не отправлена', error.message || 'Проверьте поля и попробуйте еще раз.');
    } finally {
        setFormPending(form, false);
    }
}
