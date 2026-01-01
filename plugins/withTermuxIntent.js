/**
 * Placeholder plugin for Termux intent support
 * Native module disabled for now - using clipboard fallback
 * TODO: Implement Kotlin-compatible native module in future
 */
module.exports = function withTermuxIntent(config) {
  // No-op for now - clipboard fallback works
  console.log('ℹ️ Termux native module disabled - using clipboard fallback');
  return config;
};
