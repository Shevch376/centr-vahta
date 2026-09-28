lucide.createIcons();

function validateCaptcha(form) {
    if (!window.grecaptcha) {
        return true;
    }

    const captcha = form.querySelector('.g-recaptcha');
    if (!captcha) {
        return true;
    }

    const widgets = Array.from(document.querySelectorAll('.g-recaptcha'));
    const widgetIndex = widgets.indexOf(captcha);
    const token = window.grecaptcha.getResponse(widgetIndex);
    if (token) {
        return true;
    }

    alert('Подтвердите, что вы не робот.');
    return false;
}

function resetCaptcha(form) {
    if (!window.grecaptcha) return;

    const captcha = form.querySelector('.g-recaptcha');
    if (!captcha) return;

    const widgets = Array.from(document.querySelectorAll('.g-recaptcha'));
    const widgetIndex = widgets.indexOf(captcha);
    window.grecaptcha.reset(widgetIndex);
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function openModal(title = 'Заказать звонок') {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-job-input').value = 'Индивидуальный подбор';
    document.getElementById('modal-calc-data').value = '';
}

function openModalWithPrefill(jobTitle, salary) {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'Отклик: ' + jobTitle;
    document.getElementById('modal-subtitle').textContent = 'Ставка: ' + salary + '. Координатор свяжется для согласования билетов.';
    document.getElementById('modal-job-input').value = jobTitle;
    document.getElementById('modal-calc-data').value = salary;
}

function closeModal() {
    document.getElementById('modal-backdrop').classList.add('hidden');
}

function filterVacancies(category) {
    const cards = document.querySelectorAll('.vacancy-card');
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach((btn) => {
        btn.classList.remove('active');
    });

    event.currentTarget.classList.add('active');

    cards.forEach((card) => {
        if (category === 'all' || card.classList.contains(category)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
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
}

function handleFormSubmit(e, source) {
    e.preventDefault();
    if (!validateCaptcha(e.target)) return;
    alert('Заявка принята! Данные переданы координатору.');
    e.target.reset();
    resetCaptcha(e.target);
}

function handleBottomFormSubmit(e) {
    e.preventDefault();
    if (!validateCaptcha(e.target)) return;
    alert('Анкета успешно зарегистрирована! Координатор свяжется с вами в ближайшее время.');
    e.target.reset();
    resetCaptcha(e.target);
}

function handleModalSubmit(e) {
    e.preventDefault();
    if (!validateCaptcha(e.target)) return;
    alert('Анкета успешно отправлена! Мы свяжемся с вами в течение рабочего дня.');
    closeModal();
    e.target.reset();
    resetCaptcha(e.target);
}
