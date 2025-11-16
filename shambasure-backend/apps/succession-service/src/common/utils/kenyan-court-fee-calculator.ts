/**
 * Utility for calculating Kenyan court fees based on the provided configuration.
 * This function CONSUMES the courtFeesConfig.
 */
import { CourtFeesConfig } from '../config/court-fees.config';

export const calculateCourtFees = (
  estateValue: number,
  courtType: 'highCourt' | 'magistrateCourt' | 'kadhisCourt',
  // The entire config object is passed in, making this a pure function
  config: CourtFeesConfig,
) => {
  const probateFees = config.probateFees;

  // Filing fee
  const filingFee = probateFees.filingFee[courtType];

  // Ad valorem
  let adValoremFee = 0;
  const adValoremTiers = probateFees.adValorem.tiers;

  for (const tier of adValoremTiers) {
    if (estateValue >= tier.range.min && estateValue <= tier.range.max) {
      adValoremFee = estateValue * tier.rate;

      if (tier.minFee !== null && adValoremFee < tier.minFee) {
        adValoremFee = tier.minFee;
      }
      if (tier.maxFee !== null && adValoremFee > tier.maxFee) {
        adValoremFee = tier.maxFee;
      }
      break;
    }
  }

  // Rounding rule from config
  const rounding = config.calculationRules.rounding === 'NEAREST_100' ? 100 : 1;
  adValoremFee = Math.round(adValoremFee / rounding) * rounding;

  const totalFee = filingFee + adValoremFee;

  return {
    filingFee,
    adValoremFee,
    totalFee,
    currency: config.calculationRules.currency,
    breakdown: [
      `Filing Fee: ${config.calculationRules.currency} ${filingFee.toLocaleString()}`,
      `Ad Valorem Fee: ${config.calculationRules.currency} ${adValoremFee.toLocaleString()}`,
      `Total Estimated Fee: ${config.calculationRules.currency} ${totalFee.toLocaleString()}`,
    ],
  };
};
