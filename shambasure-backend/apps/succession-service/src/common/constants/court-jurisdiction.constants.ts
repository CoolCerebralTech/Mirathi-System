/**
 * Kenyan Court Jurisdiction Constants
 */

export type CourtLevel =
  | 'HIGH_COURT'
  | 'CHIEF_MAGISTRATE'
  | 'PRINCIPAL_MAGISTRATE'
  | 'SENIOR_MAGISTRATE'
  | 'KADHIS_COURT';

// Court Types and Jurisdiction
export const COURT_JURISDICTION = {
  HIGH_COURT: {
    name: 'High Court of Kenya',
    minJurisdiction: 0,
    maxJurisdiction: null as number | null,
    probatePowers: true,
    complexCases: true,
    locations: [
      'Nairobi',
      'Mombasa',
      'Kisumu',
      'Nakuru',
      'Eldoret',
      'Meru',
      'Nyeri',
      'Machakos',
      'Kakamega',
      'Malindi',
    ],
  },
  CHIEF_MAGISTRATE: {
    name: 'Chief Magistrate Court',
    minJurisdiction: 0,
    maxJurisdiction: 20000000, // KES 20M
    probatePowers: true,
    complexCases: true,
    locations: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
  },
  PRINCIPAL_MAGISTRATE: {
    name: 'Principal Magistrate Court',
    minJurisdiction: 0,
    maxJurisdiction: 10000000, // KES 10M
    probatePowers: true,
    complexCases: false,
    locations: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
  },
  SENIOR_MAGISTRATE: {
    name: 'Senior Magistrate Court',
    minJurisdiction: 0,
    maxJurisdiction: 7000000, // KES 7M
    probatePowers: true,
    complexCases: false,
    locations: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
  },
  KADHIS_COURT: {
    name: 'Kadhis Court',
    minJurisdiction: 0,
    maxJurisdiction: null as number | null,
    probatePowers: true,
    complexCases: false,
    locations: [
      'Nairobi',
      'Mombasa',
      'Malindi',
      'Lamu',
      'Garissa',
      'Wajir',
      'Mandera',
      'Isiolo',
      'Marsabit',
    ],
  },
} as const;

// Court Locations by County
export const COURT_LOCATIONS = {
  NAIROBI: {
    highCourt: 'Nairobi Law Courts',
    chiefMagistrate: 'Nairobi Chief Magistrates Court',
    principalMagistrate: 'Nairobi Principal Magistrates Court',
    seniorMagistrate: 'Nairobi Senior Magistrates Court',
    kadhisCourt: 'Nairobi Kadhis Court',
    landCourt: 'Nairobi Environment and Land Court',
  },
  MOMBASA: {
    highCourt: 'Mombasa Law Courts',
    chiefMagistrate: 'Mombasa Chief Magistrates Court',
    principalMagistrate: 'Mombasa Principal Magistrates Court',
    seniorMagistrate: 'Mombasa Senior Magistrates Court',
    kadhisCourt: 'Mombasa Kadhis Court',
    landCourt: 'Mombasa Environment and Land Court',
  },
  KISUMU: {
    highCourt: 'Kisumu Law Courts',
    chiefMagistrate: 'Kisumu Chief Magistrates Court',
    principalMagistrate: 'Kisumu Principal Magistrates Court',
    seniorMagistrate: 'Kisumu Senior Magistrates Court',
    landCourt: 'Kisumu Environment and Land Court',
  },
  NAKURU: {
    highCourt: 'Nakuru Law Courts',
    chiefMagistrate: 'Nakuru Chief Magistrates Court',
    principalMagistrate: 'Nakuru Principal Magistrates Court',
    seniorMagistrate: 'Nakuru Senior Magistrates Court',
    landCourt: 'Nakuru Environment and Land Court',
  },
} as const;

export default {
  COURT_JURISDICTION,
  COURT_LOCATIONS,
};
