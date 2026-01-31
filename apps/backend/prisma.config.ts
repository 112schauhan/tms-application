import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file in the same directory
config({ path: resolve(__dirname, '.env') })

export default {
  datasource: {
    url: process.env.DATABASE_URL
  }
}
