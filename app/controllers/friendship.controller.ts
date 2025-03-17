import { authMiddleware } from '@/middlewares/auth.middleware'
import { friendshipService } from '@/services/friendship.service'
import { tokenService } from '@/services/token.service'
import { ApiError } from '@/utils/api-error'
import { NextFunction, Request, Response, Router } from 'express'

const router = Router()

router.post(
	'/add',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const accessToken = req.headers.authorization.split(' ')[1]
			const { id: userId } = tokenService.validateAccess(accessToken)
			const { friendId } = req.body

			if (!friendId || !userId)
				throw new ApiError(400, 'Friend ID and user ID are required')

			const friendship = await friendshipService.createFriendship(
				userId,
				friendId
			)

			res.status(200).json(friendship)
		} catch (error) {
			next(error)
		}
	}
)

router.delete(
	'/remove',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const accessToken = req.headers.authorization.split(' ')[1]
			const { id: userId } = tokenService.validateAccess(accessToken)
			const { friendId } = req.body

			if (!friendId || !userId)
				throw new ApiError(400, 'Friend ID and user ID are required')

			await friendshipService.removeFriendship(userId, friendId)

			res.status(200).json({})
		} catch (error) {
			next(error)
		}
	}
)

router.get(
	'/',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			console.log('Headers:', req.headers)
			console.log('Authorization:', req.headers.authorization)

			const accessToken = req.headers.authorization.split(' ')[1]
			console.log('Access Token:', accessToken)

			const { id: userId } = tokenService.validateAccess(accessToken)
			console.log('User ID:', userId)

			const friends = await friendshipService.getFriends(userId)
			console.log('Friends:', friends)

			res.status(200).json(friends)
		} catch (err) {
			console.log('Error:', err)
			next(err)
		}
	}
)

export const friendshipController = router
