/**
 * EQ LATAM — Assessment / Credits Catalog.
 *
 * Source: spec section 7. Each entry represents a deliverable that
 * a certified practitioner can purchase from 6S Latam for use with
 * their own end client.
 *
 * Cost model:
 *   - 1 crédito = $1 USD (mantenimiento anual a 6S Global lo cubre,
 *     por eso credits_cost = $0 para 6S Latam)
 *   - Graduate retail: $1 + markup configurable por la calculadora
 *     pública (default 2× = $2/crédito sugerido).
 */

export type AssessmentCategory =
  | 'BRAIN_PROFILE'
  | 'SEI'
  | 'VITAL_SIGNS_TEAM'
  | 'VITAL_SIGNS_ORG'
  | 'VITAL_SIGNS_ED'
  | 'INSIGHTS'
  | 'SPECIALIZED'
  | 'OTHER';

export interface Assessment {
  code: string;
  name: string;
  category: AssessmentCategory;
  credits: number;
  /** Optional notes shown in the catalog UI. */
  notes?: string;
}

export const ASSESSMENTS: Assessment[] = [
  // Brain Profiles
  { code: 'BBP_V5',         name: 'Brain Brief Profile (V5)',     category: 'BRAIN_PROFILE', credits: 10 },
  { code: 'BTP_V5',         name: 'Brain Talent Profile (V5)',    category: 'BRAIN_PROFILE', credits: 10 },
  { code: 'BDP_V5',         name: 'Brain Discovery Profile (V5)', category: 'BRAIN_PROFILE', credits: 10 },
  { code: 'BPP_3PACK_V5',   name: 'Brain Profile 3-Pack (V5/A)',  category: 'BRAIN_PROFILE', credits: 30, notes: 'Bundle de 3 reports' },
  { code: 'BBP_YOUTH',      name: 'Brain Brief Profile · Youth',  category: 'BRAIN_PROFILE', credits: 5 },
  { code: 'BTP_YOUTH',      name: 'Brain Talent Profile · Youth', category: 'BRAIN_PROFILE', credits: 5 },

  // SEI / EQ Assessments
  { code: 'SEI_360',        name: 'SEI 360',                      category: 'SEI', credits: 165 },
  { code: 'LVS_360',        name: 'LVS 360',                      category: 'SEI', credits: 165 },

  // Specialized profiles
  { code: 'EQPLUS',         name: 'EQPlus Motivation Profile',    category: 'SPECIALIZED', credits: 25 },
  { code: 'EQUIP_SALES',    name: 'EQuip Sales Profile (V5)',     category: 'SPECIALIZED', credits: 30 },
  { code: 'LIFE_SKILLS',    name: 'Life Skills Profile',          category: 'SPECIALIZED', credits: 25 },
  { code: 'TRUST_STYLE',    name: 'Trust Style Inventory',        category: 'SPECIALIZED', credits: 25 },
  { code: 'LEAD_CHANGE',    name: 'Leading through Change Report', category: 'SPECIALIZED', credits: 43 },
  { code: 'MENTORING',      name: 'Mentoring Activation Profile', category: 'SPECIALIZED', credits: 20 },
  { code: 'LEADERSHIP',     name: 'Leadership',                   category: 'SPECIALIZED', credits: 20 },
  { code: 'NEURAL_NET_V5',  name: 'Neural Network (V5)',          category: 'SPECIALIZED', credits: 20 },

  // SEQ
  { code: 'SEQ_PROFILE',    name: 'SEQ Profile',                  category: 'SPECIALIZED', credits: 15 },
  { code: 'SEQ_DEV',        name: 'SEQ Development',              category: 'SPECIALIZED', credits: 35 },

  // Insights
  { code: 'IGT',            name: 'Insights for Great Teachers',  category: 'INSIGHTS', credits: 20 },
  { code: 'IPD',            name: 'Insights for Personal Development', category: 'INSIGHTS', credits: 33 },
  { code: 'IPM',            name: 'Insights for People Management',category: 'INSIGHTS', credits: 46 },

  // Vital Signs — Team
  { code: 'TVS_LT25',       name: 'TVS · Equipo <25',             category: 'VITAL_SIGNS_TEAM', credits: 300 },
  { code: 'TVS_26_50',      name: 'TVS · Equipo 26-50',           category: 'VITAL_SIGNS_TEAM', credits: 450 },
  { code: 'TVS_51_75',      name: 'TVS · Equipo 51-75',           category: 'VITAL_SIGNS_TEAM', credits: 675 },
  { code: 'TVS_76_100',     name: 'TVS · Equipo 76-100',          category: 'VITAL_SIGNS_TEAM', credits: 1150 },

  // Vital Signs — Organizational
  { code: 'OVS_LT50',       name: 'OVS · Org <50',                category: 'VITAL_SIGNS_ORG', credits: 600 },
  { code: 'OVS_51_250',     name: 'OVS · Org 51-250',             category: 'VITAL_SIGNS_ORG', credits: 1300 },
  { code: 'OVS_251_500',    name: 'OVS · Org 251-500',            category: 'VITAL_SIGNS_ORG', credits: 2000 },
  { code: 'OVS_501_1000',   name: 'OVS · Org 501-1000',           category: 'VITAL_SIGNS_ORG', credits: 3000 },
  { code: 'OVS_1001_10000', name: 'OVS · Org 1001-10000',         category: 'VITAL_SIGNS_ORG', credits: 4500 },

  // Vital Signs — Education
  { code: 'EVS',            name: 'Education Vital Signs',        category: 'VITAL_SIGNS_ED', credits: 300 },

  // Otros
  { code: 'DASHBOARD_V5',   name: 'Dashboard (V5)',               category: 'OTHER', credits: 150 },
  { code: 'DASHBOARD_YOUTH',name: 'Dashboard · Youth',            category: 'OTHER', credits: 50 },
  { code: 'GDR',            name: 'Group Development Report',     category: 'OTHER', credits: 198 },
  { code: 'DEVELOPMENT',    name: 'Development',                  category: 'OTHER', credits: 33 },
  { code: 'YOUTH_REPORT',   name: 'Youth Report',                 category: 'OTHER', credits: 5 },
  { code: 'UEQ_PROFILE',    name: 'UEQ Profile',                  category: 'OTHER', credits: 3 },
  { code: 'UEQ_YV',         name: 'UEQ YV Profile',               category: 'OTHER', credits: 2 },
];

export const CATEGORY_LABELS: Record<AssessmentCategory, string> = {
  BRAIN_PROFILE:     'Brain Profiles',
  SEI:               'SEI / EQ 360',
  VITAL_SIGNS_TEAM:  'Team Vital Signs',
  VITAL_SIGNS_ORG:   'Organizational Vital Signs',
  VITAL_SIGNS_ED:    'Education Vital Signs',
  INSIGHTS:          'Insights',
  SPECIALIZED:       'Specialized Profiles',
  OTHER:             'Otros',
};

export const CATEGORY_ORDER: AssessmentCategory[] = [
  'BRAIN_PROFILE',
  'SEI',
  'VITAL_SIGNS_TEAM',
  'VITAL_SIGNS_ORG',
  'VITAL_SIGNS_ED',
  'INSIGHTS',
  'SPECIALIZED',
  'OTHER',
];

/**
 * Default markup that a graduate / practitioner can use as starting
 * point when quoting to their own end client. 2× = $2/crédito.
 */
export const GRADUATE_DEFAULT_MARKUP_MULTIPLIER = 2;
