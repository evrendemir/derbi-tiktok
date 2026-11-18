// Açılış (ısınma), yayın başlangıcı sıfırlama, canlı sayılar ve kupa töreni testleri. derbi_v2.html?sim=1&fast=1
(async () => {
  const D = window.derbi, S = D.S, h = D.handle;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const U = n => ({ id: 'a_' + n, name: n, avatar: null });
  const out = [], check = (ad, ok, detay = '') => out.push({ ad, ok: !!ok, detay });

  // 1) yayın başlayınca her şey sıfırlanır, eski/deneme isimleri gider
  h({ type: 'join', user: U('EskiBot') }); h({ type: 'comment', user: U('EskiBot'), text: 'GS' }); S.goals = { gs: 3, fb: 2 };
  h({ type: 'live_start' });
  check('Yayın başlayınca izleyiciler silinir', Object.keys(S.users).length === 0, Object.keys(S.users).join(','));
  check('Yayın başlayınca skor 0-0', S.goals.gs === 0 && S.goals.fb === 0);
  check('Sahnede eski izleyici figürü kalmaz', ![...D.actors.values()].some(a => a.u.id === 'a_EskiBot'));

  // 2) ısınma: maç saati durur, tahmin ekranı açık, tahmin alınır
  await wait(1100);
  check('Isınma sırasında maç başlamamış', D.isWarm(), `${S.start - Date.now()} ms`);
  check('Isınma ekranı görünür', document.querySelector('#pre').classList.contains('show') && /MAÇ BAŞLIYOR/.test(document.querySelector('#pre').textContent));
  h({ type: 'comment', user: U('Tahminci'), text: '1-0' }); await wait(1100);
  check('Isınmada tahmin alınır ve ekranda görünür', /Tahminci 1-0/.test(document.querySelector('#pre').textContent), document.querySelector('#pre').textContent);
  await wait(1500);
  check('Isınma bitince maç başlar', !D.isWarm() && S.kicked && !document.querySelector('#pre').classList.contains('show'));

  // 3) canlı sayılar
  h({ type: 'viewers', count: 37 }); await wait(50);
  check('Yayındaki izleyici sayısı tabelada', /37/.test(document.querySelector('#viewers').textContent), document.querySelector('#viewers').textContent);
  h({ type: 'join', user: U('Aktif') }); h({ type: 'comment', user: U('Aktif'), text: 'FB' });
  h({ type: 'join', user: U('Pasif') }); h({ type: 'comment', user: U('Pasif'), text: 'FB' }); S.users['a_Pasif'].seen = Date.now() - 6 * 60000;
  await wait(1100);
  const exp = Object.values(S.users).filter(u => u.team === 'fb' && Date.now() - (u.seen || 0) < 5 * 60000).length;
  check('Taraftar sayısı sadece aktifleri sayar', document.querySelector('#cntF').textContent === String(exp) && exp < Object.values(S.users).filter(u => u.team === 'fb').length, document.querySelector('#cntF').textContent + ' / ' + exp);

  // 4) maç sonu: kazanan kupayı kaldırır, doğru tahmin edenler gösterilir
  h({ type: 'gift', user: U('Aktif'), coins: 100, unit: 100, gift: 'El Kalp' }); await D.idle();
  S.goals = { gs: 1, fb: 0 }; S.start = Date.now() - 10 * 60 * 1000 - 500;
  await wait(5000);
  const tr = D.trophyState();
  check('Kazanan takım kupa töreni yapar', tr && tr.cap && tr.cap.u.team === 'gs', tr && tr.cap && tr.cap.u.name);
  check('Kupa kaptanın elinde', tr && tr.cup && tr.cup.parent === tr.cap.fig);
  check('Tören sırasında doğru tahmin edenler yazar', /DOĞRU TAHMİN/.test(document.querySelector('#cineLbl').textContent) && /Tahminci/.test(document.querySelector('#cineSub').textContent), document.querySelector('#cineSub').textContent);
  await wait(10500);
  check('Tören biter, yeni maç ısınmayla başlar', !D.trophyState() && D.isWarm() && document.querySelector('#pre').classList.contains('show'));
  check('Taraftarlar yeni maçta takımında kalır', S.users['a_Aktif'] && S.users['a_Aktif'].team === 'fb');
  return out;
})();
