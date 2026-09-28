lucide.createIcons();

const RECAPTCHA_SITE_KEY = '6LeaN9QtAAAAAK9JhDr5-mPwB26VghVpk-wmYrq0';

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
        alert('Капча еще загружается. Подождите пару секунд и попробуйте снова.');
        return false;
    }

    if (!captcha.dataset.widgetId) {
        window.renderRecaptchas();
    }

    const widgetId = Number(captcha.dataset.widgetId);
    const token = window.grecaptcha.getResponse(widgetId);
    if (token) return true;

    alert('Подтвердите, что вы не робот.');
    return false;
}

function resetCaptcha(form) {
    const captcha = form.querySelector('.g-recaptcha');
    if (!captcha || !window.grecaptcha || !captcha.dataset.widgetId) return;
    window.grecaptcha.reset(Number(captcha.dataset.widgetId));
}

function setupPhoneInputs() {
    document.querySelectorAll('.phone-input').forEach((input) => {
        if (!input.value.trim()) input.value = '+7 ';

        input.addEventListener('focus', () => {
            if (!input.value.trim()) input.value = '+7 ';
        });

        input.addEventListener('input', () => {
            if (input.value === '' || input.value === '+') {
                input.value = '+7 ';
            }
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

function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateCaptcha(e.target)) return;
    alert('Заявка принята! Данные переданы координатору.');
    e.target.reset();
    resetCaptcha(e.target);
    setupPhoneInputs();
}

function handleBottomFormSubmit(e) {
    e.preventDefault();
    if (!validateCaptcha(e.target)) return;
    alert('Анкета успешно зарегистрирована! Координатор свяжется с вами в ближайшее время.');
    e.target.reset();
    resetCaptcha(e.target);
    setupPhoneInputs();
}

function handleModalSubmit(e) {
    e.preventDefault();
    if (!validateCaptcha(e.target)) return;
    alert('Анкета успешно отправлена! Мы свяжемся с вами в течение рабочего дня.');
    closeModal();
    e.target.reset();
    resetCaptcha(e.target);
    setupPhoneInputs();
}
