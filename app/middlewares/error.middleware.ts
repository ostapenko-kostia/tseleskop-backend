import { ApiError } from '@/utils/api-error'
import { NextFunction, Request, Response } from 'express'

export function errorMiddleware(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		if (res.headersSent) {
			return next(err)
		}

		if (err instanceof ApiError) {
			res.status(err.status).json({ message: err.message })
		}

		res.status(500).json({ message: 'Server Error' })
	} catch {
		return next()
	}
}
