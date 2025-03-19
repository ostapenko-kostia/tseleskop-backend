import { getDeadline } from '@/utils/get-deadline'
import { prisma } from 'prisma/prisma-client'
import { telegramService } from './telegram.service'

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

	// async completeGoal(userId: string, goalId: number) {
	// 	const goal = await prisma.goal.update({
	// 		where: { id: goalId, userId },
	// 		data: { isCompleted: true },
	// 		include: {
	// 			user: true
	// 		}
	// 	})

	// 	// Send notification about goal completion
	// 	await telegramService.notifyGoalCompleted(goal)

	// 	return goal
	// }

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
