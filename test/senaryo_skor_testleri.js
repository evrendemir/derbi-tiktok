// Senaryolu skor ve kamera testleri. derbi_v2.html?sim=1&fast=1 açıkken çalıştır.
(async () => {
  const D = window.derbi, S = D.S, h = D.handle;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const out = [], check = (ad, ok, detay = '') => out.push({ ad, ok: !!ok, detay });
  await D.idle();

  // 1) 5 maçlık döngü: 3 berabere, 1 GS, 1 FB
  try { localStorage.removeItem('derbi_cycle'); } catch (e) {}
  const kinds = []; for (let i = 0; i < 5; i++) kinds.push(D.planMatch().kind);
  const cnt = k => kinds.filter(x => x === k).length;
  check('5 maçta 3 beraberlik, 1 GS, 1 FB', cnt('draw') === 3 && cnt('gs') === 1 && cnt('fb') === 1, kinds.join(','));
  let okPlans = true, detail = '';
  for (let i = 0; i < 40; i++) { const p = D.planMatch(); const [g, f] = p.target; const gs = p.goals.filter(x => x[1] === 'gs').length, fb = p.goals.filter(x => x[1] === 'fb').length;
    const good = gs === g && fb === f && p.goals.every(x => x[0] >= 1 && x[0] <= 88) && (p.kind === 'draw' ? g === f && g >= 1 && g <= 4 : p.kind === 'gs' ? g > f : f > g);
    if (!good) { okPlans = false; detail = JSON.stringify(p); break; } }
  check('Plan hedef skorla ve dakikalarla tutarlı', okPlans, detail);

  // 2) plan dakikası gelince otomatik gol atılır
  D.newMatch(false); await wait(1700);
  S.plan = { kind: 'draw', target: [1, 1], goals: [[20, 'gs'], [60, 'fb']] }; S.userGoal = false; S.goals = { gs: 0, fb: 0 };
  S.start = Date.now() - 21 * 60 * 1000 * (10 / 90); await wait(1200);
  check('Plan dakikasında otomatik gol başlar', D.busy());
  await D.idle(); check('Otomatik gol planlanan takıma', S.goals.gs === 1 && S.goals.fb === 0, JSON.stringify(S.goals));
  S.start = Date.now() - 61 * 60 * 1000 * (10 / 90); await wait(1200); await D.idle();
  check('Plan beraberliğe ulaşır', S.goals.gs === 1 && S.goals.fb === 1, JSON.stringify(S.goals));

  // 3) kullanıcı hediyeyle gol atarsa senaryo durur
  S.plan = { kind: 'draw', target: [2, 2], goals: [[70, 'fb'], [75, 'gs']] };
  h({ type: 'comment', user: { id: 'sg_A', name: 'Atıcı' }, text: 'GS' }); h({ type: 'gift', user: { id: 'sg_A', name: 'Atıcı' }, coins: 500, unit: 500, gift: 'Para Tabancası' });
  await D.idle(); const after = S.goals.gs + S.goals.fb;
  S.start = Date.now() - 80 * 60 * 1000 * (10 / 90); await wait(1500);
  check('Kullanıcı golünden sonra senaryo golü gelmez', S.userGoal && !D.busy() && S.goals.gs + S.goals.fb === after, JSON.stringify(S.goals));

  // 4) gerçek taraftar yokken dekor kalabalık şovu, isimli bot yok
  D.newMatch(true); await wait(200); D.decorShow('gs'); await wait(300);
  check('Gerçek taraftar yokken kalabalık şovu açılır', /TRİBÜN|DALGA/.test(document.querySelector('#chant').textContent));
  check('Sahnede isimli izleyici figürü yok', ![...D.actors.values()].some(a => !a.u.isDefault && !a.u.placeholder));
  return out;
})();
