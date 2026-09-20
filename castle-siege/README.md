# Linnan piiritys

Vuoropohjainen kortti- ja piirityspeli. Valitse hyökkääjä tai puolustaja ja pelaa tietokonetta vastaan. Molemmilla on 12 korttia. Portin tai yhden muuriruudun murtuminen ratkaisee hyökkääjän voiton; puolustajan on torjuttava kaikki joukot.

## Pelaa

Avaa `index.html` selaimessa. Ei asennuksia, palvelinta tai verkkopyyntöjä. GitHub Pagesissa polku on `/testi/castle-siege/`, kun Pages julkaisee main-haaran juuren.

Ensimmäisessä versiossa on neljä aloitustornia. Numeroarvot ovat alustavia, eivät lopullisesti tasapainotettuja. Torni ampuu yhden kohteen vuorossa. Portti on etelä 3, eikä sen linjalle voi rakentaa vallihautaa.

## Tarkistukset

`node castle-siege/check.cjs` projektin juuresta. Testaa vuorot, korttimäärät, vallihaudan kertaviiveen, portin, yhteiset kulmat, voittoehdot ja 200 kokonaista peliä.

## Julkaisu

Staattiset tiedostot: `index.html`, `style.css`, `engine.js`, `game.js`. GitHub Pagesin julkaisulähteeksi main-haaran juuri (Settings → Pages → Deploy from a branch → main / root). Kaikki resurssipolut ovat suhteellisia, joten peli toimii myös alihakemistossa.
