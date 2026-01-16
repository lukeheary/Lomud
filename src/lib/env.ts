/**
 * Environment utility functions
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}

/**
 * Get the current environment name
 */
export function getEnvironment(): "production" | "development" | "test" {
  return (process.env.NODE_ENV as "production" | "development" | "test") || "development";
}

/**
 * Get the environment prefix for file storage paths
 * Returns "production" or "development"
 */
export function getEnvironmentPrefix(): string {
  return isProduction() ? "production" : "development";
}

/**
 * Build a storage path with environment prefix
 * @param folder - The folder name (e.g., "events", "profiles")
 * @returns Full path with environment prefix (e.g., "production/events", "development/profiles")
 */
export function getStoragePath(folder: string): string {
  return `${getEnvironmentPrefix()}/${folder}`;
}
