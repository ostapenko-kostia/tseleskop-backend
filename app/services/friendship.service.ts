import { UserDto } from '@/dtos/user.dto'
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

	async getFriends(userId: string) {
		const friendShips = await prisma.friendship.findMany({
			where: {
				OR: [{ firstUserId: userId }, { secondUserId: userId }]
			}
		})

		const friendsIds = friendShips.map(friendship => {
			return friendship.firstUserId === userId
				? friendship.secondUserId
				: friendship.firstUserId
		})

		const friends = await prisma.user.findMany({
			where: {
				id: { in: friendsIds }
			}
		})

		const friendsDto = friends.map(friend => new UserDto(friend))

		return friendsDto
	}
}

export const friendshipService = new FriendshipService()
