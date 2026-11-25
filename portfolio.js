'use strict';

const dialog = document.querySelector('#demo');
const stage = document.querySelector('#stage');
const title = document.querySelector('#demo-title');
const names = { salon: 'Студия «Лето»', shop: 'Магазин «Тихий дом»', bot: 'Бот для заявок' };
const services = [['Маникюр с покрытием', 15], ['Коррекция бровей', 7], ['Уход за волосами', 15]];
const products = [
  { name: 'Ваза «Дюна»', type: 'Керамика', price: 48, image: 'vase', detail: 'Скульптурная форма и матовая поверхность.' },
  { name: 'Свеча «Кедр»', type: 'Свечи', price: 22, image: 'candle', detail: 'Тёплый свет в стеклянном подсвечнике.' },
  { name: 'Плед «Лён»', type: 'Текстиль', price: 95, image: 'textile', detail: 'Фактурный текстиль естественного оттенка.' }
];
let state, current, trigger, previousHash = '';

function reset() {
  state = { step: 0, service: 0, day: 'Завтра', time: '11:00', cart: [0, 0, 0],
    filter: 'Все', delivery: 'Самовывоз', view: 'catalog', answers: [] };
}
function openDemo(key, fromLink) {
  if (!Object.hasOwn(names, key)) return;
  if (!dialog.open) {
    trigger = document.activeElement;
    if (!fromLink) previousHash = location.hash;
    dialog.showModal();
  }
  current = key;
  title.textContent = names[key];
  reset();
  if (!fromLink) history.pushState(null, '', '#demo-' + key);
  render();
  dialog.querySelector('.close').focus();
}
function closeDemo() {
  if (!dialog.open) return;
  dialog.close();
  stage.replaceChildren();
  current = null;
  trigger?.focus({ preventScroll: true });
}
document.querySelectorAll('[data-demo]').forEach(button => {
  button.addEventListener('click', () => openDemo(button.dataset.demo, false));
});
function dismiss() {
  history.replaceState(null, '', location.pathname + location.search + previousHash);
  closeDemo();
}
dialog.querySelector('.close').onclick = dismiss;
dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
function syncUrl() {
  const key = location.hash.replace(/^#demo-/, '');
  if (Object.hasOwn(names, key)) { if (key !== current) openDemo(key, true); }
  else closeDemo();
}
function button(action, label, value = '', style = '', selected) {
  const pressed = selected === undefined ? '' : ' aria-pressed="' + selected + '"';
  return '<button type="button" data-action="' + action + '" data-value="' + value + '" class="' + style + '"' + pressed + '>' + label + '</button>';
}
function choices(action, options, active) {
  return '<div class="choices">' + options.map((option, index) => button(action, option, index, '', option === active)).join('') + '</div>';
}
const days = ['Завтра', 'Послезавтра'];
const slots = [['11:00', '13:30', '16:00'], ['10:00', '14:00', '18:30']];
function salon() {
  const [name, price] = services[state.service];
  const headings = ['Какой уход выберете?', 'Когда вас ждать?', 'Ваша запись готова'];
  const stages = ['Услуга', 'Время', 'Запись'];
  let panel;
  if (state.step === 0) {
    panel = '<div class="service-list">' + services.map(([label, cost], i) =>
      button('service', '<span>' + label + '</span><b>$' + cost + '</b>', i, '', i === state.service)).join('') +
      '</div>' + button('next', 'Выбрать время', '', 'solid');
  } else if (state.step === 1) {
    panel = '<div class="artist"><img src="assets/artist.jpg" alt="Мастер за работой"><span>Студия «Лето»<strong>' + name + ' · $' + price + '</strong></span></div><h4>День визита</h4>' +
      choices('day', days, state.day) + '<h4>Свободное время</h4>' + choices('time', slots[days.indexOf(state.day)], state.time) +
      '<div class="buttons">' + button('back', 'Назад') + button('next', 'Подтвердить запись', '', 'solid') + '</div>';
  } else {
    panel = '<div class="ticket"><small>Демо-талон</small><strong>' + state.time + '</strong><p>' + state.day + ' · ' + name + '</p><p>Студия «Лето» · $' + price + '</p></div><p class="fine">Это пример записи. Визит в салоне не бронируется.</p>' + button('reset', 'Начать заново');
  }
  return '<div class="salon inner"><div class="salon-spread"><div class="salon-cover"><img src="assets/salon.jpg" alt="Маникюр в мягких розовых тонах"><div><small>Студия красоты</small><strong>Лето</strong><p>Время для себя</p></div></div><section class="salon-page"><div class="progress">' +
    stages.map((x, i) => '<span class="' + (i <= state.step ? 'filled' : '') + '">' + x + '</span>').join('') + '</div><h3 tabindex="-1">' + headings[state.step] + '</h3>' + panel + '</section></div></div>';
}
function shop() {
  const count = state.cart.reduce((a,b) => a+b,0);
  const total = products.reduce((sum,p,i) => sum + p.price * state.cart[i],0);
  let content;
  if (state.view === 'catalog') {
    content = '<div class="store-intro"><small>Коллекция для дома</small><h3 tabindex="-1">Тихие вещи<br><em>на каждый день</em></h3><p>Керамика, свет и натуральный текстиль.</p></div>' +
      choices('filter', ['Все', ...products.map(p => p.type)], state.filter) + '<div class="goods">' + products.map((p,i) => state.filter !== 'Все' && p.type !== state.filter ? '' :
      '<article><img src="assets/' + p.image + '.jpg" alt="' + p.name + '"><small>' + p.type + '</small><div class="product-title"><h4>' + p.name + '</h4><b>$' + p.price + '</b></div><p>' + p.detail + '</p>' + button('add', state.cart[i] ? 'Добавить ещё · ' + state.cart[i] + ' в корзине' : 'В корзину', i) + '</article>').join('') + '</div>';
  } else if (state.view === 'cart') {
    content = '<div class="checkout"><small>Ваш заказ</small><h3 tabindex="-1">Корзина</h3>' + (count ? products.map((p,i) => !state.cart[i] ? '' :
      '<div class="line-item"><img src="assets/' + p.image + '.jpg" alt=""><div><h4>' + p.name + '</h4><span>$' + p.price + ' за штуку</span><div class="quantity">' + button('minus','−',i) + '<b>' + state.cart[i] + '</b>' + button('add','+',i) + '</div></div><b>$' + state.cart[i]*p.price + '</b></div>').join('') +
      '<h4>Способ получения</h4>' + choices('delivery', ['Самовывоз','Доставка'],state.delivery) + '<p class="total">Товары <strong>$' + total + '</strong></p>' + button('order','Оформить демозаказ','','solid') : '<p>В корзине пока пусто.</p>') + button('catalog','Вернуться к покупкам') + '</div>';
  } else {
    content = '<div class="checkout"><small>Демо-квитанция</small><h3 tabindex="-1">Заказ собран</h3>' + products.map((p,i) => state.cart[i] ? '<p class="receipt-row">' + p.name + ' × ' + state.cart[i] + '<b>$' + p.price*state.cart[i] + '</b></p>' : '').join('') + '<p class="total">' + state.delivery + '<strong>$' + total + '</strong></p><p class="fine">Покупка завершена в демо. Оплата и отправка товаров не производятся.</p>' + button('reset','Вернуться в магазин','','solid') + '</div>';
  }
  return '<div class="store inner"><div class="store-wrap"><div class="store-head"><b>Тихий дом</b>' + (state.view === 'done' ? '' : button('cart','Корзина · ' + count)) + '</div>' + content + '</div></div>';
}
const questions = [
  ['Что хотите сделать?', ['Сайт для бизнеса','Telegram-бот','Сайт и бот']],
  ['Для какой сферы?', ['Студия красоты','Магазин','Услуги']],
  ['Что должен уметь проект?', ['Принимать записи','Собирать заказы','Отвечать на вопросы']]
];
function bot() {
  const answers = state.answers;
  const done = answers.length === questions.length;
  let chat = '';
  questions.slice(0, answers.length + 1).forEach(([q],i) => {
    chat += '<div class="bubble">' + q + '</div>';
    if (answers[i]) chat += '<div class="bubble mine">' + answers[i] + '</div>';
  });
  const receipt = '<div class="brief' + (done ? ' ready' : '') + '"><div class="brief-cover"><img src="assets/' + (answers[1] === 'Магазин' ? 'vase' : answers[1] === 'Услуги' ? 'workshop' : 'salon') + '.jpg" alt=""><small>Карточка владельца</small></div><div class="brief-text"><small>' + (done ? 'Заявка получена · демо' : 'Предпросмотр заявки') + '</small><h4>' + (answers[0] || 'Новая заявка') + '</h4><dl><dt>Сфера</dt><dd>' + (answers[1] || 'Ожидаем ответ') + '</dd><dt>Задача</dt><dd>' + (answers[2] || 'Ожидаем ответ') + '</dd></dl></div></div>';
  return '<div class="bot inner"><div class="desk"><section class="chat"><div class="chat-head"><i>V</i><div><h3>VicDev · Бриф</h3><small>Симуляция Telegram-бота</small></div></div><div class="messages" role="log" aria-label="История диалога">' + chat + (done ? '<div class="bubble">Готово! Вот как выглядит заявка для владельца.</div>' : '') + '</div><div class="keyboard">' + (done ? button('reset','Заполнить ещё раз') : questions[answers.length][1].map((x,i)=>button('answer',x,i)).join('')) + '</div></section><aside><small>Со стороны бизнеса</small><h3>Входящие заявки</h3><p>Ответы клиента собираются в одну карточку.</p>' + receipt + '</aside></div></div>';
}
function render(action, value) {
  const oldScroll = stage.scrollTop;
  stage.innerHTML = current === 'salon' ? salon() : current === 'shop' ? shop() : bot();
  if (action) {
    const equivalent = [...stage.querySelectorAll('[data-action]')].find(b => b.dataset.action === action && b.dataset.value === value);
    const target = equivalent || stage.querySelector('h3[tabindex], .keyboard button, button');
    target?.focus({preventScroll:true});
    stage.scrollTop = equivalent ? oldScroll : 0;
    if (current === 'bot') {
      const log = stage.querySelector('.messages');
      log.scrollTop = log.scrollHeight;
      if (state.answers.length === questions.length) stage.querySelector('.brief').scrollIntoView({block:'nearest'});
    }
  } else stage.scrollTop = 0;
}
stage.addEventListener('click', event => {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;
  const { action, value } = btn.dataset;
  const i = Number(value);
  switch (action) {
    case 'service': state.service = i; break;
    case 'next': state.step++; break;
    case 'back': state.step--; break;
    case 'day': state.day = days[i]; state.time = slots[i][0]; break;
    case 'time': state.time = slots[days.indexOf(state.day)][i]; break;
    case 'filter': state.filter = ['Все', ...products.map(p=>p.type)][i]; break;
    case 'add': state.cart[i]++; break;
    case 'minus': state.cart[i] = Math.max(0,state.cart[i]-1); break;
    case 'delivery': state.delivery = ['Самовывоз','Доставка'][i]; break;
    case 'cart': case 'catalog': state.view = action; break;
    case 'order': state.view = 'done'; break;
    case 'answer': state.answers.push(questions[state.answers.length][1][i]); break;
    case 'reset': reset(); break;
  }
  render(action,value);
});
window.addEventListener('hashchange', syncUrl);
syncUrl();
