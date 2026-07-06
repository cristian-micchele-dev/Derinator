/**
 * enrich-animales.mjs
 *
 * Adds key discriminating answers to animales.json using the same logic as enrich-famosos.mjs:
 *   1. Taxonomy exclusive group (force-set): mamífero/ave/reptil/insecto/anfibio
 *   2. Body covering exclusive (force-set): pelo/plumas/escamas
 *   3. Mammal subfamily exclusive (force-set): primate/roedor/marsupial/cánido/équido/mamífero marino
 *   4. Habitat, appearance, abilities (setIfAbsent)
 *
 * Run: node scripts/enrich-animales.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ANIMALES_PATH = join(__dirname, '../frontend/src/data/characters/animales.json')

// ---------------------------------------------------------------------------
// Exclusive groups (force-set for all animals)
// ---------------------------------------------------------------------------

// GROUP 1 — Primary taxonomy (only ONE can be yes)
const TAXONOMY_EXCLUSIVE = [13, 14, 26, 27, 214]
// 13=insecto, 14=reptil, 26=ave, 27=mamífero, 214=anfibio

// GROUP 2 — Body covering (only ONE can be yes)
const COVER_EXCLUSIVE = [8, 9, 204]
// 8=pelo, 9=plumas, 204=escamas

// GROUP 3 — Mammal subfamily (only ONE can be yes; all NO for non-mammals)
const SUBFAMILY_EXCLUSIVE = [205, 206, 207, 208, 209, 212]
// 205=primate, 206=roedor, 207=marsupial, 208=cánido, 209=équido, 212=mamífero marino

// ---------------------------------------------------------------------------
// Per-animal exclusive data
// taxYes:  which taxonomy ID gets "yes" (empty = fish/invertebrate, none of the above)
// coverYes: which cover ID gets "yes" (8 | 9 | 204 | 'probably8' for sparse hair)
// subYes:  which subfamily ID gets "yes" (empty for mammals without listed subfamily)
// ---------------------------------------------------------------------------
const EXCLUSIVE = {
  'Perro':        { taxYes: [27],  coverYes: 8,   subYes: [208] },
  'Gato':         { taxYes: [27],  coverYes: 8,   subYes: []    },
  'León':         { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Elefante':     { taxYes: [27],  coverYes: null, subYes: []   }, // sparse hair → setIfAbsent handles 8
  'Delfín':       { taxYes: [27],  coverYes: null, subYes: [212] }, // smooth skin
  'Águila':       { taxYes: [26],  coverYes: 9,   subYes: []    },
  'Tiburón':      { taxYes: [],    coverYes: 204, subYes: []    }, // fish
  'Pingüino':     { taxYes: [26],  coverYes: 9,   subYes: []    },
  'Tigre':        { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Leopardo':     { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Pantera':      { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Jaguar':       { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Guepardo':     { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Capibara':     { taxYes: [27],  coverYes: 8,   subYes: [206] },
  'Vaca':         { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Caballo':      { taxYes: [27],  coverYes: 8,   subYes: [209] },
  'Oso':          { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Lobo':         { taxYes: [27],  coverYes: 8,   subYes: [208] },
  'Zorro':        { taxYes: [27],  coverYes: 8,   subYes: [208] },
  'Mono':         { taxYes: [27],  coverYes: 8,   subYes: [205] },
  'Gorila':       { taxYes: [27],  coverYes: 8,   subYes: [205] },
  'Conejo':       { taxYes: [27],  coverYes: 8,   subYes: []    }, // lagomorph, not rodent
  'Jirafa':       { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Cebra':        { taxYes: [27],  coverYes: 8,   subYes: [209] },
  'Rinoceronte':  { taxYes: [27],  coverYes: null, subYes: []   }, // minimal hair
  'Hipopótamo':   { taxYes: [27],  coverYes: null, subYes: []   }, // minimal hair
  'Camello':      { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Perezoso':     { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Ardilla':      { taxYes: [27],  coverYes: 8,   subYes: [206] },
  'Erizo':        { taxYes: [27],  coverYes: null, subYes: []   }, // spines, minimal hair
  'Mapache':      { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Rata':         { taxYes: [27],  coverYes: 8,   subYes: [206] },
  'Serpiente':    { taxYes: [14],  coverYes: 204, subYes: []    },
  'Cocodrilo':    { taxYes: [14],  coverYes: 204, subYes: []    },
  'Tortuga':      { taxYes: [14],  coverYes: 204, subYes: []    },
  'Rana':         { taxYes: [214], coverYes: null, subYes: []   }, // moist skin
  'Ballena':      { taxYes: [27],  coverYes: null, subYes: [212] }, // smooth skin
  'Orca':         { taxYes: [27],  coverYes: null, subYes: [212] }, // smooth skin
  'Pulpo':        { taxYes: [],    coverYes: null, subYes: []   }, // mollusco invertebrado
  'Búho':         { taxYes: [26],  coverYes: 9,   subYes: []    },
  'Loro':         { taxYes: [26],  coverYes: 9,   subYes: []    },
  'Flamenco':     { taxYes: [26],  coverYes: 9,   subYes: []    },
  'Murciélago':   { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Canguro':      { taxYes: [27],  coverYes: 8,   subYes: [207] },
  'Koala':        { taxYes: [27],  coverYes: 8,   subYes: [207] },
  'Mariposa':     { taxYes: [13],  coverYes: null, subYes: []   },
  'Abeja':        { taxYes: [13],  coverYes: null, subYes: []   },
  'Araña':        { taxYes: [],    coverYes: null, subYes: []   }, // arácnido, no insecto
  'Puma':         { taxYes: [27],  coverYes: 8,   subYes: []    },
  'Cerdo':        { taxYes: [27],  coverYes: 8,   subYes: []    },
}

// ---------------------------------------------------------------------------
// Appearance + habitat + abilities (setIfAbsent)
// 5=doméstico, 6=vuela, 7=acuático, 10=peligroso, 11=grande, 12=pequeño
// 25=alas, 28=depredador, 29=selva, 30=océano, 31=herbívoro, 32=nocturno
// 33=rápido, 34=lento, 35=cola, 36=manchas, 37=rayado, 38=gris
// 39=blanco, 40=negro, 41=naranja, 42=amarillo, 67=veneno, 68=cuernos
// 69=grupos, 70=granja, 210=caparazón, 213=sangre fría, 215=invertebrado, 216=araña, 218=australia
// ---------------------------------------------------------------------------
const PROFILE = {
  'Perro':
    { 5:'yes',6:'no',7:'no',10:'no',11:'no',12:'no',25:'no',28:'no',29:'no',30:'no',31:'no',32:'no',33:'probably',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Gato':
    { 5:'yes',6:'no',7:'no',10:'no',11:'no',12:'yes',25:'no',28:'yes',29:'no',30:'no',31:'no',32:'yes',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'León':
    { 5:'no',6:'no',7:'no',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'no',30:'no',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'yes',42:'yes',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Elefante':
    { 5:'no',6:'no',7:'no',10:'yes',11:'yes',12:'no',25:'no',28:'no',29:'yes',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no',8:'probably' },
  'Delfín':
    { 5:'no',6:'no',7:'yes',10:'no',11:'no',12:'no',25:'no',28:'yes',29:'no',30:'yes',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no',8:'no' },
  'Águila':
    { 5:'no',6:'yes',7:'no',10:'yes',11:'no',12:'no',25:'yes',28:'yes',29:'no',30:'no',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'yes',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Tiburón':
    { 5:'no',6:'no',7:'yes',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'no',30:'yes',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'yes',215:'no',216:'no',218:'no',8:'no',9:'no',27:'no',26:'no',14:'no',13:'no',214:'no' },
  'Pingüino':
    { 5:'no',6:'no',7:'yes',10:'no',11:'no',12:'no',25:'yes',28:'yes',29:'no',30:'yes',31:'no',32:'no',33:'no',34:'no',35:'no',36:'no',37:'no',38:'no',39:'yes',40:'yes',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Tigre':
    { 5:'no',6:'no',7:'no',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'probably',33:'yes',34:'no',35:'yes',36:'no',37:'yes',38:'no',39:'no',40:'yes',41:'yes',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Leopardo':
    { 5:'no',6:'no',7:'no',10:'yes',11:'no',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'yes',33:'yes',34:'no',35:'yes',36:'yes',37:'no',38:'no',39:'no',40:'no',41:'yes',42:'yes',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Pantera':
    { 5:'no',6:'no',7:'no',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'yes',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'yes',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Jaguar':
    { 5:'no',6:'no',7:'no',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'yes',37:'no',38:'no',39:'no',40:'no',41:'yes',42:'yes',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Guepardo':
    { 5:'no',6:'no',7:'no',10:'yes',11:'no',12:'no',25:'no',28:'yes',29:'no',30:'no',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'yes',37:'no',38:'no',39:'no',40:'no',41:'yes',42:'yes',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Capibara':
    { 5:'no',6:'no',7:'yes',10:'no',11:'yes',12:'no',25:'no',28:'no',29:'yes',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'yes',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Vaca':
    { 5:'yes',6:'no',7:'no',10:'no',11:'yes',12:'no',25:'no',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'yes',36:'yes',37:'no',38:'no',39:'no',40:'no',41:'no',42:'no',67:'no',68:'yes',69:'yes',70:'yes',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Caballo':
    { 5:'yes',6:'no',7:'no',10:'no',11:'yes',12:'no',25:'no',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'yes',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Oso':
    { 5:'no',6:'no',7:'no',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'no',33:'no',34:'no',35:'no',36:'no',37:'no',38:'no',39:'no',40:'yes',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Lobo':
    { 5:'no',6:'no',7:'no',10:'yes',11:'no',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Zorro':
    { 5:'no',6:'no',7:'no',10:'no',11:'no',12:'no',25:'no',28:'yes',29:'no',30:'no',31:'no',32:'yes',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'yes',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Mono':
    { 5:'no',6:'no',7:'no',10:'no',11:'no',12:'no',25:'no',28:'no',29:'yes',30:'no',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'yes',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Gorila':
    { 5:'no',6:'no',7:'no',10:'yes',11:'yes',12:'no',25:'no',28:'no',29:'yes',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'no',36:'no',37:'no',38:'no',39:'no',40:'yes',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Conejo':
    { 5:'probably',6:'no',7:'no',10:'no',11:'no',12:'yes',25:'no',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'yes',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Jirafa':
    { 5:'no',6:'no',7:'no',10:'no',11:'yes',12:'no',25:'no',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'yes',36:'yes',37:'no',38:'no',39:'no',40:'no',41:'yes',42:'yes',67:'no',68:'yes',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Cebra':
    { 5:'no',6:'no',7:'no',10:'no',11:'no',12:'no',25:'no',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'yes',38:'no',39:'yes',40:'yes',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Rinoceronte':
    { 5:'no',6:'no',7:'no',10:'yes',11:'yes',12:'no',25:'no',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'yes',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no',8:'probably' },
  'Hipopótamo':
    { 5:'no',6:'no',7:'yes',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no',8:'probably' },
  'Camello':
    { 5:'yes',6:'no',7:'no',10:'no',11:'yes',12:'no',25:'no',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'yes',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Perezoso':
    { 5:'no',6:'no',7:'no',10:'no',11:'no',12:'no',25:'no',28:'no',29:'yes',30:'no',31:'yes',32:'no',33:'no',34:'yes',35:'no',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Ardilla':
    { 5:'no',6:'no',7:'no',10:'no',11:'no',12:'yes',25:'no',28:'no',29:'yes',30:'no',31:'yes',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'yes',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Erizo':
    { 5:'no',6:'no',7:'no',10:'no',11:'no',12:'yes',25:'no',28:'no',29:'no',30:'no',31:'no',32:'yes',33:'no',34:'no',35:'no',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'yes',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no',8:'probably' },
  'Mapache':
    { 5:'no',6:'no',7:'no',10:'no',11:'no',12:'no',25:'no',28:'no',29:'no',30:'no',31:'no',32:'yes',33:'no',34:'no',35:'yes',36:'no',37:'yes',38:'yes',39:'no',40:'yes',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Rata':
    { 5:'no',6:'no',7:'no',10:'no',11:'no',12:'yes',25:'no',28:'no',29:'no',30:'no',31:'no',32:'yes',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Serpiente':
    { 5:'no',6:'no',7:'no',10:'yes',11:'no',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'yes',33:'no',34:'no',35:'yes',36:'yes',37:'yes',38:'no',39:'no',40:'no',41:'no',42:'no',67:'yes',68:'no',69:'no',70:'no',210:'no',213:'yes',215:'no',216:'no',218:'no' },
  'Cocodrilo':
    { 5:'no',6:'no',7:'yes',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'no',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'yes',215:'no',216:'no',218:'no' },
  'Tortuga':
    { 5:'yes',6:'no',7:'yes',10:'no',11:'no',12:'no',25:'no',28:'no',29:'no',30:'yes',31:'yes',32:'no',33:'no',34:'yes',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'yes',213:'yes',215:'no',216:'no',218:'no' },
  'Rana':
    { 5:'no',6:'no',7:'yes',10:'no',11:'no',12:'yes',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'yes',33:'yes',34:'no',35:'no',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'yes',67:'yes',68:'no',69:'yes',70:'no',210:'no',213:'yes',215:'no',216:'no',218:'no',8:'no',9:'no',204:'no' },
  'Ballena':
    { 5:'no',6:'no',7:'yes',10:'no',11:'yes',12:'no',25:'no',28:'yes',29:'no',30:'yes',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'yes',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no',8:'no' },
  'Orca':
    { 5:'no',6:'no',7:'yes',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'no',30:'yes',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'yes',40:'yes',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no',8:'no' },
  'Pulpo':
    { 5:'no',6:'no',7:'yes',10:'yes',11:'no',12:'no',25:'no',28:'yes',29:'no',30:'yes',31:'no',32:'yes',33:'yes',34:'no',35:'no',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'no',67:'yes',68:'no',69:'no',70:'no',210:'no',213:'yes',215:'yes',216:'no',218:'no',8:'no',9:'no',204:'no',27:'no',26:'no',14:'no',13:'no',214:'no' },
  'Búho':
    { 5:'no',6:'yes',7:'no',10:'no',11:'no',12:'no',25:'yes',28:'yes',29:'no',30:'no',31:'no',32:'yes',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Loro':
    { 5:'yes',6:'yes',7:'no',10:'no',11:'no',12:'yes',25:'yes',28:'no',29:'yes',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'yes',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Flamenco':
    { 5:'no',6:'yes',7:'yes',10:'no',11:'no',12:'no',25:'yes',28:'no',29:'no',30:'no',31:'no',32:'no',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'yes',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Murciélago':
    { 5:'no',6:'yes',7:'no',10:'no',11:'no',12:'yes',25:'yes',28:'yes',29:'yes',30:'no',31:'no',32:'yes',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'yes',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Canguro':
    { 5:'no',6:'no',7:'no',10:'no',11:'yes',12:'no',25:'no',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'no',42:'yes',67:'no',68:'no',69:'yes',70:'no',210:'no',213:'no',215:'no',216:'no',218:'yes' },
  'Koala':
    { 5:'no',6:'no',7:'no',10:'no',11:'no',12:'yes',25:'no',28:'no',29:'no',30:'no',31:'yes',32:'yes',33:'no',34:'yes',35:'no',36:'no',37:'no',38:'yes',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'yes' },
  'Mariposa':
    { 5:'no',6:'yes',7:'no',10:'no',11:'no',12:'yes',25:'yes',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'no',34:'no',35:'no',36:'yes',37:'no',38:'no',39:'no',40:'no',41:'no',42:'no',67:'no',68:'no',69:'no',70:'no',210:'no',213:'yes',215:'yes',216:'no',218:'no',8:'no',9:'no',204:'no' },
  'Abeja':
    { 5:'no',6:'yes',7:'no',10:'yes',11:'no',12:'yes',25:'yes',28:'no',29:'no',30:'no',31:'yes',32:'no',33:'yes',34:'no',35:'no',36:'no',37:'yes',38:'no',39:'no',40:'yes',41:'no',42:'yes',67:'yes',68:'no',69:'yes',70:'no',210:'no',213:'yes',215:'yes',216:'no',218:'no',8:'no',9:'no',204:'no' },
  'Araña':
    { 5:'no',6:'no',7:'no',10:'yes',11:'no',12:'yes',25:'no',28:'yes',29:'no',30:'no',31:'no',32:'yes',33:'no',34:'no',35:'no',36:'no',37:'no',38:'no',39:'no',40:'yes',41:'no',42:'no',67:'yes',68:'no',69:'no',70:'no',210:'no',213:'yes',215:'yes',216:'yes',218:'no',8:'no',9:'no',204:'no',27:'no',26:'no',14:'no',13:'no',214:'no' },
  'Puma':
    { 5:'no',6:'no',7:'no',10:'yes',11:'yes',12:'no',25:'no',28:'yes',29:'yes',30:'no',31:'no',32:'no',33:'yes',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'no',40:'no',41:'yes',42:'yes',67:'no',68:'no',69:'no',70:'no',210:'no',213:'no',215:'no',216:'no',218:'no' },
  'Cerdo':
    { 5:'yes',6:'no',7:'no',10:'no',11:'no',12:'no',25:'no',28:'no',29:'no',30:'no',31:'no',32:'no',33:'no',34:'no',35:'yes',36:'no',37:'no',38:'no',39:'yes',40:'no',41:'no',42:'no',67:'no',68:'no',69:'yes',70:'yes',210:'no',213:'no',215:'no',216:'no',218:'no' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setIfAbsent(answers, key, value) {
  const k = String(key)
  if (!(k in answers)) answers[k] = value
}

function setForce(answers, key, value) {
  answers[String(key)] = value
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------
const animales = JSON.parse(readFileSync(ANIMALES_PATH, 'utf8'))
let enrichedCount = 0
let missingData = []

for (const animal of animales) {
  const excl = EXCLUSIVE[animal.name]
  const profile = PROFILE[animal.name]

  if (!excl && !profile) {
    missingData.push(animal.name)
    continue
  }

  const before = JSON.stringify(animal.answers)

  if (excl) {
    // 1. Taxonomy exclusive (force-set)
    for (const qId of TAXONOMY_EXCLUSIVE) {
      setForce(animal.answers, qId, excl.taxYes.includes(qId) ? 'yes' : 'no')
    }

    // 2. Body covering exclusive (force-set when unambiguous)
    if (excl.coverYes !== null) {
      for (const qId of COVER_EXCLUSIVE) {
        setForce(animal.answers, qId, excl.coverYes === qId ? 'yes' : 'no')
      }
    } else {
      // Ambiguous (marine mammal / minimal hair / no covering): only set plumas and escamas to no
      setForce(animal.answers, 9, 'no')
      setForce(animal.answers, 204, 'no')
      // 8 (pelo) handled per-animal in PROFILE with setIfAbsent
    }

    // 3. Mammal subfamily exclusive (force-set)
    for (const qId of SUBFAMILY_EXCLUSIVE) {
      setForce(animal.answers, qId, excl.subYes.includes(qId) ? 'yes' : 'no')
    }
  }

  // 4. Appearance + habitat + abilities (setIfAbsent)
  if (profile) {
    for (const [key, value] of Object.entries(profile)) {
      setIfAbsent(animal.answers, key, value)
    }
  }

  if (JSON.stringify(animal.answers) !== before) enrichedCount++
}

// Sort answers numerically
for (const animal of animales) {
  animal.answers = Object.fromEntries(
    Object.entries(animal.answers).sort((a, b) => Number(a[0]) - Number(b[0]))
  )
}

writeFileSync(ANIMALES_PATH, JSON.stringify(animales, null, 2), 'utf8')

console.log(`Done.`)
console.log(`  Animals enriched: ${enrichedCount} / ${animales.length}`)
if (missingData.length) {
  console.log(`  WARNING — no data defined for: ${missingData.join(', ')}`)
}
