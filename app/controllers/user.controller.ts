import { authMiddleware } from '@/middlewares/auth.middleware'
import { userEditSchema } from '@/schemas/user-edit.schema'
import { userService } from '@/services/user.service'
import { ApiError } from '@/utils/api-error'
import { NextFunction, Request, Response, Router } from 'express'

const router = Router()
router.put(
	`/edit/:id`,
	authMiddleware,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { body } = req

			const { value: data, error } = userEditSchema.validate(body, {
				abortEarly: false
			})

			if (error) throw new ApiError(400, error.message)

			const userId = Number(req.params.id)
			const userData = await userService.editUser(userId, data)

			res.status(200).json(userData)
		} catch (err) {
			next(err)
		}
	}
)

export const userController = router
