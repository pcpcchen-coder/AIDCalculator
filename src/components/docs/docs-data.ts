/** 模型說明頁共用資料 */

export interface DocSectionMeta {
  id: string;
  /** i18n key（docs.nav.*），由 SectionNav 以 t() 取譯 */
  labelKey: string;
}

/** 章節錨點清單（scroll-spy 導覽順序） */
export const DOC_SECTIONS: DocSectionMeta[] = [
  { id: 'overview', labelKey: 'docs.nav.overview' },
  { id: 'dc-types', labelKey: 'docs.nav.dcTypes' },
  { id: 'cooling', labelKey: 'docs.nav.cooling' },
  { id: 'power', labelKey: 'docs.nav.power' },
  { id: 'redundancy', labelKey: 'docs.nav.redundancy' },
  { id: 'param-layers', labelKey: 'docs.nav.paramLayers' },
  { id: 'sources', labelKey: 'docs.nav.sources' },
  { id: 'manual', labelKey: 'docs.nav.manual' },
  { id: 'citation', labelKey: 'docs.nav.citation' },
];

/** arXiv:2604.09616 BibTeX（DCGen 1.1, UChicago / Argonne） */
export const BIBTEX = `@misc{gnibga2026dcgen,
  author        = {Gnibga, Wedan Emmanuel and Chien, Andrew A.},
  title         = {DCGen 1.1: A Model-Driven Data Center Configuration Generator},
  year          = {2026},
  eprint        = {2604.09616},
  archivePrefix = {arXiv},
  primaryClass  = {cs.DC},
  url           = {https://arxiv.org/abs/2604.09616}
}`;

export const ARXIV_URL = 'https://arxiv.org/abs/2604.09616';
export const GITHUB_URL = 'https://github.com/WedanEmmanuel/DCGen';
export const DELTA_URL = 'https://www.deltaww.com/';
export const DELTA_PS_URL = 'https://www.deltapowersolutions.com/';
