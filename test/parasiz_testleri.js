// Parasız katılım ve tribün testleri. derbi_v2.html?sim=1&fast=1 açıkken çalıştır.
(async () => {
  const D = window.derbi, S = D.S, h = D.handle;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const U = n => ({ id: 'p_' + n, name: n, avatar: null });
  const out = [], check = (ad, ok, detay = '') => out.push({ ad, ok: !!ok, detay });
  const shouts = () => [...document.querySelectorAll('#shouts .shout')].map(x => x.textContent);
  const join = (n, t) => { h({ type: 'join', user: U(n) }); if (t) h({ type: 'comment', user: U(n), text: t }); };

  // 1) beğeni → taraftar gücü
  join('Beğenici', 'GS'); D.power.gs = 0;
  h({ type: 'like', user: U('Beğenici'), count: 50 });
  check('Beğeni GS gücünü artırır', D.power.gs === 50, D.power.gs);
  check('Güç çubuğu yüzdesi yazar', /%17/.test(document.querySelector('#pbGt').textContent), document.querySelector('#pbGt').textContent);
  join('Beğenici2', 'GS'); h({ type: 'like', user: U('Beğenici2'), count: 260 }); await wait(100);
  check('Güç dolunca sıfırlanır', D.power.gs < 300, D.power.gs);
  check('Güç dolunca tezahürat yazısı çıkar', document.querySelector('#chant').classList.contains('show') && /GÜCÜ DOLDU/.test(document.querySelector('#chant').textContent));
  check('En çok beğenen ekranda görünür', shouts().some(t => /Beğenici2.*260 beğeni/.test(t)), shouts().join(' | '));

  // 2) ŞUT
  join('Şutçu', 'FB'); h({ type: 'comment', user: U('Şutçu'), text: 'ŞUT' }); await wait(50);
  check('ŞUT yazınca adı çıkar', shouts().some(t => /Şutçu.*şut istedi/.test(t)));
  const n1 = shouts().filter(t => /Şutçu/.test(t)).length;
  h({ type: 'comment', user: U('Şutçu'), text: 'şut' }); await wait(50);
  check('ŞUT 30 sn içinde tekrar sayılmaz', shouts().filter(t => /Şutçu/.test(t)).length === n1);

  // 3) skor tahmini
  join('Tahminci', 'GS'); h({ type: 'comment', user: U('Tahminci'), text: '2-1' });
  check('Tahmin kaydedilir (GS-FB)', JSON.stringify((S.preds || {})['p_Tahminci']) === '[2,1]', JSON.stringify(S.preds));
  check('Tahmin ekranda görünür', shouts().some(t => /Tahminci.*GS 2 – 1 FB/.test(t)));

  // 5) paylaş / takip
  D.power.fb = 0; join('Paylaşan', 'FB'); h({ type: 'share', user: U('Paylaşan') });
  check('Paylaşım FB gücüne +50', D.power.fb === 50, D.power.fb);
  check('Paylaşan adı görünür', shouts().some(t => /Paylaşan.*paylaştı/.test(t)));
  h({ type: 'follow', user: U('Paylaşan') });
  check('Takip FB gücüne +30', D.power.fb === 80, D.power.fb);

  // 6) tribün çekimi: isimli taraftarlar, çakışmayan etiketler
  const cs = D.crowd('gs');
  check('Tribün çekimi açılır', cs && cs.figs.length === 8);
  const tags = cs.figs.filter(f => f.tag);
  check('İzleyici taraftarların isim etiketi var', tags.length === Math.min(8, cs.named) && tags.length > 0, tags.length);
  const xs = tags.map(f => f.tag.position.x).sort((a, b) => a - b);
  const minGap = Math.min(...xs.slice(1).map((x, i) => x - xs[i]));
  check('İsim etiketleri çakışmaz (aralık > etiket eni)', tags.length < 2 || minGap > tags[0].tag.scale.x, `aralık ${minGap.toFixed(2)} / en ${tags[0] && tags[0].tag.scale.x}`);
  check('Sahadaki oyuncu tribünde görünmez', !cs.figs.some(f => f.u && D.actors.get(f.u.id) && D.actors.get(f.u.id).zone === 'field'));
  const fb = D.crowd('fb'); check('FB tribününde atkı var', fb.figs.every(f => f.g.userData.scarf));
  await wait(7200); check('Tribün çekimi kendiliğinden biter', !D.crowdState());

  // 3+4) maç sonu: doğru tahmin ve maçın taraftarı
  S.goals = { gs: 2, fb: 1 }; S.start = Date.now() - 10 * 60 * 1000 - 500;
  await wait(1500); check('Maç sonu başlar', /MAÇ SONU/.test(document.querySelector('#goal h1').textContent));
  await wait(6000); check('Doğru tahmin kartı çıkar', /DOĞRU TAHMİN/.test(document.querySelector('#cineLbl').textContent) && /Tahminci/.test(document.querySelector('#cineSub').textContent), document.querySelector('#cineSub').textContent);
  await wait(4000); check('Maçın taraftarı kartı çıkar', /MAÇIN TARAFTARI/.test(document.querySelector('#cineLbl').textContent), document.querySelector('#cineName').textContent);
  await wait(5500); check('Yeni maçta tahminler ve güç sıfırlanır', Object.keys(S.preds || {}).length === 0 && D.power.gs === 0 && D.power.fb === 0);
  check('Yeni maçta sinema modu kapanır', !document.querySelector('#stage').classList.contains('cinema'));
  return out;
})();
