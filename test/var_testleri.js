// VAR ve yarış testleri. derbi_v2.html?sim=1&fast=1 açıkken çalıştır.
(async () => {
  const D = window.derbi, S = D.S, h = D.handle;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const U = n => ({ id: 'v_' + n, name: n, avatar: null });
  const out = [], check = (ad, ok, detay = '') => out.push({ ad, ok: !!ok, detay });
  const vote = (n, t) => h({ type: 'comment', user: U(n), text: t });
  await D.idle();
  S.plan = { kind: 'draw', target: [9, 9], goals: [], varUsed: 0 }; S.userGoal = true; // otomatik goller araya girmesin

  // 1) yarış: sadece GS/FB yazıları sayılır, talimat net
  D.startRace(); vote('Y1', 'GS'); vote('Y2', 'merhaba'); vote('Y3', 'Fener'); vote('Y4', 'fb');
  check('Yarışta sadece GS/FB yazıları sayılır', D.race.cnt.gs === 1 && D.race.cnt.fb === 2, JSON.stringify(D.race.cnt));
  check('Yarış talimatı net: GS ya da FB yaz', /ASLAN ya da KANARYA yaz/.test(document.querySelector('#raceT').textContent), document.querySelector('#raceT').textContent);
  await wait(2500);

  // 2) ofsayt: EVET çoğunluk → gol iptal, planlanan gol ileri kayar
  let g0 = S.goals.gs; D.varRun('gs', 'offside');
  await wait(300); check('VAR başlar (ofsayt)', D.busy());
  let t0 = Date.now(); while (!D.VARV.on && Date.now() - t0 < 8000) await wait(50);
  check('Ofsayt oylaması açılır', D.VARV.on && /OFSAYT MI\?/.test(document.querySelector('#var').textContent));
  vote('A', 'evet'); vote('B', 'ofsayt'); vote('C', 'hayır'); vote('A', 'hayır'); // A'nın ikinci oyu sayılmaz
  check('Oylar sayılır, tekrar oy sayılmaz', D.VARV.y === 2 && D.VARV.n === 1, `${D.VARV.y}/${D.VARV.n}`);
  check('Ofsayt çizgileri ve tekrar ekranı', document.querySelector('#tvfx').classList.contains('show'));
  await D.idle();
  check('EVET → gol iptal', S.goals.gs === g0, `${g0} → ${S.goals.gs}`);
  check('İptal edilen gol plana geri eklenir', S.plan.goals.some(x => x[1] === 'gs'), JSON.stringify(S.plan.goals));

  // 3) ofsayt: HAYIR çoğunluk → gol geçerli
  S.plan.goals = []; g0 = S.goals.fb; D.varRun('fb', 'offside');
  t0 = Date.now(); while (!D.VARV.on && Date.now() - t0 < 8000) await wait(50);
  vote('D', 'hayır'); vote('E', 'gol');
  await D.idle(); check('HAYIR → gol geçerli', S.goals.fb === g0 + 1, `${g0} → ${S.goals.fb}`);

  // 4) penaltı: EVET → penaltıdan gol
  g0 = S.goals.gs; D.varRun('gs', 'penalty');
  t0 = Date.now(); while (!D.VARV.on && Date.now() - t0 < 8000) await wait(50);
  check('Penaltı oylaması açılır', /PENALTI MI\?/.test(document.querySelector('#var').textContent));
  vote('F', 'evet'); await D.idle();
  check('EVET → penaltı golü', S.goals.gs === g0 + 1, `${g0} → ${S.goals.gs}`);

  // 5) el: HAYIR → devam, gol yok
  g0 = S.goals.fb; S.plan.goals = []; D.varRun('fb', 'hand');
  t0 = Date.now(); while (!D.VARV.on && Date.now() - t0 < 8000) await wait(50);
  check('El oylaması açılır', /EL VAR MI/.test(document.querySelector('#var').textContent));
  vote('G', 'hayır'); vote('H', 'devam'); await D.idle();
  check('HAYIR → gol yok, oyun devam', S.goals.fb === g0 && S.plan.goals.some(x => x[1] === 'fb'));
  check('VAR bitince ekran temizlenir', !document.querySelector('#var').classList.contains('show') && !document.querySelector('#tvfx').classList.contains('show') && !document.querySelector('#stage').classList.contains('cinema'));
  return out;
})();
