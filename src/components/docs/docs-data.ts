/** 模型說明頁共用資料 */

export interface DocSectionMeta {
  id: string;
  label: string;
}

/** 章節錨點清單（scroll-spy 導覽順序） */
export const DOC_SECTIONS: DocSectionMeta[] = [
  { id: 'overview', label: '模型概覽' },
  { id: 'dc-types', label: '四種資料中心類型' },
  { id: 'cooling', label: '冷卻鏈' },
  { id: 'power', label: '配電鏈' },
  { id: 'redundancy', label: '冗餘語彙' },
  { id: 'param-layers', label: '參數三層架構' },
  { id: 'sources', label: '資料來源' },
  { id: 'citation', label: '引用' },
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
