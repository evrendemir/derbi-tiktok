// Penaltı düellosu testi. derbi_v2.html?sim=1&fast=1 açıkken çalıştır (yaklaşık 35 sn).
(async () => {
  const D = window.derbi, S = D.S, h = D.handle;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const U = n => ({ id: 'k_' + n, name: n, avatar: null });
  const out = [], check = (ad, ok, detay = '') => out.push({ ad, ok: !!ok, detay });
  for (const [n, t] of [['GSci1', 'GS'], ['GSci2', 'GS'], ['FBci1', 'FB'], ['FBci2', 'FB']]) { h({ type: 'join', user: U(n) }); h({ type: 'comment', user: U(n), text: t }); }
  await D.idle();
  S.goals = { gs: 1, fb: 1 }; S.start = Date.now() - 10 * 60 * 1000 - 500;
  await wait(1600);
  check('Berabere maçta penaltılar başlar', document.querySelector('#pen').classList.contains('show') && D.pen.on, document.querySelector('#pen').textContent.slice(0, 60));
  // ilk atış GS: GS'liler "sol", FB'liler "sağ" der → farklı yön = gol
  h({ type: 'comment', user: U('GSci1'), text: 'sol' }); h({ type: 'comment', user: U('GSci2'), text: 'sol' }); h({ type: 'comment', user: U('FBci1'), text: 'sağ' });
  h({ type: 'comment', user: U('GSci1'), text: 'sağ' }); // ikinci oy sayılmaz
  check('Oylar doğru tarafa sayılır', D.pen.votes.kick.sol === 2 && D.pen.votes.keep['sağ'] === 1 && D.pen.votes.kick['sağ'] === 0, JSON.stringify(D.pen.votes));
  await wait(2500);
  check('Farklı yön seçilince gol olur', /GS 1 – 0 FB|✅/.test(document.querySelector('#pen').textContent), document.querySelector('#pen').textContent.slice(0, 80));
  // düello bitene ve yeni maç başlayana kadar bekle
  let t0 = Date.now(); while (document.querySelector('#pen').classList.contains('show') && Date.now() - t0 < 40000) await wait(300);
  check('Penaltılar biter', !document.querySelector('#pen').classList.contains('show'));
  await wait(400);
  check('Kazanan penaltılarla ilan edilir', /penaltılarla kazandı/.test(document.querySelector('#gText').textContent), document.querySelector('#gText').textContent);
  return out;
})();
