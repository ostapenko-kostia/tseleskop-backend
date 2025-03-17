import { Goal, SubGoal, User } from '@prisma/client'
import { prisma } from 'prisma/prisma-client'
import { notificationSettingsService } from './notification-settings.service'
import { telegramService } from './telegram.service'

class NotificationService {
	async checkTodaySubGoals() {
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const subGoals = await prisma.subGoal.findMany({
			where: {
				deadline: {
					gte: today,
					lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
				},
				isCompleted: false
			},
			include: {
				goal: {
					include: {
						user: true
					}
				}
			}
		})

		for (const subGoal of subGoals) {
			if (
				(await notificationSettingsService.shouldSendTodaySubGoalsNotification(
					subGoal.goal.userId
				)) &&
				subGoal.goal.user.chatId
			) {
				await this.sendSubGoalNotification(
					subGoal.goal.user,
					subGoal,
					subGoal.goal,
					'today'
				)
			}
		}
	}

	async checkTomorrowSubGoals() {
		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		tomorrow.setHours(0, 0, 0, 0)

		const subGoals = await prisma.subGoal.findMany({
			where: {
				deadline: {
					gte: tomorrow,
					lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
				},
				isCompleted: false
			},
			include: {
				goal: {
					include: {
						user: true
					}
				}
			}
		})

		for (const subGoal of subGoals) {
			if (
				(await notificationSettingsService.shouldSendTomorrowSubGoalNotification(
					subGoal.goal.userId
				)) &&
				subGoal.goal.user.chatId
			) {
				await this.sendSubGoalNotification(
					subGoal.goal.user,
					subGoal,
					subGoal.goal,
					'tomorrow'
				)
			}
		}
	}

	async checkMonthlyDeadlines() {
		const now = new Date()
		const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

		const goals = await prisma.goal.findMany({
			where: {
				deadline: {
					gte: now,
					lte: oneMonthFromNow
				},
				isCompleted: false
			},
			include: {
				user: true
			}
		})

		for (const goal of goals) {
			if (
				(await notificationSettingsService.shouldSendMonthlyDeadlineNotification(
					goal.userId
				)) &&
				goal.user.chatId
			) {
				await this.sendMonthlyDeadlineNotification(goal.user, goal)
			}
		}
	}

	async notifyGoalCompleted(goal: Goal) {
		const user = await prisma.user.findUnique({
			where: { id: goal.userId }
		})

		if (
			user?.chatId &&
			(await notificationSettingsService.shouldSendCustomNotification(
				goal.userId
			))
		) {
			await this.sendGoalCompletionNotification(user, goal)
		}
	}

	async notifySubGoalCompleted(subGoal: SubGoal) {
		const goal = await prisma.goal.findUnique({
			where: { id: subGoal.goalId },
			include: { user: true }
		})

		if (
			goal?.user.chatId &&
			(await notificationSettingsService.shouldSendTomorrowSubGoalNotification(
				goal.userId
			))
		) {
			await this.sendSubGoalCompletionNotification(goal.user, subGoal, goal)
		}
	}

	private async sendSubGoalNotification(
		user: User,
		subGoal: SubGoal,
		goal: Goal,
		when: 'today' | 'tomorrow'
	) {
		const message = `📝 <b>Напоминание о подцели</b>\n\n${
			when === 'today' ? 'Сегодня' : 'Завтра'
		} нужно выполнить подцель "${subGoal.description}" из цели "${goal.title}"!`

		await telegramService.sendMessage(user.chatId!, message)
	}

	private async sendMonthlyDeadlineNotification(user: User, goal: Goal) {
		const now = new Date()
		const daysLeft = Math.ceil(
			(goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		)

		const message = `⏰ <b>Напоминание о дедлайне</b>\n\nДо выполнения цели "${goal.title}" осталось ${daysLeft} дней!`

		await telegramService.sendMessage(user.chatId!, message)
	}

	private async sendGoalCompletionNotification(user: User, goal: Goal) {
		const message = `🎉 <b>Поздравляем!</b>\n\nВы успешно выполнили цель "${goal.title}"!`

		await telegramService.sendMessage(user.chatId!, message)
	}

	private async sendSubGoalCompletionNotification(
		user: User,
		subGoal: SubGoal,
		goal: Goal
	) {
		const message = `✅ <b>Подцель выполнена!</b>\n\nВы выполнили подцель "${subGoal.description}" из цели "${goal.title}"!`

		await telegramService.sendMessage(user.chatId!, message)
	}
}

export const notificationService = new NotificationService()
