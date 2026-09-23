# Linnan piiritys

Vuoropohjainen kortti- ja piirityspeli. Valitse hyökkääjä tai puolustaja ja pelaa tietokonetta vastaan. Molemmilla on 12 korttia. Portin tai yhden muuriruudun murtuminen ratkaisee hyökkääjän voiton; puolustajan on torjuttava kaikki joukot.

## Pelaa

Avaa `index.html` selaimessa. Ei asennuksia, palvelinta tai verkkopyyntöjä. GitHub Pagesissa polku on `/testi/castle-siege/`, kun Pages julkaisee main-haaran juuren.

Ensimmäisessä versiossa on neljä aloitustornia. Numeroarvot ovat alustavia, eivät lopullisesti tasapainotettuja. Torni ampuu yhden kohteen vuorossa. Portti on etelä 3, eikä sen linjalle voi rakentaa vallihautaa.

## Tarkistukset

`node castle-siege/check.cjs` projektin juuresta. Testaa vuorot, korttimäärät, vallihaudan kertaviiveen, portin, yhteiset kulmat, voittoehdot ja 200 kokonaista peliä.

## Julkaisu

Staattiset tiedostot: `index.html`, `style.css`, `engine.js`, `game.js`. GitHub Pagesin julkaisulähteeksi main-haaran juuri (Settings → Pages → Deploy from a branch → main / root). Kaikki resurssipolut ovat suhteellisia, joten peli toimii myös alihakemistossa.

## Torjunnan valinta (23.9.2026)

Hyökkääjä aloittaa aina. Kortin pelaaminen ilmoittaa suunnan ja tuo joukon kentälle, mutta ei käynnistä liikettä tai taistelua. Puolustaja pelaa oman korttinsa, valitsee torneille hyökkääjät ja vahvistaa vuoronsa. Taistelu ratkaistaan vasta tämän jälkeen.

Jokainen torni näkee kahdeksan linjaa: neljä kummaltakin viereiseltä sivulta, pois lukien toisen kulmatornin suora linja. Luode: N1–4/W1–4; koillinen: N2–5/E1–4; lounas: S1–4/W2–5; kaakko: S2–5/E2–5. Torni ampuu vain yhtä nimettyä hyökkääjää vuorossa eikä vaihda kohdetta automaattisesti. Kohteeton torni ei ammu. Myös lähtöruudussa oleva ilmoitettu hyökkääjä on valittavissa.

Kentällä katkoviiva näyttää ilmoitetun hyökkäyslinjan ja värillinen yhtenäinen viiva tornin torjuntakohteen. Kohteet merkitään yksilöllisillä numeroilla. Korttien loputtua kohteet valitaan uudelleen jokaisella taisteluvuorolla.
