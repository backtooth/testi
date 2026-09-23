# Linnan piiritys

Staattinen selainpeli GitHub Pagesissa: https://backtooth.github.io/testi/castle-siege/
Avaa paikallisesti `castle-siege/index.html`. Ei asennuksia tai palvelinta.

## Kierros

1. Hyökkääjä pelaa kaikki kolme käden korttia. Kullekin joukolle valitaan hyökkäyslinja.
2. Puolustaja valitsee torneille kohteet. Torni voi ampua enintään yhtä hyökkääjää kierroksessa.
3. Taistelu: tornien laukaukset, hengissä olevien joukkojen eteneminen linjan päähän ja muuri-iskut.
4. Puolustaja pelaa kaikki kolme käden korttia. Molemmat nostavat seuraavan kolmen kortin käden.

Molemmilla on 12 korttia, joten tavallisia korttikierroksia on neljä. Jos kaikki kortit on käytetty, torjuntavalinnat ja taistelut jatkuvat, kunnes hyökkääjät kuolevat tai muuri murtuu. Tavallisen muurin tai portin murto päättää pelin heti. Kulmatornin tuhoutuminen poistaa vain tornin käytöstä. Raunioille jääneet joukot eivät vaihda linjaa tai tee enää vahinkoa. Kun kortit loppuvat ja kaikki jäljellä olevat joukot ovat raunioilla, puolustaja voittaa. Tuhoutunutta tornia ei korjata tai rakenneta uudelleen tässä versiossa.

## Kenttä ja liike

Linna on 5 × 5, koko kenttä 11 × 11. Jokaisella hyökkäyslinjalla on kolme ulkopuolista ruutua. Joukot etenevät yhden taistelun aikana muurin viereen, jäävät siihen ja iskevät seuraavillakin kierroksilla. Ne eivät katoa ensimmäisen iskunsa jälkeen.

Yhden ruudun levyinen kuiva rotko ympäröi muuria ja torneja; etelän linja 3 on porttireitti. Rotko ei hidasta joukkoja. Laajenna rotkoa -kortti lisää yhden ruudun ulospäin. Vesi-kortti täyttää yhden rotkoruudun: saapuva joukko pysähtyy yhdeksi taisteluksi, ja ruudussa jo olevat joukot menettävät seuraavan toimintonsa. Vesi poistaa nykyisten joukkojen öljyn ja palon.

Tornin klikkaus korostaa sen kahdeksan puolustuslinjan ruudut. Luode: N1–4/W1–4; koillinen: N2–5/E1–4; lounas: S1–4/W2–5; kaakko: S2–5/E2–5. Torni ei yllä toisen kulmatornin suoraan linjaan. Torni ei vaihda valittua hyökkääjää itsestään eikä ammu ilman kohdetta.

Hyökkääjien listassa näkyvät yksilöllinen tunnus ja nykyinen/enimmäiskestävyys, esimerkiksi 7/16 HP. Yhden joukon ruudussa näkyy sen HP; usean joukon ruudussa lukumäärä ja yhteenlasketut HP:t. Yksilökohtaiset HP:t ja torjuntavalinnat näkyvät aina listassa.

## Testit

`node castle-siege/check.cjs` projektin juuresta. Testit kattavat kolmen kortin vuorojärjestyksen, näkyvyyden, yhden torjuntakohteen, HP-vahingon, vallihaudan sijoituksen ja viiveen, pysyvät hyökkääjät sekä 200 kokonaisen pelin päättymisen. `node castle-siege/elements-check.cjs` tarkistaa öljyn, tulen, veden ja niiden yhdistelmät. Tasapainoluvut ovat alustavia.

## Julkaisu

GitHub Pages julkaisee main-haaran juuren. Pelin tiedostot ovat `index.html`, `style.css`, `engine.js` ja `game.js`. Kaikki resurssipolut ovat suhteellisia.

## Koordinaatit

Kentän X-akseli kasvaa vasemmalta oikealle ja Y-akseli ylhäältä alas; molemmissa arvot 1–11. Hyökkääjän tunnuksen yhteydessä näkyy nykyinen sijainti muodossa X4, Y1. Sijainti näkyy hyökkäysilmoituksessa, torjuntavalikoissa ja yksikkölistassa sekä päivittyy liikkeen jälkeen. Tornien valikoissa näkyy myös tornin oma sijainti.


## 16-bittinen ulkoasu ja ruutukonsoli

`pixel.js` piirtää paikalliset pikselispritet, maaston, muurit, portin, tornit, rauniot ja joukot suoraan pelitilasta. Ulkoisia kuvia tai verkkopalveluja ei tarvita. Klikkaamalla mitä tahansa ruutua ruutukonsoli näyttää sen ja ympäröivät ruudut. Aktiivinen ruutu on kehystetty kullalla. Yksiköiden HP:t, HP-palkit, iskuvoima ja vedessä odottaminen näkyvät konsolissa, samoin rakenteiden kestävyys, tornin tulivoima ja vallihaudan leveys. Yksikön valinta listasta tai tornin kohdevalikosta vaihtaa lähikuvan yksikön nykyiseen ruutuun.

## Öljy, tuli ja vesi

Öljy toimii ehjän muurin, tornin tai portin viereisessä ruudussa. Kuivassa ruudussa vain nykyiset joukot öljyyntyvät ja menettävät seuraavan toimintonsa. Öljyisyys säilyy. Tuli toimii ehjän muurin, portin tai tornin vieressä: kaikki ruudun joukot saavat 3 vahinkoa, ja öljyiset joukot syttyvät palamaan. Palo tekee 2 vahinkoa jokaisen taistelun alussa, kunnes yksikkö kuolee tai vesi sammuttaa sen.

Vedessä öljy mustaa pinnan ilman välitöntä vaikutusta joukkoihin. Tuli sytyttää öljyveden seuraavan taisteluvaiheen loppuun asti. Nykyiset ja saapuvat joukot syttyvät palamaan; saapuvat saavat 2 palovahinkoa heti. Ruudun palon päättyminen ei sammuta joukkoja. Vesi-kortti puhdistaa ja sammuttaa myös ruudun. Tornien alkukestävyys on 10 HP.

Puolustajan 12 korttia: 2 öljyä, 2 tulta, 2 vettä, 1 rotkon laajennus, 1 tornin parannus, 2 vahvistusta ja 2 korjausta. Pikseligrafiikka ja ruutukonsoli näyttävät kuivan rotkon, veden, mustan öljyveden, liekit sekä yksiköiden öljy-, palo- ja odotustilat.

## Torjunnan valinta ruutukonsolista

Valitse ensin ruutu pelikentältä, yksikkölistasta tai ruutukonsolin lähikuvasta. Konsoli näyttää vain ruutuun yltävät tornit ja niiden nykyiset kohteet. Valitse torni ja sitten yksi valitun ruudun hyökkääjistä. Uusi valinta korvaa tornin aiemman kohteen. Eri torneille voi määrätä omat kohteet; torjunnat ja niiden viivat säilyvät näkyvissä.
