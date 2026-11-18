// Hediye sistemi testleri: gül şutu, maçın patronu, hediye savaşı. derbi_v2.html?sim=1&fast=1 açıkken çalıştır.
(async () => {
  const D = window.derbi, S = D.S, h = D.handle;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const U = n => ({ id: 'h_' + n, name: n, avatar: null });
  const out = [], check = (ad, ok, detay = '') => out.push({ ad, ok: !!ok, detay });
  const gift = (n, unit, g, repeat = 1) => h({ type: 'gift', user: U(n), coins: unit * repeat, unit, repeat, gift: g || '' });
  await D.idle(); S.start = Date.now() - 60000; S.kicked = true; await wait(300);
  h({ type: 'comment', user: U('Ayla'), text: 'GS' }); h({ type: 'comment', user: U('Fırat'), text: 'FB' });

  // 1) gül = kendi şutun
  await D.idle(); D.SPK.log.length = 0;
  gift('Ayla', 1, 'Gül'); await wait(150);
  check('Gül atınca şut anı başlar', D.busy() || D.SPK.log.some(t => /şut/i.test(t)), D.SPK.log.join(' | '));
  await D.idle();

  // 2) maçın patronu
  gift('Ayla', 1, 'Gül', 5); await wait(100);
  check('İlk hediye atan patron olur', D.bossId() === 'h_Ayla', D.bossId());
  check('Patron tabelada görünür', /PATRON/.test(document.querySelector('#boss').textContent) && /Ayla/.test(document.querySelector('#boss').textContent), document.querySelector('#boss').textContent);
  gift('Fırat', 30, 'Donut'); await wait(100);
  check('Daha çok atan tahtı kapar', D.bossId() === 'h_Fırat', D.bossId());
  await D.idle();

  // 3) hediye savaşı
  const g0 = S.goals.fb;
  D.startBattle();
  check('Hediye savaşı ekranda', document.querySelector('#battle').classList.contains('show'));
  gift('Ayla', 1, 'Gül', 3); gift('Fırat', 30, 'Donut');
  check('Savaşta jetonlar takıma yazılır', D.battle.c.gs === 3 && D.battle.c.fb === 30, JSON.stringify(D.battle.c));
  await wait(3000); await D.idle();
  check('Savaşı kazanan takım gol atar', S.goals.fb === g0 + 1, `${g0} → ${S.goals.fb}`);
  check('Savaş bitince bar kalkar', !document.querySelector('#battle').classList.contains('show'));
  return out;
})();
