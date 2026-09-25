import type { MetadataRoute } from 'next'
import { LAUNCH_AREAS, LAUNCH_STATES } from '@/constants/areas'
import { GUIDES } from '@/constants/guides'
import { createPublicClient } from '@/lib/supabase/public'

const SITE_URL = 'https://plotmarket.ng'

/** Regenerate at most hourly so new approved listings appear without a deploy. */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/properties`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/land-for-sale`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/changelog`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.1 },
  ]

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${SITE_URL}/guides/${g.slug}`,
    lastModified: new Date(g.updated),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const stateRoutes: MetadataRoute.Sitemap = LAUNCH_STATES.map((s) => ({
    url: `${SITE_URL}/land-for-sale/${s.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const areaRoutes: MetadataRoute.Sitemap = LAUNCH_AREAS.map((a) => ({
    url: `${SITE_URL}/land-for-sale/${a.stateSlug}/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  let propertyRoutes: MetadataRoute.Sitemap = []
  const supabase = createPublicClient()
  if (supabase) {
    const { data } = await supabase
      .from('properties')
      .select('id, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5000)
    propertyRoutes = (data ?? []).map((p) => ({
      url: `${SITE_URL}/properties/${p.id}`,
      lastModified: new Date(p.created_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  }

  return [...staticRoutes, ...guideRoutes, ...stateRoutes, ...areaRoutes, ...propertyRoutes]
}
