import { appendFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const LOG_DIR = 'logs'
const date = new Date().toISOString().split('T')[0]
const LOG_FILE = join(LOG_DIR, `${date}.log`)

try { mkdirSync(LOG_DIR, { recursive: true }) } catch { /* ignore */ }

function write(level, msg, extra = {}) {
  const entry = { ts: new Date().toISOString(), level, msg, ...extra }

  const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  out(`[${level.toUpperCase()}]`, msg, Object.keys(extra).length ? extra : '')

  try {
    appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8')
  } catch { /* ignore */ }
}

export const logger = {
  info:  (msg, extra) => write('info',  msg, extra),
  warn:  (msg, extra) => write('warn',  msg, extra),
  error: (msg, extra) => write('error', msg, extra),
}
