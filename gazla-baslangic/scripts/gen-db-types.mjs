#!/usr/bin/env node
/**
 * Veritabanı şemasından `supabase gen types typescript` çıktısının aynısını üretir
 * (`src/types/database.ts`).
 *
 * Supabase CLI'nin tip üreteci (postgres-meta → @supabase/postgrest-typegen 0.4, CLI varsayılanı
 * `detect-one-to-one-relationships`) pg_catalog'u okur, PostgREST kurallarıyla Tables / Views /
 * Functions / Enums / CompositeTypes çıkarır ve sonucu oxfmt (80 sütun, `;` yok) ile biçimler. Bu
 * betik aynı introspection sorgularını `psql` ile çalıştırır (her sorgu tek satır JSON), aynı
 * kuralları uygular ve biçimlenmiş metni doğrudan yazar. Docker, Supabase CLI ya da ek paket
 * gerekmez; yalnızca Node ve `psql`.
 *
 *   npm run gen:types                       # → src/types/database.ts
 *   node scripts/gen-db-types.mjs           # stdout
 *   node scripts/gen-db-types.mjs --out src/types/database.ts --schema public,graphql_public
 *   node scripts/gen-db-types.mjs --postgrest-version 13   # __InternalSupabase.PostgrestVersion
 *
 * Bağlantı: --db-url, yoksa DATABASE_URL, yoksa psql'in kendi ortam değişkenleri (PGHOST, PGPORT,
 * PGUSER, PGDATABASE, PGPASSWORD, PGSERVICE …). psql yolu PSQL ile değiştirilebilir.
 *
 * Gerçek Supabase projesinde aynı dosyayı CLI de üretir (supabase/README.md "Tipler").
 * `graphql_public` veritabanında yoksa (yerel PG16 test ortamı) Supabase'in standart iskeleti
 * (`graphql_public.graphql`) eklenir; böylece çıktı gerçek projedekiyle aynı kalır.
 *
 * Kurallar postgrest-typegen'den (MIT, github.com/supabase/sdk) aktarıldı:
 * - Insert: üretilmiş (generated) ya da GENERATED ALWAYS kimlik sütunu `?: never`; null olabilen,
 *   kimlik ya da varsayılanlı sütun opsiyonel. Update: hepsi opsiyonel.
 * - NOT NULL json/jsonb `NonNullable<Json>`; null olabilen sütun `T | null`.
 * - Relationships: aynı şemadaki FK'ler (ve görünümlerden türeyenler), `isOneToOne` FK sütunları
 *   bir PK/UNIQUE ile aynıysa.
 * - Functions: PostgREST'in çağırabildiği fonksiyonlar (tüm parametreler adlı, ya da tek adsız
 *   json/jsonb/text/satır tipi); varsayılanlı parametre opsiyonel; `returns table` → satır
 *   nesnesi, `setof` → dizi, tablo satırı dönen → o tablonun satırı + `SetofOptions`, void →
 *   undefined. Parametresiz: `Record<PropertyKey, never>`.
 * - PG tipleri: int2/4/8, float4/8, numeric → number; text, varchar, char, uuid, date, time(tz),
 *   timestamp(tz), interval, citext, bytea, vector → string; bool → boolean; json/jsonb → Json;
 *   dizi → T[]; enum → Database[…]["Enums"][…]; composite → Database[…]["CompositeTypes"][…];
 *   tanınmayan → unknown. Domain'ler taban tipine iner.
 * - Sıralama İngilizce collation ile ada göre (sütunlar ve parametreler de).
 * Görünüm sütunlarının boş olamazlık çıkarımı (postgrest-typegen 0.6) yok: görünüm sütunları
 * null olabilir (CLI'nin bugünkü davranışı).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';

const HELP = `Kullanım: node scripts/gen-db-types.mjs [seçenekler]

  -o, --out <dosya>              Çıktı dosyası (yoksa stdout)
  -s, --schema <a,b>             Şemalar (varsayılan: public,graphql_public)
      --db-url <url>             Bağlantı (yoksa DATABASE_URL, yoksa PG* ortam değişkenleri)
      --postgrest-version <v>    __InternalSupabase.PostgrestVersion yaz (ör. 13)
      --no-one-to-one            Relationships'te isOneToOne yazma (PostgREST 9 ve öncesi)
  -h, --help
`;

const { values: opts } = parseArgs({
  options: {
    out: { type: 'string', short: 'o' },
    schema: { type: 'string', short: 's', default: 'public,graphql_public' },
    'db-url': { type: 'string' },
    'postgrest-version': { type: 'string' },
    'no-one-to-one': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (opts.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

const PRINT_WIDTH = 80;
const DEFAULT_SCHEMA = 'public';
const collator = new Intl.Collator('en');
const cmp = (a, b) => collator.compare(a, b);

// json, jsonb, text: PostgREST'in tek adsız parametre olarak kabul ettiği tipler
const VALID_UNNAMED_FUNCTION_ARG_TYPES = new Set([114, 3802, 25]);
const VALID_FUNCTION_ARGS_MODE = new Set(['in', 'inout', 'variadic']);

// Introspection sorguları (postgrest-typegen introspection/sql/*.sql.ts) ------------------------

const sqlLiteral = (value) => {
  const text = String(value).replace(/'/g, "''");
  return text.includes('\\') ? `E'${text.replace(/\\/g, '\\\\')}'` : `'${text}'`;
};

/**
 * pg_node_tree metnini yalnızca targetList / resno / resorigtbl / resorigcol içeren JSON'a çeviren
 * replace zinciri (PostgREST şema önbelleği sorgusu; sıra önemli).
 */
const NODE_TREE_TO_JSON_REWRITES = [
  ['<>', '()'],
  [',', ''],
  ['\\{', ''],
  ['\\}', ''],
  [' :targetList ', ',"targetList":'],
  [' :resno ', ',"resno":'],
  [' :resorigtbl ', ',"resorigtbl":'],
  [' :resorigcol ', ',"resorigcol":'],
  ['{', '{ :'],
  ['((', '{(('],
  ['({', '{({'],
  [' :[^}{,]+', ',"":', 'regex'],
  [',"":}', '}'],
  [',"":,', ','],
  ['{(', '('],
  ['{,', '{'],
  ['(', '['],
  [')', ']'],
  [' ', ','],
];

function nodeTreeToJson(expression) {
  const opening = [...NODE_TREE_TO_JSON_REWRITES]
    .reverse()
    .map(([, , regex]) => (regex ? 'regexp_replace(' : 'replace('))
    .join('');
  const closing = NODE_TREE_TO_JSON_REWRITES.map(
    ([pattern, replacement, regex]) => `, ${sqlLiteral(pattern)}, ${sqlLiteral(replacement)}${regex ? ", 'g'" : ''})`,
  ).join('\n      ');
  return `    ${opening}\n      ${expression}\n      ${closing}`;
}

function introspectionQueries(schemaNames) {
  const filter = `IN (${schemaNames.map(sqlLiteral).join(',')})`;
  return {
    schemas: /* SQL */ `
select
  n.oid::int8 as id,
  n.nspname as name,
  u.rolname as owner
from
  pg_namespace n,
  pg_roles u
where
  n.nspowner = u.oid
  and n.nspname ${filter}
  and not pg_catalog.starts_with(n.nspname, 'pg_')
  and (
    pg_has_role(n.nspowner, 'USAGE')
    or has_schema_privilege(n.oid, 'CREATE, USAGE')
  )
  and not pg_catalog.starts_with(n.nspname, 'pg_temp_')
  and not pg_catalog.starts_with(n.nspname, 'pg_toast_temp_')
`,
    tables: /* SQL */ `
SELECT
  c.oid :: int8 AS id,
  nc.nspname AS schema,
  c.relname AS name
FROM
  pg_namespace nc
  JOIN pg_class c ON nc.oid = c.relnamespace
WHERE
  nc.nspname ${filter} AND
  c.relkind IN ('r', 'p')
  AND NOT pg_is_other_temp_schema(nc.oid)
  AND (
    pg_has_role(c.relowner, 'USAGE')
    OR has_table_privilege(
      c.oid,
      'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
    )
    OR has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
  )
`,
    foreignTables: /* SQL */ `
SELECT
  c.oid :: int8 AS id,
  n.nspname AS schema,
  c.relname AS name
FROM
  pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE
  n.nspname ${filter} AND
  c.relkind = 'f'
`,
    views: /* SQL */ `
SELECT
  c.oid :: int8 AS id,
  n.nspname AS schema,
  c.relname AS name,
  (pg_relation_is_updatable(c.oid, false) & 20) = 20 AS is_updatable,
  (pg_relation_is_updatable(c.oid, true) & 8) = 8 AS is_insert_enabled,
  (pg_relation_is_updatable(c.oid, true) & 4) = 4 AS is_update_enabled
FROM
  pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE
  n.nspname ${filter} AND
  c.relkind = 'v'
`,
    materializedViews: /* SQL */ `
select
  c.oid::int8 as id,
  n.nspname as schema,
  c.relname as name
from
  pg_class c
  join pg_namespace n on n.oid = c.relnamespace
where
  n.nspname ${filter} AND
  c.relkind = 'm'
`,
    columns: /* SQL */ `
SELECT
  c.oid :: int8 AS table_id,
  nc.nspname AS schema,
  c.relname AS table,
  a.attname AS name,
  CASE
    WHEN a.atthasdef THEN pg_get_expr(ad.adbin, ad.adrelid)
    ELSE NULL
  END AS default_value,
  COALESCE(bt.typname, t.typname) AS format,
  COALESCE(nbt.nspname, nt.nspname) AS type_schema,
  a.attidentity IN ('a', 'd') AS is_identity,
  CASE
    a.attidentity
    WHEN 'a' THEN 'ALWAYS'
    WHEN 'd' THEN 'BY DEFAULT'
    ELSE NULL
  END AS identity_generation,
  a.attgenerated IN ('s', 'v') AS is_generated,
  NOT (
    a.attnotnull
    OR t.typtype = 'd' AND t.typnotnull
  ) AS is_nullable,
  (
    c.relkind IN ('r', 'p')
    OR c.relkind IN ('v', 'f') AND (
      pg_column_is_updatable(c.oid, a.attnum, FALSE)
      OR EXISTS (
        SELECT 1 FROM pg_trigger tg
        WHERE tg.tgrelid = c.oid
          AND tg.tgtype & 64 <> 0
          AND tg.tgtype & 20 <> 0
          AND NOT tg.tgisinternal
      )
      OR EXISTS (
        SELECT 1 FROM pg_rewrite rw
        WHERE rw.ev_class = c.oid
          AND rw.is_instead
          AND rw.ev_type IN ('2', '3')
          AND rw.ev_qual :: text = '<>'
      )
    )
  ) AS is_updatable
FROM
  pg_attribute a
  LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid
  AND a.attnum = ad.adnum
  JOIN (
    pg_class c
    JOIN pg_namespace nc ON c.relnamespace = nc.oid
  ) ON a.attrelid = c.oid
  JOIN (
    pg_type t
    JOIN pg_namespace nt ON t.typnamespace = nt.oid
  ) ON a.atttypid = t.oid
  LEFT JOIN (
    pg_type bt
    JOIN pg_namespace nbt ON bt.typnamespace = nbt.oid
  ) ON t.typtype = 'd'
  AND t.typbasetype = bt.oid
WHERE
  nc.nspname ${filter} AND
  NOT pg_is_other_temp_schema(nc.oid)
  AND a.attnum > 0
  AND NOT a.attisdropped
  AND (c.relkind IN ('r', 'v', 'm', 'f', 'p'))
  AND (
    pg_has_role(c.relowner, 'USAGE')
    OR has_column_privilege(
      c.oid,
      a.attnum,
      'SELECT, INSERT, UPDATE, REFERENCES'
    )
  )
`,
    // PostgREST SchemaCache.hs (allM2OandO2ORels)
    tableRelationships: /* SQL */ `
WITH
pks_uniques_cols AS (
  SELECT
    connamespace,
    conrelid,
    jsonb_agg(column_info.cols) as cols
  FROM pg_constraint
  JOIN lateral (
    SELECT array_agg(cols.attname order by cols.attnum) as cols
    FROM ( select unnest(conkey) as col) _
    JOIN pg_attribute cols on cols.attrelid = conrelid and cols.attnum = col
  ) column_info ON TRUE
  WHERE
    contype IN ('p', 'u') and
    connamespace::regnamespace::text <> 'pg_catalog'
    and connamespace::regnamespace::text ${filter}
  GROUP BY connamespace, conrelid
)
SELECT
  traint.conname AS foreign_key_name,
  ns1.nspname AS schema,
  tab.relname AS relation,
  column_info.cols AS columns,
  ns2.nspname AS referenced_schema,
  other.relname AS referenced_relation,
  column_info.refs AS referenced_columns,
  (column_info.cols IN (SELECT * FROM jsonb_array_elements(pks_uqs.cols))) AS is_one_to_one
FROM pg_constraint traint
JOIN LATERAL (
  SELECT
    jsonb_agg(cols.attname order by ord) AS cols,
    jsonb_agg(refs.attname order by ord) AS refs
  FROM unnest(traint.conkey, traint.confkey) WITH ORDINALITY AS _(col, ref, ord)
  JOIN pg_attribute cols ON cols.attrelid = traint.conrelid AND cols.attnum = col
  JOIN pg_attribute refs ON refs.attrelid = traint.confrelid AND refs.attnum = ref
  WHERE traint.connamespace::regnamespace::text ${filter}
) AS column_info ON TRUE
JOIN pg_namespace ns1 ON ns1.oid = traint.connamespace
JOIN pg_class tab ON tab.oid = traint.conrelid
JOIN pg_class other ON other.oid = traint.confrelid
JOIN pg_namespace ns2 ON ns2.oid = other.relnamespace
LEFT JOIN pks_uniques_cols pks_uqs ON pks_uqs.connamespace = traint.connamespace AND pks_uqs.conrelid = traint.conrelid
WHERE traint.contype = 'f'
AND traint.conparentid = 0
and ns1.nspname ${filter}
`,
    // PostgREST SchemaCache.hs (allViewsKeyDependencies): görünüm sütunlarının taban tablo
    // anahtarlarına eşlenmesi; görünümlü ilişkiler bundan türer.
    viewsKeyDependencies: /* SQL */ `
with recursive
pks_fks as (
  select
    contype::text as contype,
    conname,
    array_length(conkey, 1) as ncol,
    conrelid as resorigtbl,
    col as resorigcol,
    ord
  from pg_constraint
  left join lateral unnest(conkey) with ordinality as _(col, ord) on true
  where contype IN ('p', 'f')
  union
  select
    concat(contype, '_ref') as contype,
    conname,
    array_length(confkey, 1) as ncol,
    confrelid,
    col,
    ord
  from pg_constraint
  left join lateral unnest(confkey) with ordinality as _(col, ord) on true
  where contype='f'
  and connamespace::regnamespace::text ${filter}
),
views as (
  select
    c.oid       as view_id,
    n.nspname   as view_schema,
    c.relname   as view_name,
    r.ev_action as view_definition
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_rewrite r on r.ev_class = c.oid
  where c.relkind in ('v', 'm')
    and n.nspname ${filter}
),
transform_json as (
  select
    view_id, view_schema, view_name,
${nodeTreeToJson('view_definition::text')}::json as view_definition
  from views
),
target_entries as(
  select
    view_id, view_schema, view_name,
    json_array_elements(view_definition->0->'targetList') as entry
  from transform_json
),
results as(
  select
    view_id, view_schema, view_name,
    (entry->>'resno')::int as view_column,
    (entry->>'resorigtbl')::oid as resorigtbl,
    (entry->>'resorigcol')::int as resorigcol
  from target_entries
),
recursion(view_id, view_schema, view_name, view_column, resorigtbl, resorigcol, is_cycle, path) as(
  select
    r.*,
    false,
    ARRAY[resorigtbl]
  from results r
  where view_schema ${filter}
  union all
  select
    view.view_id,
    view.view_schema,
    view.view_name,
    view.view_column,
    tab.resorigtbl,
    tab.resorigcol,
    tab.resorigtbl = ANY(path),
    path || tab.resorigtbl
  from recursion view
  join results tab on view.resorigtbl=tab.view_id and view.resorigcol=tab.view_column
  where not is_cycle
),
repeated_references as(
  select
    view_id,
    view_schema,
    view_name,
    resorigtbl,
    resorigcol,
    array_agg(attname) as view_columns
  from recursion
  join pg_attribute vcol on vcol.attrelid = view_id and vcol.attnum = view_column
  group by
    view_id,
    view_schema,
    view_name,
    resorigtbl,
    resorigcol
)
select
  sch.nspname as table_schema,
  tbl.relname as table_name,
  rep.view_schema,
  rep.view_name,
  pks_fks.conname as constraint_name,
  pks_fks.contype as constraint_type,
  jsonb_agg(
    jsonb_build_object('table_column', col.attname, 'view_columns', view_columns) order by pks_fks.ord
  ) as column_dependencies
from repeated_references rep
join pks_fks using (resorigtbl, resorigcol)
join pg_class tbl on tbl.oid = rep.resorigtbl
join pg_attribute col on col.attrelid = tbl.oid and col.attnum = rep.resorigcol
join pg_namespace sch on sch.oid = tbl.relnamespace
group by sch.nspname, tbl.relname,  rep.view_schema, rep.view_name, pks_fks.conname, pks_fks.contype, pks_fks.ncol
having ncol = array_length(array_agg(row(col.attname, view_columns) order by pks_fks.ord), 1)
`,
    functions: /* SQL */ `
with functions as (
  select
    p.*,
    coalesce(
      p.proargmodes,
      array_fill('i'::text, array[cardinality(coalesce(p.proallargtypes, p.proargtypes))])
    ) as arg_modes,
    coalesce(
      p.proargnames,
      array_fill(''::text, array[cardinality(coalesce(p.proallargtypes, p.proargtypes))])
    ) as arg_names,
    coalesce(p.proallargtypes, p.proargtypes) as arg_types,
    array_cat(
      array_fill(false, array[pronargs - pronargdefaults]),
      array_fill(true, array[pronargdefaults])) as arg_has_defaults
  from
    pg_proc as p
    join pg_namespace n on p.pronamespace = n.oid
  where
    n.nspname ${filter} AND
    p.prokind = 'f'
)
select
  f.oid::int8 as id,
  n.nspname as schema,
  f.proname as name,
  coalesce(f_args.args, '[]') as args,
  pg_get_function_arguments(f.oid) as argument_types,
  pg_get_function_identity_arguments(f.oid) as identity_argument_types,
  f.prorettype::int8 as return_type_id,
  pg_get_function_result(f.oid) as return_type,
  nullif(rt.typrelid::int8, 0) as return_type_relation_id,
  f.proretset as is_set_returning_function,
  case
    when f.proretset then nullif(f.prorows, 0)
    else null
  end as prorows
from
  functions f
  left join pg_namespace n on f.pronamespace = n.oid
  left join pg_type rt on rt.oid = f.prorettype
  left join (
    select
      oid,
      jsonb_agg(jsonb_build_object(
        'mode', t2.mode,
        'name', name,
        'type_id', type_id,
        'has_default', has_default
      )) as args
    from
      (
        select
          oid,
          unnest(arg_modes) as mode,
          unnest(arg_names) as name,
          unnest(arg_types)::int8 as type_id,
          unnest(arg_has_defaults) as has_default
        from
          functions
      ) as t1,
      lateral (
        select
          case
            when t1.mode = 'i' then 'in'
            when t1.mode = 'o' then 'out'
            when t1.mode = 'b' then 'inout'
            when t1.mode = 'v' then 'variadic'
            else 'table'
          end as mode
      ) as t2
    group by
      t1.oid
  ) f_args on f_args.oid = f.oid
`,
    // Tüm şemaların tipleri (sütun ve parametre tiplerini çözmek için)
    types: /* SQL */ `
select
  t.oid::int8 as id,
  t.typname as name,
  n.nspname as schema,
  format_type (t.oid, null) as format,
  coalesce(t_enums.enums, '[]') as enums,
  coalesce(t_attributes.attributes, '[]') as attributes,
  nullif(t.typrelid::int8, 0) as type_relation_id
from
  pg_type t
  left join pg_namespace n on n.oid = t.typnamespace
  left join (
    select
      enumtypid,
      jsonb_agg(enumlabel order by enumsortorder) as enums
    from
      pg_enum
    group by
      enumtypid
  ) as t_enums on t_enums.enumtypid = t.oid
  left join (
    select
      oid,
      jsonb_agg(
        jsonb_build_object('name', a.attname, 'type_id', a.atttypid::int8)
        order by a.attnum asc
      ) as attributes
    from
      pg_class c
      join pg_attribute a on a.attrelid = c.oid
    where
      c.relkind = 'c' and not a.attisdropped
    group by
      c.oid
  ) as t_attributes on t_attributes.oid = t.typrelid
  where
      (
        t.typrelid = 0
        or (
          select
            c.relkind in ('c', 'r', 'v', 'm', 'p', 'f')
          from
            pg_class c
          where
            c.oid = t.typrelid
        )
      )
`,
  };
}

/** Sorguları tek psql oturumunda çalıştırır; her sorgu tek satırlık jsonb dizisi döner. */
function runQueries(queries) {
  const names = Object.keys(queries);
  const input = names
    .map((name) => `select coalesce(jsonb_agg(q), '[]'::jsonb)::text from (${queries[name]}) q;`)
    .join('\n');
  const psql = process.env.PSQL || 'psql';
  const args = ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-f', '-'];
  const dbUrl = opts['db-url'] ?? process.env.DATABASE_URL;
  if (dbUrl) args.unshift('-d', dbUrl);
  const result = spawnSync(psql, args, {
    input,
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    env: { ...process.env, PGCLIENTENCODING: 'UTF8' },
  });
  if (result.error) {
    fail(`psql çalıştırılamadı (${psql}): ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`psql hata verdi (çıkış ${result.status}):\n${result.stderr.trim()}`);
  }
  const lines = result.stdout.split('\n').filter((line) => line.trim() !== '');
  if (lines.length !== names.length) {
    fail(`psql beklenmeyen çıktı verdi (${lines.length} satır, ${names.length} bekleniyordu)`);
  }
  return Object.fromEntries(names.map((name, i) => [name, JSON.parse(lines[i])]));
}

function fail(message) {
  process.stderr.write(`gen-db-types: ${message}\n`);
  process.exit(1);
}

// Görünümlü ilişkiler (postgrest-typegen introspection/relationships.ts) ------------------------

function expandViewRelationships(tableRelationships, viewsKeyDependencies) {
  const cartesianProduct = (lists) =>
    lists.reduce(
      (combinations, entries) =>
        combinations.flatMap((combination) => entries.map((entry) => [...combination, entry])),
      [[]],
    );
  const expandKeyDepCols = (colDeps) =>
    cartesianProduct(colDeps.map((cd) => cd.view_columns)).map((viewColumns) => ({ viewColumns }));

  return tableRelationships.flatMap((r) => {
    const viewToTable = viewsKeyDependencies.filter(
      (d) =>
        d.table_schema === r.schema &&
        d.table_name === r.relation &&
        d.constraint_name === r.foreign_key_name &&
        d.constraint_type === 'f',
    );
    const tableToView = viewsKeyDependencies.filter(
      (d) =>
        d.table_schema === r.referenced_schema &&
        d.table_name === r.referenced_relation &&
        d.constraint_name === r.foreign_key_name &&
        d.constraint_type === 'f_ref',
    );
    return [
      ...viewToTable.flatMap((d) =>
        expandKeyDepCols(d.column_dependencies).map(({ viewColumns }) => ({
          ...r,
          schema: d.view_schema,
          relation: d.view_name,
          columns: viewColumns,
        })),
      ),
      ...tableToView.flatMap((d) =>
        expandKeyDepCols(d.column_dependencies).map(({ viewColumns }) => ({
          ...r,
          referenced_schema: d.view_schema,
          referenced_relation: d.view_name,
          referenced_columns: viewColumns,
        })),
      ),
      ...viewToTable.flatMap((vt) =>
        expandKeyDepCols(vt.column_dependencies).flatMap(({ viewColumns }) =>
          tableToView.flatMap((tv) =>
            expandKeyDepCols(tv.column_dependencies).map(({ viewColumns: referencedViewColumns }) => ({
              ...r,
              schema: vt.view_schema,
              relation: vt.view_name,
              columns: viewColumns,
              referenced_schema: tv.view_schema,
              referenced_relation: tv.view_name,
              referenced_columns: referencedViewColumns,
            })),
          ),
        ),
      ),
    ];
  });
}

// Supabase'teki graphql_public iskeleti (pg_graphql) ------------------------------------------

const GRAPHQL_PUBLIC_FALLBACK = {
  schema: { id: -1, name: 'graphql_public', owner: 'supabase_admin' },
  functions: [
    {
      id: -1,
      schema: 'graphql_public',
      name: 'graphql',
      args: [
        { mode: 'in', name: 'operationName', type_id: 25, has_default: true },
        { mode: 'in', name: 'query', type_id: 25, has_default: true },
        { mode: 'in', name: 'variables', type_id: 3802, has_default: true },
        { mode: 'in', name: 'extensions', type_id: 3802, has_default: true },
      ],
      argument_types:
        '"operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb',
      identity_argument_types: '"operationName" text, query text, variables jsonb, extensions jsonb',
      return_type_id: 3802,
      return_type: 'jsonb',
      return_type_relation_id: null,
      is_set_returning_function: false,
      prorows: null,
    },
  ],
};

// Introspection → sıralı metadata (postgrest-typegen introspect + sortGeneratorMetadata) --------

function introspect(requestedSchemas) {
  const rows = runQueries(introspectionQueries(requestedSchemas));
  const schemas = rows.schemas;
  const functions = rows.functions.filter(
    ({ return_type }) => !['trigger', 'event_trigger'].includes(return_type),
  );

  for (const name of requestedSchemas) {
    if (schemas.some((s) => s.name === name)) continue;
    if (name === GRAPHQL_PUBLIC_FALLBACK.schema.name) {
      schemas.push(GRAPHQL_PUBLIC_FALLBACK.schema);
      functions.push(...GRAPHQL_PUBLIC_FALLBACK.functions);
      process.stderr.write('gen-db-types: graphql_public veritabanında yok; Supabase iskeleti eklendi\n');
    } else {
      process.stderr.write(`gen-db-types: "${name}" şeması bulunamadı, atlandı\n`);
    }
  }

  const bySchemaName = (a, b) => cmp(a.schema, b.schema) || cmp(a.name, b.name) || a.id - b.id;
  const compareColumns = (a, b) => cmp(JSON.stringify(a), JSON.stringify(b));
  const byRelationship = (a, b) =>
    cmp(a.foreign_key_name, b.foreign_key_name) ||
    cmp(a.referenced_relation, b.referenced_relation) ||
    compareColumns(a.referenced_columns, b.referenced_columns) ||
    cmp(a.referenced_schema, b.referenced_schema) ||
    cmp(a.schema, b.schema) ||
    cmp(a.relation, b.relation) ||
    compareColumns(a.columns, b.columns);

  const relationships = [
    ...rows.tableRelationships,
    ...expandViewRelationships(rows.tableRelationships, rows.viewsKeyDependencies),
  ];

  return {
    schemas: [...schemas].sort((a, b) => cmp(a.name, b.name) || a.id - b.id),
    tables: [...rows.tables].sort(bySchemaName),
    foreignTables: [...rows.foreignTables].sort(bySchemaName),
    views: [...rows.views].sort(bySchemaName),
    materializedViews: [...rows.materializedViews].sort(bySchemaName),
    columns: [...rows.columns].sort(
      (a, b) => cmp(a.schema, b.schema) || cmp(a.table, b.table) || cmp(a.name, b.name),
    ),
    relationships: relationships.sort(byRelationship),
    functions: functions
      .sort(
        (a, b) =>
          cmp(a.schema, b.schema) ||
          cmp(a.name, b.name) ||
          cmp(a.identity_argument_types, b.identity_argument_types) ||
          a.id - b.id,
      )
      .map((fn) => ({ ...fn, args: [...fn.args].sort((a, b) => cmp(a.name, b.name)) })),
    types: [...rows.types].sort(bySchemaName),
  };
}

// Tip ağacı ----------------------------------------------------------------------------------
// raw: bölünmeyen metin · union · array · object (expanded: kaynakta `{` sonrası satır sonu,
// biçimleyici açık tutar) · tuple · inter (A & B) · generic (Ad<A, B>) · mapped ([_ in never])

const raw = (text) => ({ k: 'raw', text });
const lit = (value) => raw(JSON.stringify(value));
const NULL = raw('null');
const union = (types) => {
  const flatTypes = types.flatMap((t) => (t.k === 'union' ? t.types : [t]));
  return flatTypes.length === 1 ? flatTypes[0] : { k: 'union', types: flatTypes };
};
const array = (elem) => ({ k: 'array', elem });
const object = (members, expanded = true) => ({ k: 'object', members, expanded });
const member = (key, type, optional = false) => ({ key, type, optional });
const tuple = (elems) => ({ k: 'tuple', elems });
const inter = (types) => ({ k: 'inter', types });
const generic = (name, args) => ({ k: 'generic', name, args });
const NEVER_MAPPED = { k: 'mapped' };
const isRaw = (node, text) => node.k === 'raw' && node.text === text;

// Tipler ve satırlar (postgrest-typegen generation/typescript.ts) ------------------------------

function buildDatabase(meta, { detectOneToOneRelationships, postgrestVersion }) {
  const { schemas, tables, foreignTables, views, materializedViews, columns, relationships, functions, types } =
    meta;
  const schemaNames = new Set(schemas.map(({ name }) => name));
  const bySchema = Object.fromEntries(
    schemas.map((s) => [s.name, { tables: [], views: [], functions: [], enums: [], compositeTypes: [] }]),
  );

  const columnsByTableId = new Map();
  const tablesNamesByTableId = new Map();
  for (const relation of [...tables, ...foreignTables, ...views, ...materializedViews]) {
    columnsByTableId.set(relation.id, []);
    tablesNamesByTableId.set(relation.id, relation.name);
  }
  for (const column of columns) columnsByTableId.get(column.table_id)?.push(column);
  const getColumns = (id) => columnsByTableId.get(id) ?? [];

  const typesById = new Map();
  const relationTypeByIds = new Map();
  for (const type of types) {
    typesById.set(type.id, type);
    if (type.type_relation_id) relationTypeByIds.set(type.id, type);
    if (type.enums.length > 0) bySchema[type.schema]?.enums.push(type);
    if (type.attributes.length > 0) bySchema[type.schema]?.compositeTypes.push(type);
  }

  const relationshipsOf = (relation) =>
    relationships.filter(
      (r) =>
        r.schema === relation.schema &&
        r.relation === relation.name &&
        r.referenced_schema === relation.schema,
    );

  for (const table of [...tables, ...foreignTables]) {
    bySchema[table.schema]?.tables.push({ table, relationships: relationshipsOf(table) });
  }
  for (const view of views) {
    bySchema[view.schema]?.views.push({ view, relationships: relationshipsOf(view) });
  }
  for (const view of materializedViews) {
    bySchema[view.schema]?.views.push({
      view: { ...view, is_updatable: false, is_insert_enabled: false, is_update_enabled: false },
      relationships: relationshipsOf(view),
    });
  }

  const getTableNameFromRelationId = (relationId, returnTypeId) => {
    if (!relationId) return null;
    const tableName = tablesNamesByTableId.get(relationId);
    if (tableName) return tableName;
    // composite tip: alt alanları seçilebilsin diye tip adı ilişki adı sayılır
    return relationTypeByIds.get(returnTypeId)?.name ?? null;
  };

  // PostgREST'in /rpc altında çağırabildiği fonksiyonlar
  for (const fn of functions) {
    const target = bySchema[fn.schema];
    if (!target) continue;
    const inArgs = fn.args.filter(({ mode }) => VALID_FUNCTION_ARGS_MODE.has(mode));
    const soleInArg = inArgs.length === 1 ? inArgs[0] : undefined;
    if (
      inArgs.length === 0 ||
      !inArgs.some(({ name }) => name === '') ||
      inArgs.every((arg) => arg.name !== '' || (arg.has_default && VALID_UNNAMED_FUNCTION_ARG_TYPES.has(arg.type_id))) ||
      (soleInArg &&
        soleInArg.name === '' &&
        (VALID_UNNAMED_FUNCTION_ARG_TYPES.has(soleInArg.type_id) || relationTypeByIds.has(soleInArg.type_id)))
    ) {
      target.functions.push({ fn, inArgs });
    }
  }

  for (const s of Object.values(bySchema)) {
    s.tables.sort((a, b) => cmp(a.table.name, b.table.name));
    s.views.sort((a, b) => cmp(a.view.name, b.view.name));
    s.enums.sort((a, b) => cmp(a.name, b.name));
    s.compositeTypes.sort((a, b) => cmp(a.name, b.name));
    s.functions.sort((a, b) => cmp(a.fn.name, b.fn.name));
  }

  const ref = (schema, kind, name) => `Database[${JSON.stringify(schema)}][${JSON.stringify(kind)}][${JSON.stringify(name)}]`;

  const findRelationReference = (pgType, preferredSchema) => {
    const kinds = [
      ['Tables', tables],
      ['Tables', foreignTables],
      ['Views', views],
      ['Views', materializedViews],
    ];
    const find = (matches) => {
      for (const [kind, relations] of kinds) {
        const relation = relations.find(matches);
        if (relation) return { kind, relation };
      }
      return undefined;
    };
    const match =
      find(({ name, schema }) => name === pgType && schema === preferredSchema) ??
      find(({ name }) => name === pgType);
    if (!match || !schemaNames.has(match.relation.schema)) return undefined;
    return ref(match.relation.schema, match.kind, match.relation.name);
  };

  const STRING_TYPES = new Set([
    'bytea', 'bpchar', 'varchar', 'date', 'text', 'citext', 'time', 'timetz', 'timestamp',
    'timestamptz', 'uuid', 'vector', 'interval',
  ]);
  const NUMBER_TYPES = new Set(['int2', 'int4', 'int8', 'float4', 'float8', 'numeric']);

  const pgTypeToTsType = (schemaName, pgType, typeSchema) => {
    if (pgType === 'bool') return raw('boolean');
    if (NUMBER_TYPES.has(pgType)) return raw('number');
    if (STRING_TYPES.has(pgType)) return raw('string');
    if (pgType === 'json' || pgType === 'jsonb') return raw('Json');
    if (pgType === 'void') return raw('undefined');
    if (pgType === 'record') return raw('Record<string, unknown>');
    if (pgType.startsWith('_')) return array(pgTypeToTsType(schemaName, pgType.substring(1), typeSchema));

    const preferredSchema = typeSchema ?? schemaName;
    const enumTypes = types.filter((t) => t.name === pgType && t.enums.length > 0);
    const enumType = enumTypes.find((t) => t.schema === preferredSchema) ?? enumTypes[0];
    if (enumType) {
      if (schemaNames.has(enumType.schema)) return raw(ref(enumType.schema, 'Enums', enumType.name));
      return union(enumType.enums.map(lit));
    }
    const compositeTypes = types.filter((t) => t.name === pgType && t.attributes.length > 0);
    const compositeType = compositeTypes.find((t) => t.schema === preferredSchema) ?? compositeTypes[0];
    if (compositeType) {
      if (schemaNames.has(compositeType.schema)) {
        return raw(ref(compositeType.schema, 'CompositeTypes', compositeType.name));
      }
      return raw('unknown');
    }
    const relationReference = findRelationReference(pgType, preferredSchema);
    return relationReference ? raw(`${relationReference}["Row"]`) : raw('unknown');
  };

  const typeIdToTsType = (schemaName, typeId) => {
    const type = typesById.get(typeId);
    return type ? pgTypeToTsType(schemaName, type.name, type.schema) : raw('unknown');
  };

  const nullable = (node, isNullable) => {
    // Json null içerir: NOT NULL json/jsonb sütunu NonNullable ile daraltılır
    if (isRaw(node, 'Json') && !isNullable) return raw('NonNullable<Json>');
    if (isRaw(node, 'unknown') || isRaw(node, 'any') || !isNullable) return node;
    return union([node, NULL]);
  };

  const columnMember = (schemaName, column, { isNullable = column.is_nullable, optional = false } = {}) =>
    member(column.name, nullable(pgTypeToTsType(schemaName, column.format, column.type_schema), isNullable), optional);

  const isComputedFieldOf = (fn, inArgs, relation) => {
    const soleInArg = inArgs.length === 1 ? inArgs[0] : undefined;
    if (soleInArg) {
      const argType = relationTypeByIds.get(soleInArg.type_id);
      if (argType) return argType.type_relation_id === relation.id;
    }
    return fn.argument_types === relation.name;
  };

  const computedFieldsOf = (schemaFunctions, relation) => {
    const columnNames = new Set(getColumns(relation.id).map((c) => c.name));
    const seen = new Set();
    return schemaFunctions.filter(({ fn, inArgs }) => {
      if (!isComputedFieldOf(fn, inArgs, relation) || columnNames.has(fn.name) || seen.has(fn.name)) return false;
      seen.add(fn.name);
      return true;
    });
  };

  const getFunctionReturnType = (schemaName, fn) => {
    // 1: `returns table (...)` → satır nesnesi (sütunlar null'suz, CLI'deki gibi)
    const tableArgs = fn.args.filter(({ mode }) => mode === 'table');
    if (tableArgs.length > 0) {
      return object(tableArgs.map(({ name, type_id }) => member(name, typeIdToTsType(schemaName, type_id))));
    }
    // 2: bu şemadaki bir tablonun/görünümün satırı
    const s = bySchema[schemaName];
    const relation =
      s?.tables.find(({ table }) => table.id === fn.return_type_relation_id)?.table ??
      s?.views.find(({ view }) => view.id === fn.return_type_relation_id)?.view;
    if (relation) {
      return object(getColumns(relation.id).map((column) => columnMember(schemaName, column)));
    }
    // 3: taban / dizi / composite / enum tipi
    return typeIdToTsType(schemaName, fn.return_type_id);
  };

  const getFunctionTsReturnType = (fn, returnType, isError) => {
    let setofOptions = null;
    const returnTableName = getTableNameFromRelationId(fn.return_type_relation_id, fn.return_type_id);
    const returnsSetOfTable = fn.is_set_returning_function && fn.return_type_relation_id !== null;
    const returnsMultipleRows = fn.prorows !== null && fn.prorows > 1;
    if (returnTableName) {
      setofOptions = { from: '*', to: returnTableName, isOneToOne: !returnsMultipleRows, isSetofReturn: fn.is_set_returning_function };
    }
    const soleArg = fn.args.length === 1 ? fn.args[0] : undefined;
    const relationType = soleArg && relationTypeByIds.get(soleArg.type_id);
    if (relationType) {
      if (returnsSetOfTable && returnTableName) {
        setofOptions = { from: relationType.format, to: returnTableName, isOneToOne: !returnsMultipleRows, isSetofReturn: true };
      } else if (returnTableName && !returnsSetOfTable) {
        setofOptions = { from: relationType.format, to: returnTableName, isOneToOne: true, isSetofReturn: false };
      }
    }
    // ROWS 1 tahmini yalnızca SetofOptions varken diziyi teke indirir
    const collapsibleSingleRow = !returnsMultipleRows && returnTableName !== null;
    const isArray = !isError && fn.is_set_returning_function && !collapsibleSingleRow;
    const members = [member('Returns', isArray ? array(returnType) : returnType)];
    if (setofOptions) {
      members.push(
        member(
          'SetofOptions',
          object([
            member('from', lit(setofOptions.from)),
            member('to', lit(setofOptions.to)),
            member('isOneToOne', raw(String(setofOptions.isOneToOne))),
            member('isSetofReturn', raw(String(setofOptions.isSetofReturn))),
          ]),
        ),
      );
    }
    return members;
  };

  const getArgTsType = (schemaName, { name, type_id }) => {
    const type = typesById.get(type_id);
    if (!type) return raw('unknown');
    const tsType = pgTypeToTsType(schemaName, type.name, type.schema);
    if (name === '') return tsType;
    // Adlı satır tipi parametresi hesaplanan alanlar olmadan
    const relationReference = findRelationReference(type.name, type.schema);
    if (relationReference && isRaw(tsType, `${relationReference}["Row"]`)) {
      return generic('Omit', [tsType, raw(`${relationReference}["ComputedFields"]`)]);
    }
    return tsType;
  };

  const getConflictError = (schemaName, fns, fn, inArgs) => {
    if (fns.length <= 1) return null;
    const soleInArg = inArgs.length === 1 ? inArgs[0] : undefined;
    if (inArgs.length === 0) {
      const conflicting = fns.find(
        ({ fn: other, inArgs: otherInArgs }) =>
          other !== fn && otherInArgs.length === 1 && otherInArgs[0].name === '' && otherInArgs[0].has_default,
      );
      if (conflicting) {
        const returnTypeName = typesById.get(conflicting.fn.return_type_id)?.name || 'unknown';
        return `Could not choose the best candidate function between: ${schemaName}.${fn.name}(), ${schemaName}.${fn.name}( => ${returnTypeName}). Try renaming the parameters or the function itself in the database so function overloading can be resolved`;
      }
    }
    if (soleInArg && soleInArg.name !== '') {
      const conflicting = fns.filter(
        ({ fn: other, inArgs: otherInArgs }) =>
          other !== fn &&
          otherInArgs.length === 1 &&
          otherInArgs[0].name === soleInArg.name &&
          otherInArgs[0].type_id !== soleInArg.type_id,
      );
      if (conflicting.length > 0) {
        const list = [{ fn, inArgs }, ...conflicting]
          .sort((a, b) => (a.inArgs[0]?.type_id || 0) - (b.inArgs[0]?.type_id || 0))
          .map(
            (f) =>
              `${schemaName}.${fn.name}(${f.inArgs
                .map((a) => `${a.name || ''} => ${typesById.get(a.type_id)?.name || 'unknown'}`)
                .join(', ')})`,
          )
          .join(', ');
        return `Could not choose the best candidate function between: ${list}. Try renaming the parameters or the function itself in the database so function overloading can be resolved`;
      }
    }
    return null;
  };

  const hasTableRowError = (fn, inArgs) => {
    const soleInArg = inArgs.length === 1 ? inArgs[0] : undefined;
    return Boolean(
      soleInArg &&
        soleInArg.name === '' &&
        relationTypeByIds.has(soleInArg.type_id) &&
        !getTableNameFromRelationId(fn.return_type_relation_id, fn.return_type_id),
    );
  };

  const functionSignatures = (schemaName, fns) =>
    union(
      fns.map(({ fn, inArgs }) => {
        const args =
          inArgs.length > 0
            ? object(
                inArgs.map((arg) => member(arg.name, getArgTsType(schemaName, arg), Boolean(arg.has_default))),
                false,
              )
            : raw('Record<PropertyKey, never>');
        let returnType = getFunctionReturnType(schemaName, fn);
        let isError = false;
        const conflictError = getConflictError(schemaName, fns, fn, inArgs);
        const errorMessage =
          conflictError ??
          (hasTableRowError(fn, inArgs)
            ? `the function ${schemaName}.${fn.name} with parameter or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache`
            : null);
        if (errorMessage) {
          returnType = inter([object([member('error', raw('true'))], false), lit(errorMessage)]);
          isError = true;
        }
        return object([member('Args', args), ...getFunctionTsReturnType(fn, returnType, isError)], false);
      }),
    );

  const relationshipNode = (r) =>
    object([
      member('foreignKeyName', lit(r.foreign_key_name)),
      member('columns', tuple(r.columns.map(lit))),
      ...(detectOneToOneRelationships ? [member('isOneToOne', raw(String(r.is_one_to_one)))] : []),
      member('referencedRelation', lit(r.referenced_relation)),
      member('referencedColumns', tuple(r.referenced_columns.map(lit))),
    ]);

  const computedFieldMembers = (schemaName, computedFields) =>
    computedFields.map(({ fn }) => member(fn.name, nullable(getFunctionReturnType(schemaName, fn), true)));
  const computedFieldsType = (computedFields) =>
    computedFields.length === 0 ? raw('never') : union(computedFields.map(({ fn }) => lit(fn.name)));

  const schemaNode = (schema) => {
    const s = bySchema[schema.name];
    const name = schema.name;

    const tablesNode =
      s.tables.length === 0
        ? NEVER_MAPPED
        : object(
            s.tables.map(({ table, relationships: rels }) => {
              const computedFields = computedFieldsOf(s.functions, table);
              const cols = getColumns(table.id);
              const neverWritable = (c) => c.identity_generation === 'ALWAYS' || c.is_generated;
              return member(
                table.name,
                object([
                  member('Row', object([...cols.map((c) => columnMember(name, c)), ...computedFieldMembers(name, computedFields)])),
                  member('ComputedFields', computedFieldsType(computedFields)),
                  member(
                    'Insert',
                    object(
                      cols.map((c) =>
                        neverWritable(c)
                          ? member(c.name, raw('never'), true)
                          : columnMember(name, c, {
                              optional: c.is_nullable || c.is_identity || c.default_value !== null,
                            }),
                      ),
                    ),
                  ),
                  member(
                    'Update',
                    object(
                      cols.map((c) =>
                        neverWritable(c) ? member(c.name, raw('never'), true) : columnMember(name, c, { optional: true }),
                      ),
                    ),
                  ),
                  member('Relationships', tuple(rels.map(relationshipNode))),
                ]),
              );
            }),
          );

    const viewsNode =
      s.views.length === 0
        ? NEVER_MAPPED
        : object(
            s.views.map(({ view, relationships: rels }) => {
              const computedFields = computedFieldsOf(s.functions, view);
              const cols = getColumns(view.id);
              const writable = () =>
                object(
                  cols.map((c) =>
                    c.is_updatable
                      ? columnMember(name, c, { isNullable: true, optional: true })
                      : member(c.name, raw('never'), true),
                  ),
                );
              return member(
                view.name,
                object([
                  member('Row', object([...cols.map((c) => columnMember(name, c)), ...computedFieldMembers(name, computedFields)])),
                  member('ComputedFields', computedFieldsType(computedFields)),
                  ...((view.is_insert_enabled ?? view.is_updatable) ? [member('Insert', writable())] : []),
                  ...((view.is_update_enabled ?? view.is_updatable) ? [member('Update', writable())] : []),
                  member('Relationships', tuple(rels.map(relationshipNode))),
                ]),
              );
            }),
          );

    const groups = new Map();
    for (const entry of s.functions) {
      if (!groups.has(entry.fn.name)) groups.set(entry.fn.name, []);
      groups.get(entry.fn.name).push(entry);
    }
    for (const fns of groups.values()) {
      fns.sort((a, b) => cmp(a.fn.argument_types, b.fn.argument_types) || cmp(a.fn.return_type, b.fn.return_type));
    }
    const functionsNode =
      groups.size === 0
        ? NEVER_MAPPED
        : object([...groups].map(([fnName, fns]) => member(fnName, functionSignatures(name, fns))));

    const enumsNode =
      s.enums.length === 0 ? NEVER_MAPPED : object(s.enums.map((e) => member(e.name, union(e.enums.map(lit)))));

    const compositeTypesNode =
      s.compositeTypes.length === 0
        ? NEVER_MAPPED
        : object(
            s.compositeTypes.map(({ name: typeName, attributes }) =>
              member(
                typeName,
                object(
                  attributes.map((attr) => {
                    const type = typesById.get(attr.type_id);
                    return member(
                      attr.name,
                      type ? nullable(pgTypeToTsType(name, type.name, type.schema), true) : raw('unknown'),
                    );
                  }),
                ),
              ),
            ),
          );

    return member(
      name,
      object([
        member('Tables', tablesNode),
        member('Views', viewsNode),
        member('Functions', functionsNode),
        member('Enums', enumsNode),
        member('CompositeTypes', compositeTypesNode),
      ]),
    );
  };

  const databaseMembers = [];
  if (postgrestVersion) {
    databaseMembers.push(
      { comment: '// Allows to automatically instantiate createClient with right options' },
      { comment: "// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)" },
      member('__InternalSupabase', object([member('PostgrestVersion', lit(postgrestVersion))])),
    );
  }
  databaseMembers.push(...schemas.map(schemaNode));

  const constants = {
    entries: schemas.map((schema) => ({
      key: schema.name,
      value: {
        entries: [
          {
            key: 'Enums',
            value: { entries: bySchema[schema.name].enums.map((e) => ({ key: e.name, value: e.enums })) },
          },
        ],
      },
    })),
  };

  return { database: object(databaseMembers), constants, bySchema };
}

// Biçimleyici (oxfmt/prettier: printWidth 80, semi false, çift tırnak, trailingComma all) ------

const pad = (n) => ' '.repeat(n);
const IDENTIFIER = /^[\p{L}\p{Nl}$_][\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}$_‌‍]*$/u;
const printKey = (key) => (IDENTIFIER.test(key) ? key : JSON.stringify(key));
const memberHead = (m) => `${printKey(m.key)}${m.optional ? '?' : ''}:`;

/** Tek satır hali; zorunlu bölünen (açık nesne) bir parça varsa null. */
function flat(node) {
  switch (node.k) {
    case 'raw':
      return node.text;
    case 'union':
    case 'inter': {
      const parts = node.types.map(flat);
      return parts.includes(null) ? null : parts.join(node.k === 'union' ? ' | ' : ' & ');
    }
    case 'array': {
      const inner = flat(node.elem);
      if (inner === null) return null;
      return node.elem.k === 'union' || node.elem.k === 'inter' ? `(${inner})[]` : `${inner}[]`;
    }
    case 'object': {
      if (node.members.length === 0) return '{}';
      if (node.expanded) return null;
      const parts = node.members.map((m) => {
        if (m.comment) return null;
        const value = flat(m.type);
        return value === null ? null : `${memberHead(m)} ${value}`;
      });
      return parts.includes(null) ? null : `{ ${parts.join('; ')} }`;
    }
    case 'tuple': {
      const parts = node.elems.map(flat);
      return parts.includes(null) ? null : `[${parts.join(', ')}]`;
    }
    case 'generic': {
      const parts = node.args.map(flat);
      return parts.includes(null) ? null : `${node.name}<${parts.join(', ')}>`;
    }
    case 'mapped':
      return null;
    default:
      throw new Error(`bilinmeyen düğüm ${node.k}`);
  }
}

const isHuggableUnion = (node) =>
  node.k === 'union' &&
  node.types.filter((t) => t.k === 'object').length === 1 &&
  node.types.every((t) => t.k === 'object' || isRaw(t, 'null') || isRaw(t, 'undefined'));

/** `col` sütununda başlayan düğüm; devam satırları `indent` girintisine göre. */
function render(node, indent, col, trailing = 0) {
  const single = flat(node);
  if (single !== null && col + single.length + trailing <= PRINT_WIDTH) return single;
  switch (node.k) {
    case 'raw':
      return node.text;
    case 'object': {
      if (node.members.length === 0) return '{}';
      const inner = indent + 2;
      const lines = node.members.map((m) => pad(inner) + (m.comment ?? renderMember(m, inner)));
      return `{\n${lines.join('\n')}\n${pad(indent)}}`;
    }
    case 'mapped':
      return `{\n${pad(indent + 2)}[_ in never]: never\n${pad(indent)}}`;
    case 'tuple': {
      if (node.elems.length === 0) return '[]';
      const inner = indent + 2;
      const lines = node.elems.map((e) => `${pad(inner)}${render(e, inner, inner, 1)},`);
      return `[\n${lines.join('\n')}\n${pad(indent)}]`;
    }
    case 'array':
      return `${render(node.elem, indent, col, trailing + 2)}[]`;
    case 'union': {
      if (isHuggableUnion(node)) {
        const rest = node.types.filter((t) => t.k !== 'object').map(flat).join(' | ');
        const obj = node.types.find((t) => t.k === 'object');
        return `${render(obj, indent, col, trailing + rest.length + 3)} | ${rest}`;
      }
      const inner = indent + 2;
      return `\n${node.types.map((t) => `${pad(inner)}| ${render(t, inner + 2, inner + 2, trailing)}`).join('\n')}`;
    }
    case 'inter': {
      const [first, ...rest] = node.types;
      const tail = rest.map(flat).join(' & ');
      return `${render(first, indent, col, trailing + tail.length + 3)} & ${tail}`;
    }
    case 'generic': {
      const inner = indent + 2;
      const lines = node.args.map(
        (a, i) => `${pad(inner)}${render(a, inner, inner, i < node.args.length - 1 ? 1 : 0)}${i < node.args.length - 1 ? ',' : ''}`,
      );
      return `${node.name}<\n${lines.join('\n')}\n${pad(indent)}>`;
    }
    default:
      throw new Error(`bilinmeyen düğüm ${node.k}`);
  }
}

function renderMember(m, indent) {
  const head = memberHead(m);
  const value = render(m.type, indent, indent + head.length + 1);
  return value.startsWith('\n') ? `${head}${value}` : `${head} ${value}`;
}

/** `as const` değeri (Constants): dizgi dizisi ya da { entries: [{ key, value }] } */
function renderJs(value, indent, col, trailing) {
  if (Array.isArray(value)) {
    const single = `[${value.map((v) => JSON.stringify(v)).join(', ')}]`;
    if (value.length === 0 || col + single.length + trailing <= PRINT_WIDTH) return single;
    const inner = indent + 2;
    return `[\n${value.map((v) => `${pad(inner)}${JSON.stringify(v)},`).join('\n')}\n${pad(indent)}]`;
  }
  if (value.entries.length === 0) return '{}';
  const inner = indent + 2;
  const lines = value.entries.map(({ key, value: v }) => {
    const head = `${printKey(key)}: `;
    return `${pad(inner)}${head}${renderJs(v, inner, inner + head.length, 1)},`;
  });
  return `{\n${lines.join('\n')}\n${pad(indent)}}`;
}

// Çıktı -----------------------------------------------------------------------------------------

const JSON_TYPE = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]`;

const helperTypes = (defaultSchema) => `type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, ${JSON.stringify(defaultSchema)}>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never`;

function main() {
  const requestedSchemas = [...new Set(opts.schema.split(',').map((s) => s.trim()).filter(Boolean))];
  if (requestedSchemas.length === 0) fail('en az bir şema gerekli (--schema)');

  const meta = introspect(requestedSchemas);
  const { database, constants, bySchema } = buildDatabase(meta, {
    detectOneToOneRelationships: !opts['no-one-to-one'],
    postgrestVersion: opts['postgrest-version'],
  });
  const defaultSchema =
    meta.schemas.some(({ name }) => name === DEFAULT_SCHEMA) || !meta.schemas[0] ? DEFAULT_SCHEMA : meta.schemas[0].name;

  const output = [
    JSON_TYPE,
    `export type Database = ${render(database, 0, 'export type Database = '.length)}`,
    helperTypes(defaultSchema),
    `export const Constants = ${renderJs(constants, 0, 'export const Constants = '.length, 0)} as const`,
  ].join('\n\n') + '\n';

  if (opts.out) {
    mkdirSync(dirname(opts.out), { recursive: true });
    writeFileSync(opts.out, output);
    const summary = Object.entries(bySchema)
      .map(
        ([name, s]) =>
          `${name}: ${s.tables.length} tablo, ${s.views.length} görünüm, ${new Set(s.functions.map(({ fn }) => fn.name)).size} fonksiyon, ${s.enums.length} enum, ${s.compositeTypes.length} composite`,
      )
      .join('; ');
    process.stderr.write(`gen-db-types: ${opts.out} yazıldı (${summary})\n`);
  } else {
    process.stdout.write(output);
  }
}

main();
