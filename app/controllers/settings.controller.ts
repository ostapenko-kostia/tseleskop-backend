import { notificationSettingsService } from '@/services/notification-settings.service'
import { authMiddleware } from '@/middlewares/auth.middleware'
import { tokenService } from '@/services/token.service'
import { User } from '@prisma/client'
import { Router, Request, Response, NextFunction } from 'express'

const router = Router()

router.get(
	'/',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.headers.authorization?.split(' ')[1]
			const user: User = tokenService.validateAccess(token) as User

			const settings = await notificationSettingsService.getSettings(user.id)
			res.status(200).json(settings)
		} catch (err) {
			next(err)
		}
	}
)

router.put(
	'/edit',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.headers.authorization?.split(' ')[1]
			const user: User = tokenService.validateAccess(token) as User

			const settings = await notificationSettingsService.updateSettings(
				user.id,
				req.body
			)

			res.status(200).json(settings)
		} catch (err) {
			next(err)
		}
	}
)

export const settingsController = router
