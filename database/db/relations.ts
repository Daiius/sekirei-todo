import { defineRelations } from 'drizzle-orm'
import { tasks } from './schema'

export const relations = defineRelations({ tasks })
