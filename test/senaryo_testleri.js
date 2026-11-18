// Derbi CANLI v2 senaryo testleri.
// Kullanım: derbi_v2.html?sim=1 açıkken tarayıcı konsoluna yapıştır ya da otomasyonla çalıştır.
// Sonuç: [{ad, ok, detay}] listesi döner.
(async () => {
  const D = window.derbi, S = D.S, h = D.handle;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const U = n => ({ id: 't_' + n, name: n, avatar: null });
  const out = [];
  const check = (ad, ok, detay = '') => out.push({ ad, ok: !!ok, detay });
  const zone = n => { const a = D.actors.get('t_' + n); return a ? a.zone : null; };
  const join = (n, team) => { h({ type: 'join', user: U(n) }); if (team) h({ type: 'comment', user: U(n), text: team }); };
  const gift = (n, c, g) => h({ type: 'gift', user: U(n), coins: c, gift: g || '' });

  // 1) katılım: takım otomatik atanır, kart çıkmaz
  join('Ali');
  check('Katılan otomatik takıma oturur', ['gs', 'fb'].includes(S.users['t_Ali'].team));
  check('Bedava katılımda kart çıkmaz', !document.querySelector('#event').classList.contains('show'));

  // 2) takım değiştirme
  h({ type: 'comment', user: U('Ali'), text: 'fb' }); check('FB yazınca FB olur', S.users['t_Ali'].team === 'fb');
  h({ type: 'comment', user: U('Ali'), text: 'Cimbom' }); check('Cimbom yazınca GS olur', S.users['t_Ali'].team === 'gs');

  // 3) gül: parlayan kart
  gift('Ali', 1, 'Gül'); await wait(200);
  check('Gül: parlayan kart çıkar', document.querySelector('#event').classList.contains('glow') && /Gül/.test(document.querySelector('#evText').textContent), document.querySelector('#evText').textContent);

  // 4) hakem → hoca geçişi (hakemlik boşalmalı)
  join('Bora', 'GS'); gift('Bora', 199, 'Güneş Gözlüğü');
  check('Gözlük 199: hakem olur', S.refId === 't_Bora');
  await wait(150); check('Hakem sahada hakem olarak durur', zone('Bora') === 'ref', zone('Bora'));
  gift('Bora', 299, 'Corgi');
  check('Hakem Corgi atınca GS hocası olur', S.td.gs === 't_Bora');
  check('Hoca olunca hakemlik boşalır', S.refId === null, String(S.refId));
  await wait(150); check('Figür hoca olarak durur (hakem değil)', zone('Bora') === 'td', zone('Bora'));
  check('Hakem boşalınca sahada boş hakem figürü durur', D.actors.has('ref_empty') && D.actors.get('ref_empty').added);

  // 5) hoca → hakem geçişi (hocalık boşalmalı)
  gift('Bora', 199, 'Güneş Gözlüğü');
  check('Hoca gözlük atınca hakem olur', S.refId === 't_Bora');
  check('Hakem olunca hocalık boşalır', S.td.gs === null, String(S.td.gs));
  await wait(150); check('Boş GS hocası yer tutucusu görünür', D.actors.has('td_empty_gs'));

  // 6) son gönderen kazanır
  join('Cem', 'FB'); gift('Cem', 199, 'Güneş Gözlüğü');
  check('Başkası gözlük atınca hakemlik ona geçer', S.refId === 't_Cem');
  await wait(150); check('Eski hakem sahadan iner', zone('Bora') !== 'ref', zone('Bora'));
  join('Deniz', 'FB'); gift('Deniz', 299, 'Corgi'); join('Ece', 'FB'); gift('Ece', 299, 'Corgi');
  check('İkinci Corgi FB hocalığını alır', S.td.fb === 't_Ece');

  // 7) hoca takım değiştirirse eski koltuk boşalır
  h({ type: 'comment', user: U('Ece'), text: 'GS' });
  check('Takım değiştiren hocanın eski koltuğu boşalır', S.td.fb === null, String(S.td.fb));
  check('Yeni takımında otomatik hoca olmaz', S.td.gs !== 't_Ece');

  // 8) sahaya çıkma ve kadro sınırı
  for (let i = 1; i <= 6; i++) { join('Oy' + i, 'GS'); gift('Oy' + i, 100 + i, 'El Kalp'); }
  const sq = D.squad('gs').map(u => u.name);
  check('Kadroda en fazla 5 kişi', sq.length === 5, sq.join(','));
  check('En az jetonlu kadroya giremez', !sq.includes('Oy1'), sq.join(','));
  await wait(150); check('Kadrodakiler sahada', zone('Oy6') === 'field', zone('Oy6'));

  // 9) hakem El Kalp atarsa rolü bırakır ve oyuncu olur
  gift('Cem', 100, 'El Kalp');
  check('Hakem El Kalp atınca hakemlik boşalır', S.refId === null, String(S.refId));
  check('Hakem El Kalp atınca oyuncu kadrosuna girer', D.squad('fb').some(u => u.id === 't_Cem'));

  // 10) kaptan: en çok gönderen
  gift('Oy2', 400, 'Hediye'); await wait(150);
  const cap = [...D.actors.values()].find(a => a.zone === 'field' && a.u.team === 'gs' && a.opts.cap);
  const top = D.squad('gs')[0];
  check('En çok gönderen kaptan olur', cap && top && cap.u.id === top.id, `${cap && cap.u.name} / beklenen ${top && top.name}`);

  // 11) bir kişi aynı anda tek yerde
  const ids = [S.refId, S.td.gs, S.td.fb].filter(Boolean);
  check('Aynı kişi iki koltukta değil', new Set(ids).size === ids.length);
  const sqAll = [...D.squad('gs'), ...D.squad('fb')].map(u => u.id);
  check('Koltuktakiler kadroda değil', !ids.some(id => sqAll.includes(id)));
  const dup = {}; for (const a of D.actors.values()) if (a.added) dup[a.u.id] = (dup[a.u.id] || 0) + 1;
  check('Sahnede kopya figür yok', Object.values(dup).every(n => n === 1));

  // 12) tezahürat
  gift('Ali', 30, 'Donut'); await wait(200);
  check('Donut: tezahürat yazısı çıkar', document.querySelector('#chant').classList.contains('show'));

  // 13) gol
  const before = S.goals.gs; gift('Oy3', 500, 'Para Tabancası'); await wait(3500);
  check('Para Tabancası: GS golü sayılır', S.goals.gs === before + 1, `${before} → ${S.goals.gs}`);
  check('Gol ekranı açılır', document.querySelector('#goal').classList.contains('show'));
  return out;
})();
