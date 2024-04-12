import { createLogger, format, transports } from 'winston'

const LOG_FILE = process.env.LOG_PATH

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  defaultMeta: { service: 'nodop' },
  transports: []
})

if (LOG_FILE === undefined) {
  logger.add(
    new transports.Console({
      format: format.json()
    })
  )
} else {
  logger.add(new transports.File({ filename: LOG_FILE }))
}

export function getLogger() {
  return logger
}
