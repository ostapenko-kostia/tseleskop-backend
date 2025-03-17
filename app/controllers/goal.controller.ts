import { authMiddleware } from '@/middlewares/auth.middleware'
import { goalCreateSchema } from '@/schemas/goal-create.schema'
import { goalService } from '@/services/goal.service'
import { tokenService } from '@/services/token.service'
import { ApiError } from '@/utils/api-error'
import { User } from '@prisma/client'
import { type NextFunction, type Request, type Response, Router } from 'express'

const router = Router()

router.post(
	'/create',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { body } = req
			const { value: data, error } = goalCreateSchema.validate(body, {
				abortEarly: false
			})

			if (error) throw new ApiError(400, error.message)

			const token = req.headers.authorization?.split(' ')[1]
			const user: User = tokenService.validateAccess(token) as User

			const goal = await goalService.createGoal(user.id, data)

			res.status(200).json(goal)
		} catch (err) {
			next(err)
		}
	}
)

router.get(
	'/',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.headers.authorization?.split(' ')[1]
			const user: User = tokenService.validateAccess(token) as User

			const goal = await goalService.getGoals(user.id)

			res.status(200).json(goal)
		} catch (err) {
			next(err)
		}
	}
)
router.get(
	'/friend/:friendId',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.headers.authorization?.split(' ')[1]
			const user: User = tokenService.validateAccess(token) as User
			const friendId = req.params.friendId

			if (!friendId) throw new ApiError(400, 'Friend ID is required')

			const goal = await goalService.getFriendGoals(user.id, friendId)

			res.status(200).json(goal)
		} catch (err) {
			next(err)
		}
	}
)

export const goalController = router
