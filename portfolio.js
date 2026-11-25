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
  state = { step: 0, master: 0, reschedule: false, service: 0, day: 'Завтра', time: '11:00', cart: [0, 0, 0],
    filter: 'Все', query: '', product: 0, owner: '', delivery: 'Самовывоз', view: 'catalog', answers: [] };
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
const masters = ['Анна', 'Мария'];
const days = ['Завтра', 'Послезавтра'];
const slots = [['11:00', '13:30', '16:00'], ['10:00', '14:00', '18:30']];
function availableSlots() {
  const times = slots[days.indexOf(state.day)];
  return state.master === 0 ? times : [times[0], times[2]];
}
function salon() {
  const [name, price] = services[state.service];
  const headings = ['Какой уход выберете?', 'Когда вас ждать?', 'Визит подтверждён'];
  const stages = ['Услуга', 'Время', 'Запись'];
  let panel;
  if (state.step === 0) {
    panel = '<div class="service-list">' + services.map(([label, cost], i) =>
      button('service', '<span>' + label + '</span><b>$' + cost + '</b>', i, '', i === state.service)).join('') +
      '</div>' + button('next', 'Выбрать время', '', 'solid');
  } else if (state.step === 1) {
    panel = '<div class="artist"><img src="assets/artist.jpg" alt="Мастер за работой"><span>Ваш мастер<strong>' + masters[state.master] + '</strong></span></div><h4>Мастер</h4>' + choices('master', masters, masters[state.master]) + '<h4>День визита</h4>' +
      choices('day', days, state.day) + '<h4>Свободное время</h4>' + choices('time', availableSlots(), state.time) +
      '<div class="buttons">' + button('back', 'Назад') + button('next', state.reschedule ? 'Подтвердить перенос' : 'Подтвердить запись', '', 'solid') + '</div>';
  } else {
    panel = '<div class="ticket-slot" aria-hidden="true"></div><div class="ticket"><small>Демо-талон</small><strong>' + state.time + '</strong><p>' + state.day + ' · ' + name + '</p><p>' + masters[state.master] + ' · $' + price + '</p></div><p class="fine">Это пример записи. Визит в салоне не бронируется.</p>' + '<div class="buttons">' + button('reschedule', 'Перенести запись') + button('reset', 'Начать заново') + '</div>';
  }
  return '<div class="salon inner"><div class="salon-spread"><div class="salon-cover"><img src="assets/salon.jpg" alt="Маникюр в мягких розовых тонах"><div><small>Студия красоты</small><strong>Лето</strong><p>Время для себя</p></div></div><section class="salon-page"><div class="progress">' +
    stages.map((x, i) => '<span class="' + (i <= state.step ? 'filled' : '') + '">' + x + '</span>').join('') + '</div><h3 tabindex="-1">' + headings[state.step] + '</h3>' + panel + '</section></div></div>';
}
function visibleProducts() {
  return products.map((product, index) => ({product, index})).filter(({product}) =>
    (state.filter === 'Все' || product.type === state.filter) &&
    (product.name + ' ' + product.type).toLowerCase().includes(state.query.toLowerCase().trim()));
}
function shop() {
  const count = state.cart.reduce((a,b) => a+b,0);
  const total = products.reduce((sum,p,i) => sum + p.price * state.cart[i],0);
  let content;
  if (state.view === 'catalog') {
    content = '<div class="store-intro"><small>Коллекция для дома</small><h3 tabindex="-1">Тихие вещи<br><em>на каждый день</em></h3><p>Керамика, свет и натуральный текстиль.</p></div>' +
      choices('filter', ['Все', ...products.map(p => p.type)], state.filter) + '<label class="search">Поиск по каталогу<input type="search" id="query" placeholder="Например, свеча"></label><div class="goods">' + (visibleProducts().length ? visibleProducts().map(({product:p,index:i}) =>
      '<article><img src="assets/' + p.image + '.jpg" alt="' + p.name + '"><small>' + p.type + '</small><div class="product-title"><h4>' + p.name + '</h4><b>$' + p.price + '</b></div><p>' + p.detail + '</p>' + button('product', 'О товаре', i) + button('add', state.cart[i] ? 'В корзине · ' + state.cart[i] : 'В корзину', i, state.cart[i] ? 'added' : '') + '</article>').join('') : '<p>По этому запросу товаров нет.</p>') + '</div>';
  } else if (state.view === 'product') {
    const p = products[state.product];
    content = '<article class="product-detail"><img src="assets/' + p.image + '.jpg" alt="' + p.name + '"><div><small>' + p.type + '</small><h3 tabindex="-1">' + p.name + '</h3><p>' + p.detail + '</p><strong>$' + p.price + '</strong>' + button('add', state.cart[state.product] ? 'В корзине · ' + state.cart[state.product] : 'В корзину', state.product, 'solid') + button('catalog', 'К каталогу') + '</div></article>';
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
const goals = [
  ['Показать услуги','Принимать записи','Собирать запросы'],
  ['Отвечать на вопросы','Собирать заказы','Напоминать о визитах'],
  ['Запись через сайт','Заказы через каталог','Единые заявки']
];
function currentOptions(index) {
  return index === 2 ? goals[questions[0][1].indexOf(state.answers[0])] : questions[index][1];
}
function bot() {
  const answers = state.answers;
  const done = answers.length === questions.length;
  let chat = '';
  questions.slice(0, answers.length + 1).forEach(([q],i) => {
    chat += '<div class="bubble">' + q + '</div>';
    if (answers[i]) chat += '<div class="bubble mine">' + answers[i] + '</div>';
  });
  const receipt = '<div class="brief' + (done ? ' ready' : ' pending-brief') + '"><div class="brief-cover"><img src="assets/' + (answers[1] === 'Магазин' ? 'vase' : answers[1] === 'Услуги' ? 'workshop' : 'salon') + '.jpg" alt=""><small>Карточка владельца</small></div><div class="brief-text"><small>' + (done ? (state.owner || 'Заявка получена · демо') : 'Предпросмотр заявки') + '</small><h4>' + (answers[0] || 'Новая заявка') + '</h4><dl><dt>Сфера</dt><dd>' + (answers[1] || 'Ожидаем ответ') + '</dd><dt>Задача</dt><dd>' + (answers[2] || 'Ожидаем ответ') + '</dd></dl><div class="network-trace"></div>' + (done ? '<div class="buttons owner-actions">' + button('owner', 'В работу', 'В работе') + button('owner', 'Закрыть заявку', 'Закрыта') + '</div>' : '') + '</div></div>';
  return '<div class="bot inner"><div class="desk"><section class="chat"><div class="chat-head"><i>V</i><div><h3>VicDev · Бриф</h3><small>Симуляция Telegram-бота</small></div></div><div class="messages" role="log" aria-label="История диалога">' + chat + (done ? '<div class="bubble">Готово! Вот как выглядит заявка для владельца.</div>' : '') + '</div><div class="keyboard">' + (done ? button('reset','Заполнить ещё раз') : currentOptions(answers.length).map((x,i)=>button('answer',x,i)).join('')) + (answers.length ? button('edit', 'Изменить последний ответ') : '') + '</div></section><aside><small>Со стороны бизнеса</small><h3>Входящие заявки</h3><p>Ответы клиента собираются в одну карточку.</p>' + receipt + '</aside></div></div>';
}
function render(action, value) {
  const oldScroll = stage.scrollTop;
  stage.innerHTML = current === 'salon' ? salon() : current === 'shop' ? shop() : bot();
  const query = stage.querySelector('#query');
  if (query) query.value = state.query;
  if (action) {
    const equivalent = [...stage.querySelectorAll('[data-action]')].find(b => b.dataset.action === action && b.dataset.value === value);
    const target = equivalent || stage.querySelector('h3[tabindex], .keyboard button, button');
    target?.focus({preventScroll:true});
    stage.scrollTop = equivalent ? oldScroll : 0;
    if (current === 'bot') {
      const log = stage.querySelector('.messages');
      log.scrollTop = log.scrollHeight;
      if (action === 'answer' && state.answers.length === questions.length) stage.querySelector('.brief').scrollIntoView({block:'nearest', behavior:'instant'});
    }
  } else stage.scrollTop = 0;
}
function animateDelivery(origin, destination, image) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !destination.animate) return;
  const target = destination.getBoundingClientRect();
  const ghost = document.createElement(image ? 'img' : 'span');
  ghost.className = image ? 'motion-ghost' : 'motion-ghost signal';
  ghost.setAttribute('aria-hidden', 'true');
  if (image) ghost.src = image;
  else ghost.textContent = '✓';
  const size = image ? 46 : 32;
  const startX = origin.left + origin.width / 2 - size / 2;
  const startY = Math.min(innerHeight - size, Math.max(72, origin.top + origin.height / 2 - size / 2));
  const dx = target.left + target.width / 2 - size / 2 - startX;
  const dy = Math.min(innerHeight - size, Math.max(76, target.top + 16)) - startY;
  Object.assign(ghost.style, { left: startX + 'px', top: startY + 'px', width: size + 'px', height: size + 'px' });
  dialog.append(ghost);
  const flight = ghost.animate([
    { transform: 'scale(.8)' },
    { transform: 'translate(' + dx * .58 + 'px,' + (dy * .42 - 38) + 'px) rotate(-16deg) scale(1.15)', offset: .52 },
    { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.2)', opacity: .3 }
  ], { duration: 510, easing: 'cubic-bezier(.25,.66,.33,1)' });
  flight.finished.then(() => {
    ghost.remove();
    if (destination.isConnected) destination.animate([
      { boxShadow: '0 0 0 2px #e9d3ff', scale: '1.02' },
      { boxShadow: '0 0 0 12px transparent', scale: '1' }
    ], {duration: 340});
  }, () => ghost.remove());
}
stage.addEventListener('click', event => {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;
  const { action, value } = btn.dataset;
  const i = Number(value);
  const productImage = action === 'add' && state.view !== 'cart' ? btn.closest('article')?.querySelector('img') : null;
  const outgoing = action === 'answer' && state.answers.length === questions.length - 1;
  const source = productImage || (outgoing ? btn : null);
  const origin = source?.getBoundingClientRect();
  switch (action) {
    case 'service': state.service = i; break;
    case 'next': state.step++; break;
    case 'back': state.step--; break;
    case 'reschedule': state.step = 1; state.reschedule = true; break;
    case 'master': state.master = i; state.time = availableSlots()[0]; break;
    case 'day': state.day = days[i]; state.time = availableSlots()[0]; break;
    case 'time': state.time = availableSlots()[i]; break;
    case 'filter': state.filter = ['Все', ...products.map(p=>p.type)][i]; break;
    case 'product': state.product = i; state.view = 'product'; break;
    case 'add': state.cart[i]++; break;
    case 'minus': state.cart[i] = Math.max(0,state.cart[i]-1); break;
    case 'delivery': state.delivery = ['Самовывоз','Доставка'][i]; break;
    case 'cart': case 'catalog': state.view = action; break;
    case 'order': state.view = 'done'; break;
    case 'answer': state.answers.push(currentOptions(state.answers.length)[i]); break;
    case 'edit': state.answers.pop(); state.owner = ''; break;
    case 'owner': state.owner = value; break;
    case 'reset': reset(); break;
  }
  render(action, value);
  const destination = productImage ? stage.querySelector('.store-head button') : outgoing && stage.querySelector('.brief');
  if (destination && origin) animateDelivery(origin, destination, productImage?.src);
});
stage.addEventListener('input', event => {
  if (event.target.id !== 'query') return;
  state.query = event.target.value;
  const catalog = document.createElement('template');
  catalog.innerHTML = shop();
  stage.querySelector('.goods').replaceWith(catalog.content.querySelector('.goods'));
});
window.addEventListener('hashchange', syncUrl);
syncUrl();
