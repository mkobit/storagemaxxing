import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'storagemaxxing'
const DB_VERSION = 1
const STORE_NAME = 'meta'

type MetaRecord = {
  readonly key: string
  readonly value: number
}

let db: IDBPDatabase | undefined

export async function initDb(): Promise<void> {
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    },
  })
}

function getDb(): IDBPDatabase {
  if (db === undefined) throw new Error('DB not initialized — call initDb() first')
  return db
}

export async function incrementVisits(): Promise<void> {
  const database = getDb()
  const tx = database.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const existing = await store.get('visits') as MetaRecord | undefined
  const next: MetaRecord = { key: 'visits', value: (existing?.value ?? 0) + 1 }
  await store.put(next)
  await tx.done
}

export async function getVisitCount(): Promise<number> {
  const existing = await getDb().get(STORE_NAME, 'visits') as MetaRecord | undefined
  return existing?.value ?? 0
}
