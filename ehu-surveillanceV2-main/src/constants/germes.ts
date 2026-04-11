// Référentiel des germes/pathogènes — Codes SNOMED CT (SCT) internationaux
// Source : SNOMED Clinical Terms International Edition — utilisé par OMS, ECDC, CDC
export interface GermeRef {
  code: string   // Code SNOMED CT au format "SCT-XXXXXXX"
  nom: string
  type: "bacterie" | "virus" | "parasite" | "champignon"
}

export const GERME_TYPES = [
  { key: "bacterie", label: "Bactéries" },
  { key: "virus", label: "Virus" },
  { key: "parasite", label: "Parasites" },
  { key: "champignon", label: "Champignons" },
] as const

export const GERMES: GermeRef[] = [
  // ── Bactéries ─────────────────────────────────────────────────────────────
  { code: "SCT-5209001",   nom: "Salmonella typhi",                 type: "bacterie" },
  { code: "SCT-85908007",  nom: "Salmonella paratyphi",             type: "bacterie" },
  { code: "SCT-75953000",  nom: "Vibrio cholerae",                  type: "bacterie" },
  { code: "SCT-77352002",  nom: "Shigella spp.",                    type: "bacterie" },
  { code: "SCT-116395006", nom: "Escherichia coli O157:H7",         type: "bacterie" },
  { code: "SCT-17872004",  nom: "Neisseria meningitidis",           type: "bacterie" },
  { code: "SCT-9861002",   nom: "Streptococcus pneumoniae",         type: "bacterie" },
  { code: "SCT-113858008", nom: "Mycobacterium tuberculosis",       type: "bacterie" },
  { code: "SCT-5500001",   nom: "Bordetella pertussis",             type: "bacterie" },
  { code: "SCT-5851001",   nom: "Corynebacterium diphtheriae",      type: "bacterie" },
  { code: "SCT-77664004",  nom: "Clostridium tetani",               type: "bacterie" },
  { code: "SCT-25981007",  nom: "Brucella spp.",                    type: "bacterie" },
  { code: "SCT-80897008",  nom: "Legionella pneumophila",           type: "bacterie" },
  { code: "SCT-33526006",  nom: "Listeria monocytogenes",           type: "bacterie" },
  { code: "SCT-115329001", nom: "Staphylococcus aureus (MRSA)",     type: "bacterie" },
  { code: "SCT-713032009", nom: "Acinetobacter baumannii",          type: "bacterie" },
  { code: "SCT-56415008",  nom: "Klebsiella pneumoniae",            type: "bacterie" },
  { code: "SCT-52499004",  nom: "Pseudomonas aeruginosa",           type: "bacterie" },
  { code: "SCT-372132006", nom: "Enterococcus résistant (ERV/VRE)", type: "bacterie" },
  { code: "SCT-43499008",  nom: "Haemophilus influenzae",           type: "bacterie" },
  { code: "SCT-50043002",  nom: "Streptococcus pyogenes (Groupe A)",type: "bacterie" },
  { code: "SCT-40886007",  nom: "Neisseria gonorrhoeae",            type: "bacterie" },
  { code: "SCT-4776004",   nom: "Treponema pallidum",               type: "bacterie" },
  { code: "SCT-27836007",  nom: "Bordetella parapertussis",          type: "bacterie" },
  { code: "SCT-83436008",  nom: "Rickettsia spp.",                  type: "bacterie" },

  // ── Virus ──────────────────────────────────────────────────────────────────
  { code: "SCT-840533007", nom: "SARS-CoV-2 (COVID-19)",            type: "virus" },
  { code: "SCT-407475007", nom: "Virus Influenza A",                type: "virus" },
  { code: "SCT-407476008", nom: "Virus Influenza B",                type: "virus" },
  { code: "SCT-62944002",  nom: "Virus de l'hépatite A (VHA)",      type: "virus" },
  { code: "SCT-12238009",  nom: "Virus de l'hépatite B (VHB)",      type: "virus" },
  { code: "SCT-50711007",  nom: "Virus de l'hépatite C (VHC)",      type: "virus" },
  { code: "SCT-19030005",  nom: "VIH (Virus de l'immunodéficience humaine)", type: "virus" },
  { code: "SCT-52584002",  nom: "Virus de la rougeole",             type: "virus" },
  { code: "SCT-56750001",  nom: "Virus de la rubéole",              type: "virus" },
  { code: "SCT-34348001",  nom: "Virus de la dengue (DENV)",        type: "virus" },
  { code: "SCT-121855002", nom: "Virus du chikungunya (CHIKV)",     type: "virus" },
  { code: "SCT-407327008", nom: "Virus Zika (ZIKV)",                type: "virus" },
  { code: "SCT-186150001", nom: "Rotavirus",                        type: "virus" },
  { code: "SCT-407359008", nom: "Norovirus",                        type: "virus" },
  { code: "SCT-59881000",  nom: "Virus de la rage (RABV)",          type: "virus" },
  { code: "SCT-406572005", nom: "West Nile virus (WNV)",            type: "virus" },
  { code: "SCT-243612006", nom: "Virus de la poliomyélite (Poliovirus)", type: "virus" },
  { code: "SCT-243617000", nom: "Virus de la varicelle-zona (VZV)", type: "virus" },
  { code: "SCT-243621005", nom: "Virus Ebola",                      type: "virus" },

  // ── Parasites ──────────────────────────────────────────────────────────────
  { code: "SCT-372314000", nom: "Plasmodium falciparum",            type: "parasite" },
  { code: "SCT-83821001",  nom: "Plasmodium vivax",                 type: "parasite" },
  { code: "SCT-85777006",  nom: "Plasmodium malariae",              type: "parasite" },
  { code: "SCT-17078005",  nom: "Leishmania spp.",                  type: "parasite" },
  { code: "SCT-28169003",  nom: "Toxoplasma gondii",                type: "parasite" },
  { code: "SCT-74160002",  nom: "Giardia lamblia (duodenalis)",     type: "parasite" },
  { code: "SCT-50464009",  nom: "Entamoeba histolytica",            type: "parasite" },
  { code: "SCT-44551004",  nom: "Echinococcus granulosus",          type: "parasite" },
  { code: "SCT-21061004",  nom: "Trichinella spiralis",             type: "parasite" },

  // ── Champignons ────────────────────────────────────────────────────────────
  { code: "SCT-53326005",  nom: "Candida albicans",                 type: "champignon" },
  { code: "SCT-83819000",  nom: "Aspergillus spp.",                 type: "champignon" },
  { code: "SCT-67609007",  nom: "Cryptococcus neoformans",          type: "champignon" },
  { code: "SCT-11162004",  nom: "Histoplasma capsulatum",           type: "champignon" },
]
