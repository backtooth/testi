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

Yhden ruudun levyinen vallihauta on vakiona kaikkien muurien ja tornien edessä. Etelän linja 3 on kuiva porttireitti. Kortti laajentaa valitun linjan hautaa yhden ruudun ulospäin, enintään kahden ruudun levyiseksi. Kukin vesiruutu pysäyttää joukon yhdeksi taisteluksi ennen iskua: perushauta yhden ja laajennettu kaksi kertaa. Jo ohitettu laajennusruutu ei siirrä joukkoa takaisin.

Tornin klikkaus korostaa sen kahdeksan puolustuslinjan ruudut. Luode: N1–4/W1–4; koillinen: N2–5/E1–4; lounas: S1–4/W2–5; kaakko: S2–5/E2–5. Torni ei yllä toisen kulmatornin suoraan linjaan. Torni ei vaihda valittua hyökkääjää itsestään eikä ammu ilman kohdetta.

Hyökkääjien listassa näkyvät yksilöllinen tunnus ja nykyinen/enimmäiskestävyys, esimerkiksi 7/16 HP. Yhden joukon ruudussa näkyy sen HP; usean joukon ruudussa lukumäärä ja yhteenlasketut HP:t. Yksilökohtaiset HP:t ja torjuntavalinnat näkyvät aina listassa.

## Testit

`node castle-siege/check.cjs` projektin juuresta. Testit kattavat kolmen kortin vuorojärjestyksen, näkyvyyden, yhden torjuntakohteen, HP-vahingon, vallihaudan sijoituksen ja viiveen, pysyvät hyökkääjät sekä 200 kokonaisen pelin päättymisen. Tasapainoluvut ovat alustavia.

## Julkaisu

GitHub Pages julkaisee main-haaran juuren. Pelin tiedostot ovat `index.html`, `style.css`, `engine.js` ja `game.js`. Kaikki resurssipolut ovat suhteellisia.

## Koordinaatit

Kentän X-akseli kasvaa vasemmalta oikealle ja Y-akseli ylhäältä alas; molemmissa arvot 1–11. Hyökkääjän tunnuksen yhteydessä näkyy nykyinen sijainti muodossa X4, Y1. Sijainti näkyy hyökkäysilmoituksessa, torjuntavalikoissa ja yksikkölistassa sekä päivittyy liikkeen jälkeen. Tornien valikoissa näkyy myös tornin oma sijainti.

