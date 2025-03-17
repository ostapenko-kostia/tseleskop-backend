import { prisma } from 'prisma/prisma-client'

class FriendshipService {
	async createFriendship(userId: string, friendId: string) {
		const friendship = await prisma.friendship.create({
			data: { firstUserId: userId, secondUserId: friendId }
		})

		return friendship
	}

	async removeFriendship(userId: string, friendId: string) {
		const friendship = await prisma.friendship.delete({
			where: {
				firstUserId_secondUserId: {
					firstUserId: userId,
					secondUserId: friendId
				}
			}
		})

		return friendship
	}
}

export const friendshipService = new FriendshipService()
