import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Delete a user account.
 *
 * Deleting only the public.profiles row would leave the auth.users row behind,
 * and that account could still sign in while having no profile. So the auth
 * user is removed instead, and the cascade on profiles.id takes the profile,
 * their properties and their inquiries with it.
 *
 * The proxy already keeps non-admins out of /admin pages, but this is a route
 * handler and is reachable directly, so it checks the caller's role itself.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (id === user.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account from here.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Refuse to remove another admin. Losing the only remaining admin account by
  // accident is not recoverable from inside the app.
  const { data: target, error: targetError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', id)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: 'That account no longer exists.' }, { status: 404 })
  }

  if (target.role === 'admin') {
    return NextResponse.json(
      { error: 'Admin accounts cannot be deleted from the panel.' },
      { status: 400 }
    )
  }

  // Best effort media cleanup. Storage objects are not covered by the database
  // cascade, so without this the listing images outlive the account and keep
  // costing storage. A failure here must not block the deletion.
  try {
    const { data: propertyFolders } = await admin.storage
      .from('property-media')
      .list(id, { limit: 1000 })

    const paths: string[] = []
    for (const folder of propertyFolders ?? []) {
      const { data: files } = await admin.storage
        .from('property-media')
        .list(`${id}/${folder.name}`, { limit: 1000 })
      for (const file of files ?? []) {
        paths.push(`${id}/${folder.name}/${file.name}`)
      }
    }
    if (paths.length > 0) {
      await admin.storage.from('property-media').remove(paths)
    }
  } catch (error) {
    console.error('Admin delete: storage cleanup failed for', id, error)
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(id)

  if (deleteError) {
    console.error('Admin delete: auth user removal failed', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
