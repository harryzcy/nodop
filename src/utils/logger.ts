import { createLogger, format, transports } from "winston"

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { service: 'nodop' },
  transports: [
    new transports.File({ filename: 'nodop.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.clear()
  logger.add(new transports.Console({
    format: format.json(),
  }))
}

export function getLogger() {
  return logger
}
