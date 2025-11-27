/**
 * Vite Plugin to provide SQLite query API in development
 * 
 * The database is too large (5GB) to load into browser memory,
 * so this plugin acts as a query server instead.
 */
import { existsSync } from 'fs'
import { join } from 'path'
import type { Plugin } from 'vite'
import Database from 'better-sqlite3'

const DB_PATH = process.env.APPDATA 
  ? join(process.env.APPDATA, 'io.github.kdroidfilter.seforimapp', 'databases', 'seforim.db')
  : ''

let db: Database.Database | null = null

function initDb() {
  if (db) return db
  
  if (!DB_PATH || !existsSync(DB_PATH)) {
    console.error('❌ Database not found at:', DB_PATH)
    return null
  }
  
  try {
    db = new Database(DB_PATH, { readonly: true })
    console.log('✅ Database connected:', DB_PATH)
    return db
  } catch (error) {
    console.error('❌ Failed to open database:', error)
    return null
  }
}

export function dbServerPlugin(): Plugin {
  return {
    name: 'db-server',
    configureServer(server) {
      console.log('🗄️  Database API plugin initialized')
      console.log('📂 Database path:', DB_PATH)
      
      const database = initDb()
      if (!database) {
        console.error('❌ Database initialization failed')
        return
      }

      // API endpoint for database queries
      server.middlewares.use('/__db/query', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { query, params = [] } = JSON.parse(body)
            console.log('📥 Query:', query.substring(0, 100) + '...')
            
            const stmt = database.prepare(query)
            const rows = stmt.all(...params)
            
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify({ success: true, data: rows }))
          } catch (error: any) {
            console.error('❌ Query error:', error.message)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: error.message }))
          }
        })
      })

      // Handle CORS preflight
      server.middlewares.use('/__db/query', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.statusCode = 204
          res.end()
          return
        }
        next()
      })
    },
    closeBundle() {
      if (db) {
        db.close()
        console.log('🔒 Database connection closed')
      }
    }
  }
}
