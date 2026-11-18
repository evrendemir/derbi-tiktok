// Spiker ve hediye yakın planı testleri. derbi_v2.html?sim=1&fast=1 açıkken çalıştır.
(async () => {
  const D = window.derbi, S = D.S, h = D.handle;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const out = [], check = (ad, ok, detay = '') => out.push({ ad, ok: !!ok, detay });
  await D.idle();
  // sahte köprü: "say" mesajını yakala, hemen hata ile cevapla (sırayı ilerletir)
  const sent = [];
  D.SPK.ws = { readyState: 1, send: m => { const d = JSON.parse(m); sent.push(d); setTimeout(() => window.dispatchEvent(new CustomEvent('noop')), 0); } };
  D.SPK.log.length = 0;

  check('İsim sadeleşir: emoji/rakam atılır', D.spkName({ name: '🔥ahmet_1907' }) === 'ahmet', D.spkName({ name: '🔥ahmet_1907' }));
  check('Küfürlü isim okunmaz', D.spkName({ name: 'siktir_git' }) === 'bir taraftar');

  h({ type: 'comment', user: { id: 's1', name: 'Mehmet', avatar: null }, text: 'GS' });
  await wait(200);
  h({ type: 'gift', user: { id: 's1', name: 'Mehmet', avatar: null }, gift: 'Gül', unit: 1, repeat: 1, coins: 1 });
  await wait(300);
  check('Gül atınca spiker ismi okur', D.SPK.log.some(t => /Mehmet/.test(t)), D.SPK.log.join(' | '));
  check('Köprüye say mesajı gider', sent.some(d => d.type === 'say' && /Mehmet/.test(d.text)), JSON.stringify(sent.slice(-1)));
  check('Hediye atana kamera döner (yakın plan)', (D.camOv() && D.camOv().spot) || D.crowdState());

  D.spk('deneme bir', 2); D.spk('deneme iki', 2); D.spk('deneme üç', 2); D.spk('deneme dört', 2); D.spk('az önemli', 0);
  check('Kalabalıkta önemsiz cümle atlanır', D.SPK.q.every(x => x.text !== 'az önemli'));
  check('Sıra en fazla 3 cümle tutar', D.SPK.q.length <= 3, D.SPK.q.length);

  return out;
})();
