import { validate } from '../expression/validate.js'
import { getConfigIndex, loadConfig } from '../utils/config.js'

const configPath = process.env.CONFIG_PATH ?? 'nodop'

try {
  await loadConfig(configPath)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
  console.error('Invalid configuration')
  process.exit(1)
}

const index = getConfigIndex()

let containsError = false
Object.entries(index).forEach(([, value]) => {
  value.configs.forEach((config) => {
    Object.entries(config.jobs).forEach(([, job]) => {
      job.steps.forEach((step) => {
        if (step.lang === 'builtin') {
          step.run.forEach((line) => {
            const valid = validate(line)
            if (!valid) {
              console.error(`Invalid expression: ${line}`)
              containsError = true
            }
          })
        }
      })
    })
  })
})

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (containsError) {
  process.exit(1)
}
