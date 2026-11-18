// Parasız katılım ve tribün testleri. derbi_v2.html?sim=1&fast=1 açıkken çalıştır.
(async () => {
  const D = window.derbi, S = D.S, h = D.handle;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const U = n => ({ id: 'p_' + n, name: n, avatar: null });
  const out = [], check = (ad, ok, detay = '') => out.push({ ad, ok: !!ok, detay });
  const shouts = () => [...document.querySelectorAll('#shouts .shout')].map(x => x.textContent);
  const join = (n, t) => { h({ type: 'join', user: U(n) }); if (t) h({ type: 'comment', user: U(n), text: t }); };

  // 1) beğeni ve yorum → taraftar gücü (eşik izleyici sayısına göre, en az 10)
  join('Beğenici', 'GS'); D.power.gs = 0;
  h({ type: 'like', user: U('Beğenici'), count: 4 });
  check('Beğeni GS gücünü artırır', D.power.gs === 4, D.power.gs);
  check('Güç çubuğu yüzdesi yazar', /%\d+/.test(document.querySelector('#pbGt').textContent), document.querySelector('#pbGt').textContent);
  h({ type: 'comment', user: U('Beğenici'), text: 'hadi cimbom' });
  check('Yorum da güç verir', D.power.gs === 5, D.power.gs);
  join('Beğenici2', 'GS'); D.power.gs = 0; h({ type: 'like', user: U('Beğenici2'), count: 15 }); await wait(100);
  check('Güç dolunca sıfırlanır', D.power.gs < 10, D.power.gs);
  check('Güç dolunca tezahürat yazısı çıkar', document.querySelector('#chant').classList.contains('show') && /GÜCÜ DOLDU/.test(document.querySelector('#chant').textContent));
  check('En çok beğenen ekranda görünür', shouts().some(t => /Beğenici2.*15 beğeni/.test(t)), shouts().join(' | '));

  // 2) ŞUT: 3 çağrıda şut, kaleci kurtarır, gol olmaz
  await D.idle();
  const g0 = S.goals.gs + S.goals.fb;
  join('Şutçu1', 'FB'); h({ type: 'comment', user: U('Şutçu1'), text: 'ŞUT' }); await wait(50);
  check('ŞUT yazınca adı ve kalan sayı çıkar', shouts().some(t => /Şutçu1.*2 şut daha/.test(t)), shouts().join(' | '));
  h({ type: 'comment', user: U('Şutçu1'), text: 'şut' });
  check('Aynı kişinin 5 sn içindeki tekrarı sayılmaz', D.shotCalls.fb.length === 1, D.shotCalls.fb.length);
  join('Şutçu2', 'FB'); h({ type: 'comment', user: U('Şutçu2'), text: 'şut' });
  join('Şutçu3', 'FB'); h({ type: 'comment', user: U('Şutçu3'), text: 'ŞUT!' }); await wait(30);
  check('3. şutta animasyon başlar', D.busy());
  check('Sayaç sıfırlanır', D.shotCalls.fb.length === 0);
  await D.idle();
  check('Kaleci kurtarır, gol olmaz', S.goals.gs + S.goals.fb === g0, `${g0} → ${S.goals.gs + S.goals.fb}`);

  // 3) skor tahmini
  join('Tahminci', 'GS'); h({ type: 'comment', user: U('Tahminci'), text: '2-1' });
  check('Tahmin kaydedilir (GS-FB)', JSON.stringify((S.preds || {})['p_Tahminci']) === '[2,1]', JSON.stringify(S.preds));
  check('Tahmin ekranda görünür', shouts().some(t => /Tahminci.*GS 2 – 1 FB/.test(t)));

  // 5) paylaş / takip
  D.power.fb = 0; join('Paylaşan', 'FB'); D.power.fb = 0; h({ type: 'share', user: U('Paylaşan') });
  check('Paylaşım FB gücüne +5', D.power.fb === 5, D.power.fb);
  check('Paylaşan adı görünür', shouts().some(t => /Paylaşan.*paylaştı/.test(t)));
  h({ type: 'follow', user: U('Paylaşan') });
  check('Takip FB gücüne +3', D.power.fb === 8, D.power.fb);

  // 6) tribün çekimi: isimli taraftarlar, çakışmayan etiketler
  const cs = D.crowd('gs');
  check('Tribün çekimi açılır (gerçek taraftar sayısı kadar, en çok 8)', cs && cs.figs.length > 0 && cs.figs.length <= 8 && cs.figs.length === cs.named, cs && cs.figs.length);
  const tags = cs.figs.filter(f => f.tag);
  check('İzleyici taraftarların isim etiketi var', tags.length === Math.min(8, cs.named) && tags.length > 0, tags.length);
  const xs = tags.map(f => f.tag.position.x).sort((a, b) => a - b);
  const minGap = Math.min(...xs.slice(1).map((x, i) => x - xs[i]));
  check('İsim etiketleri çakışmaz (aralık > etiket eni)', tags.length < 2 || minGap > tags[0].tag.scale.x, `aralık ${minGap.toFixed(2)} / en ${tags[0] && tags[0].tag.scale.x}`);
  check('Sahadaki oyuncu tribünde görünmez', !cs.figs.some(f => f.u && D.actors.get(f.u.id) && D.actors.get(f.u.id).zone === 'field'));
  const fb = D.crowd('fb'); check('FB tribününde atkı var', fb.figs.every(f => f.g.userData.scarf));
  await wait(5000); check('Tribün çekimi kısa sürer ve biter', !D.crowdState());

  // 7) tribün yalnızca gerçek taraftarları gösterir (bot yok)
  const real = D.crowd('gs'); check('Tribünde sadece gerçek taraftar var', real && real.figs.every(f => f.u && f.tag), real && real.figs.length);
  await wait(5000);

  // 8) ŞUT: önce bağıran taraftarlar konuşma balonuyla gösterilir
  await D.idle();
  for (const n of ['Bağıran1', 'Bağıran2', 'Bağıran3']) { join(n, 'GS'); }
  for (const n of ['Bağıran1', 'Bağıran2', 'Bağıran3']) h({ type: 'comment', user: U(n), text: 'şut' });
  await wait(60);
  const sc = D.crowdState();
  check('ŞUT anında önce bağıranlar tribünde görünür', sc && sc.shout && sc.figs.length === 3 && sc.figs.every(f => f.bub), sc && sc.figs.length);
  await D.idle();

  // 9) tezahürat yarışı
  D.startRace(); join('Yarışçı1', 'FB'); join('Yarışçı2', 'FB'); join('Yarışçı3', 'GS');
  for (let i = 0; i < 3; i++) { h({ type: 'comment', user: U('Yarışçı1'), text: 'fener' }); h({ type: 'comment', user: U('Yarışçı2'), text: 'hadi' }); }
  h({ type: 'comment', user: U('Yarışçı3'), text: 'cimbom' });
  check('Yarış sırasında yorumlar sayılır', D.race.cnt.fb >= 6 && D.race.cnt.gs >= 1, JSON.stringify(D.race.cnt));
  check('Yarış çubuğu görünür', document.querySelector('#race').classList.contains('show'));
  await wait(2600);
  check('Yarış biter, kazanan ilan edilir', !D.race.on && /FB KAZANDI/.test(document.querySelector('#chant').textContent), document.querySelector('#chant').textContent);
  check('Yarışın yıldızları ekranda', shouts().some(t => /Yarışçı(1|2).*yarışın yıldızı/.test(t)), shouts().join(' | '));

  // 3+4) maç sonu: doğru tahmin ve maçın taraftarı
  await D.idle();
  S.goals = { gs: 2, fb: 1 }; S.start = Date.now() - 10 * 60 * 1000 - 500;
  await wait(1500); check('Maç sonu başlar', /MAÇ SONU/.test(document.querySelector('#goal h1').textContent));
  await wait(6000); check('Doğru tahmin kartı çıkar', /DOĞRU TAHMİN/.test(document.querySelector('#cineLbl').textContent) && /Tahminci/.test(document.querySelector('#cineSub').textContent), document.querySelector('#cineSub').textContent);
  await wait(4000); check('Maçın taraftarı kartı çıkar', /MAÇIN TARAFTARI/.test(document.querySelector('#cineLbl').textContent), document.querySelector('#cineName').textContent);
  await wait(5500); check('Yeni maçta tahminler ve güç sıfırlanır', Object.keys(S.preds || {}).length === 0 && D.power.gs === 0 && D.power.fb === 0);
  check('Yeni maçta sinema modu kapanır', !document.querySelector('#stage').classList.contains('cinema'));
  return out;
})();
