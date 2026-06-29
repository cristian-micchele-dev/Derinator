import { beforeAll } from 'vitest'
import { newDb, DataType } from 'pg-mem'
import { Pool } from 'pg'
import { randomUUID } from 'crypto'
import { _setPoolForTests, initDb, getDb } from './db'

const mem = newDb()

mem.public.registerFunction({
  name: 'gen_random_uuid',
  returns: DataType.uuid,
  impure: true,
  implementation: () => randomUUID(),
})

const { Pool: TestPool } = mem.adapters.createPg()
_setPoolForTests(new TestPool() as unknown as Pool)

beforeAll(async () => {
  await initDb()
  const db = getDb()
  await db.query('DELETE FROM game_history')
  await db.query('DELETE FROM player_stats')
  await db.query('DELETE FROM learned_characters')
})
