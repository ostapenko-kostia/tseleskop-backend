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
	'/friends',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.headers.authorization?.split(' ')[1]
			const user: User = tokenService.validateAccess(token) as User

			const goal = await goalService.getFriendGoals(user.id)

			res.status(200).json(goal)
		} catch (err) {
			next(err)
		}
	}
)

// router.post(
// 	'/:goalId/complete',
// 	authMiddleware,
// 	async (req: Request, res: Response, next: NextFunction) => {
// 		try {
// 			const token = req.headers.authorization?.split(' ')[1]
// 			const user: User = tokenService.validateAccess(token) as User
// 			const goalId = parseInt(req.params.goalId)

// 			if (isNaN(goalId)) {
// 				throw new ApiError(400, 'Invalid goal ID')
// 			}

// 			const goal = await goalService.completeGoal(user.id, goalId)
// 			res.status(200).json(goal)
// 		} catch (err) {
// 			next(err)
// 		}
// 	}
// )

router.post(
	'/sub-goal/:subGoalId/complete',
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.headers.authorization?.split(' ')[1]
			const user: User = tokenService.validateAccess(token) as User
			const subGoalId = parseInt(req.params.subGoalId)

			if (isNaN(subGoalId)) {
				throw new ApiError(400, 'Invalid sub-goal ID')
			}

			const subGoal = await goalService.completeSubGoal(user.id, subGoalId)
			res.status(200).json(subGoal)
		} catch (err) {
			next(err)
		}
	}
)

export const goalController = router
