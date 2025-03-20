import { getDeadline } from '@/utils/get-deadline'
import { prisma } from 'prisma/prisma-client'
import { uploadFile } from '@/lib/s3'

class GoalService {
	async createGoal(
		userId: string,
		data: {
			title: string
			urgencyLevel: 'LOW' | 'AVERAGE' | 'HIGH'
			specific: string
			measurable: string
			attainable: string
			award: string
			description: string
			relevant: string
			privacy: 'PRIVATE' | 'PUBLIC'
			deadline: '3_MONTHS' | '6_MONTHS' | '1_YEAR'
			imageUrl: string
			subGoals?: { description: string; deadline: Date }[]
		}
	) {
		const deadline = getDeadline(data.deadline)
		const { subGoals, ...dataWithoutSubGoals } = data

		delete dataWithoutSubGoals.deadline

		const goal = await prisma.goal.create({
			data: { userId, deadline, ...dataWithoutSubGoals }
		})

		if (subGoals) {
			await Promise.all(
				subGoals.map(subGoal =>
					prisma.subGoal.create({
						data: { goalId: goal.id, ...subGoal }
					})
				)
			)
		}

		return { ...goal, subGoals: subGoals || [] }
	}

	async getGoals(userId: string) {
		return await prisma.goal.findMany({
			where: { userId },
			include: { subGoals: true }
		})
	}

	async getFriendGoals(userId: string) {
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

		const goals = await prisma.goal.findMany({
			where: { userId: { in: friendsIds }, privacy: 'PUBLIC' },
			include: { subGoals: true }
		})

		return goals
	}

	async completeGoal(userId: string, goalId: number, fileBuffer: Buffer) {
		const completedImageUrl = await uploadFile(
			fileBuffer,
			`goal-${goalId}-${Date.now()}.jpg`
		)
		const goal = await prisma.goal.update({
			where: { id: goalId, userId },
			data: { isCompleted: true, completedAt: new Date(), imageUrl: completedImageUrl },
			include: {
				user: true
			}
		})

		return goal
	}

	async completeSubGoal(userId: string, subGoalId: number) {
		const subGoal = await prisma.subGoal.update({
			where: {
				id: subGoalId,
				goal: {
					userId
				}
			},
			data: { isCompleted: true, completedAt: new Date() },
			include: {
				goal: {
					include: {
						user: true
					}
				}
			}
		})

		return subGoal
	}
}

export const goalService = new GoalService()
