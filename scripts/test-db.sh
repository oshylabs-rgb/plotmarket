#!/usr/bin/env bash
# Applies supabase/migrations to a throwaway local Postgres and runs the SQL
# tests in supabase/tests against it. Needs the Postgres server binaries
# (initdb, pg_ctl) and psql; nothing touches a real Supabase project.
#
#   npm run test:db
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PORT="${PGTEST_PORT:-54329}"
WORK="$(mktemp -d)"

# initdb refuses to run as root.
RUN=()
if [ "$(id -u)" = 0 ]; then
  chown postgres "$WORK"
  RUN=(runuser -u postgres --)
fi

cleanup() {
  "${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

"${RUN[@]}" "$PGBIN/initdb" -D "$WORK/data" -A trust -U postgres >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -l "$WORK/log" \
  -o "-p $PORT -k $WORK -c listen_addresses=''" -w start >/dev/null

PSQL=(psql -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)

"${PSQL[@]}" -f "$ROOT/supabase/tests/supabase_stub.sql"

for migration in "$ROOT"/supabase/migrations/*.sql; do
  case "$(basename "$migration")" in
    0003_*)
      # Only the admin helper and policies. The first half creates the real
      # super admin account and refuses to run without a password.
      awk '/^-- 3\. Admin override/,/^-- 4\. Confirm/' "$migration" | "${PSQL[@]}"
      ;;
    *)
      "${PSQL[@]}" -f "$migration"
      ;;
  esac
done

status=0
for test in "$ROOT"/supabase/tests/*.test.sql; do
  echo "== $(basename "$test")"
  "${PSQL[@]}" -f "$test" || status=1
done
exit $status
