import { prisma } from 'prisma/prisma-client'
import bcrypt from 'bcrypt'

class UserService {
	async getUserById(userId: number) {
		return await prisma.user.findUnique({ where: { id: userId } })
	}

	async editUser(userId: number, data: any) {
		if (data?.pin) data.pin = await bcrypt.hash(data.pin, 12)

		return await prisma.user.update({
			where: { id: userId },
			data
		})
	}
}

export const userService = new UserService()
