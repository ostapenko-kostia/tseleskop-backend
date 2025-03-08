import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

import { authController } from './controllers/auth.controller'
import { errorMiddleware } from './middlewares/error.middleware'
import { userController } from './controllers/user.controller'

dotenv.config()
const app = express()
const port = process.env.PORT || 4000

app.use(helmet())
app.use(
	cors({
		origin: [
			'https://t.me/tseleskop_bot/tseleskop',
			'http://localhost:5173',
			'https://celiscope.ru'
		],
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization']
	})
)
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authController)
app.use('/api/user', userController)

app.use(errorMiddleware)

app.listen(port, () => {
	console.log(`Tseleskop Server listening on port ${port}`)
})
