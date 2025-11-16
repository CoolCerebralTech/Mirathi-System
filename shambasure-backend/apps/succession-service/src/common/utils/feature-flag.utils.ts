/**
 * Utility for checking simple boolean feature flags.
 * NOTE: This helper is for basic on/off flags only. More complex logic
 * for rollouts and segmentation will be handled by a dedicated FeatureFlagService.
 */
import featureFlagsConfig from '../config/feature-flags.config';

export const isFeatureEnabled = (featurePath: string): boolean => {
  // We invoke the config function to get the actual flags object
  const flags = featureFlagsConfig();

  // Handle nested paths like "will.templates" -> flags.will.templates
  const parts = featurePath.split('.');
  let current: unknown = flags;

  for (const part of parts) {
    // Check if the current level is a valid object
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return false; // Path does not exist
    }
    // Move to the next level in the object
    current = (current as Record<string, unknown>)[part];
  }

  // Ensure the final value is strictly true
  return current === true;
};
