import { headers } from 'next/headers'

/**
 * Resolve tenant ID from request headers
 * Priority: x-tenant-id header > subdomain extraction
 */
export async function resolveTenantId(): Promise<string | null> {
  const headersList = await headers()
  
  // First check for explicit tenant header
  const tenantHeader = headersList.get('x-tenant-id')
  if (tenantHeader) {
    return tenantHeader
  }

  // Fallback: extract from subdomain
  const host = headersList.get('host')
  if (!host) {
    return null
  }

  return extractTenantFromHost(host)
}

/**
 * Extract tenant slug from host
 * Examples:
 *   - tenant1.example.com -> tenant1
 *   - tenant1.localhost:3000 -> tenant1
 *   - example.com -> null
 *   - localhost:3000 -> null
 */
export function extractTenantFromHost(host: string): string | null {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000'
  
  // Remove port if present
  const hostWithoutPort = host.split(':')[0]
  const baseWithoutPort = baseDomain.split(':')[0]

  // Check if host has subdomain
  if (hostWithoutPort === baseWithoutPort) {
    return null // No subdomain
  }

  // Extract subdomain
  const parts = hostWithoutPort.split('.')
  const baseParts = baseWithoutPort.split('.')

  if (parts.length > baseParts.length) {
    // Return first part as tenant slug
    return parts[0]
  }

  return null
}

/**
 * Validate tenant slug format
 */
export function isValidTenantSlug(slug: string): boolean {
  // Only lowercase alphanumeric and hyphens, 3-30 chars
  const slugRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/
  return slugRegex.test(slug)
}
