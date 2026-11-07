# Respiración celular — viaje interactivo en 3D

An interactive Three.js site that teaches cellular respiration to a 13-year-old. It is based on the class study guide ("Respiración celular"). Each section of the guide is one station, with an animated 3D model and an explanation in Spanish.

## Run

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Double-clicking `index.html` also works. Three.js r147 loads as a classic script from jsDelivr, and the fonts load from Google Fonts. There is no build step.

## Stations

| # | Station | What you do |
|---|---|---|
| 0 | Inicio | A cell with mitochondria. Glucose enters, ATP comes out. |
| 1 | ¿Qué es? | Run the reaction glucose + 6 O₂ → 6 CO₂ + 6 H₂O + energy (ATP and heat). |
| 2 | ¿Dónde? | A cutaway mitochondrion. Click the cytosol, membranes, intermembrane space, cristae or matrix. |
| 3 | Glucólisis | 4 steps: 2 ATP used, the glucose splits, 2 NADH form, 4 ATP form → 2 pyruvates. |
| 4 | Oxidación del piruvato | Pyruvate enters the matrix, loses CO₂ and makes NADH and acetyl-CoA. |
| 5 | Ciclo de Krebs | Two turns: 6C → 5C → 4C, with CO₂, NADH, FADH₂ and ATP collected on a tray. |
| 6 | Fosforilación oxidativa | Hand NADH/FADH₂ to the chain. H⁺ is pumped, builds up in the intermembrane space and flows through the ATP synthase (4 H⁺ per ATP, up to 28 ATP). There is an oxygen on/off switch. |
| 7 | ¿Cuánto ATP? | Stacks of ATP coins, with a switch between the usual count (30–32) and the classic count (36–38). |
| 8 | ¿De dónde sale el CO₂? | Follow the 6 numbered carbons of glucose. Carbons 3 and 4 leave in pyruvate oxidation; the other 4 leave in the Krebs cycle. |
| 9 | Sin oxígeno | A live NAD⁺/NADH loop: no fermentation, lactic or alcoholic fermentation (with rising bread dough). |
| 10 | Respiración anaerobia | A bacterial chain with oxygen, nitrate or fermentation as the final acceptor, plus a comparison table. |
| 11 | Palabras clave | The glossary, with a 3D model for each word. |
| 12 | Resumen | Divide → prepara → completa el ciclo → forma mucho ATP. |
| 13 | Comprueba | The 12 questions from the guide as a multiple-choice quiz. Each correct answer adds 1 ATP coin. |

The "Tu glucosa ha producido" counter adds up what each stage produces as the student completes it.

## Writing

ASD-STE100 is a standard for English, so its rules were adapted to Spanish: short sentences, one idea per sentence, active voice, imperatives for instructions (`Pulsa`, `Arrastra`), and one term per concept (for example, always "espacio intermembranal" and always "transportador de electrones").

## Files

- `js/engine.js` — renderer, camera framing, tweens, HTML labels that follow 3D objects, drag-to-rotate and picking
- `js/models.js` — atoms, carbon skeletons, ATP/ADP, NADH/FADH₂, cutaway mitochondrion, membrane
- `js/app.js` — navigation, panel, legend, glucose counter
- `js/s1-inicio.js`, `js/s2-etapas.js`, `js/s3-fosf.js`, `js/s4-extra.js` — the stations
- `css/style.css`, `index.html`
