import { uploadFile } from '@/lib/s3'
import { authMiddleware } from '@/middlewares/auth.middleware'
import { goalCreateSchema } from '@/schemas/goal-create.schema'
import { goalService } from '@/services/goal.service'
import { tokenService } from '@/services/token.service'
import { ApiError } from '@/utils/api-error'
import { User } from '@prisma/client'
import { type NextFunction, type Request, type Response, Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'

const router = Router()

const storage = multer.memoryStorage()
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 5 * 1024 * 1024 // 5MB limit
	}
})

router.post(
	'/create',
	authMiddleware,
	upload.single('image'),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.file) {
				console.log('No file uploaded')
			}

			const { info } = req.body

			const { value: data, error } = goalCreateSchema.validate(
				JSON.parse(info),
				{
					abortEarly: false
				}
			)

			if (error) throw new ApiError(400, error.message)

			const token = req.headers.authorization?.split(' ')[1]
			const user: User = tokenService.validateAccess(token) as User

			if (req.file) {
				const fileBuffer = await sharp(req.file.buffer)
					.toFormat('jpg')
					.toBuffer()
				const imageUrl = await uploadFile(fileBuffer, `goal-${Date.now()}.jpg`)
				data.imageUrl = imageUrl
			}

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

router.post(
	'/:goalId/complete',
	authMiddleware,
	upload.single('image'),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.headers.authorization?.split(' ')[1]
			const user: User = tokenService.validateAccess(token) as User
			const goalId = parseInt(req.params.goalId)

			if (isNaN(goalId)) {
				throw new ApiError(400, 'Invalid goal ID')
			}

			const fileBuffer = await sharp(req.file.buffer).toFormat('jpg').toBuffer()
			const goal = await goalService.completeGoal(user.id, goalId, fileBuffer)

			res.status(200).json(goal)
		} catch (err) {
			next(err)
		}
	}
)

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
