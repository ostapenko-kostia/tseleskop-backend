import { Goal, SubGoal } from '@prisma/client'
import { prisma } from 'prisma/prisma-client'

class TelegramService {
	private readonly botToken: string
	private readonly botApiUrl: string

	constructor() {
		this.botToken = process.env.TELEGRAM_BOT_TOKEN
		if (!this.botToken) {
			throw new Error('TELEGRAM_BOT_TOKEN is not defined')
		}
		this.botApiUrl = `https://api.telegram.org/bot${this.botToken}`
	}

	async sendMessage(chatId: string, message: string) {
		try {
			const response = await fetch(`${this.botApiUrl}/sendMessage`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					chat_id: chatId,
					text: message,
					parse_mode: 'HTML'
				})
			})

			if (!response.ok) {
				throw new Error(`Failed to send message: ${response.statusText}`)
			}

			return await response.json()
		} catch (error) {
			console.error('Error sending Telegram message:', error)
			throw error
		}
	}

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
						user: {
							include: {
								notificationSettings: true
							}
						}
					}
				}
			}
		})

		for (const subGoal of subGoals) {
			if (
				subGoal.goal.user.notificationSettings?.todaySubGoalsNotifications &&
				subGoal.goal.user.chatId
			) {          
				await this.sendMessage(
					subGoal.goal.user.chatId,
					`📝 <b>Напоминание о подцели</b>\n\nСегодня нужно выполнить подцель "${subGoal.description}" из цели "${subGoal.goal.title}"!`
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
						user: {
							include: {
								notificationSettings: true
							}
						}
					}
				}
			}
		})

		for (const subGoal of subGoals) {
			if (
				subGoal.goal.user.notificationSettings?.tomorrowSubGoalNotifications &&
				subGoal.goal.user.chatId
			) {
				await this.sendMessage(
					subGoal.goal.user.chatId,
					`📝 <b>Напоминание о подцели</b>\n\nЗавтра нужно выполнить подцель "${subGoal.description}" из цели "${subGoal.goal.title}"!`
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
				user: {
					include: {
						notificationSettings: true
					}
				}
			}
		})

		for (const goal of goals) {
			if (
				goal.user.notificationSettings?.monthlyGoalDeadlineNotifications &&
				goal.user.chatId
			) {
				const daysLeft = Math.ceil(
					(goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
				)
				await this.sendMessage(
					goal.user.chatId,
					`⏰ <b>Напоминание о дедлайне</b>\n\nДо выполнения цели "${goal.title}" осталось ${daysLeft} дней!`
				)
			}
		}
	}

	async notifyGoalCompleted(goal: Goal) {
		const user = await prisma.user.findUnique({
			where: { id: goal.userId },
			include: { notificationSettings: true }
		})

		if (user?.notificationSettings?.customNotifications && user.chatId) {
			await this.sendMessage(
				user.chatId,
				`🎉 <b>Поздравляем!</b>\n\nВы успешно выполнили цель "${goal.title}"!`
			)
		}
	}

	async notifySubGoalCompleted(subGoal: SubGoal) {
		const goal = await prisma.goal.findUnique({
			where: { id: subGoal.goalId },
			include: {
				user: {
					include: {
						notificationSettings: true
					}
				}
			}
		})

		if (
			goal?.user.notificationSettings?.tomorrowSubGoalNotifications &&
			goal.user.chatId
		) {
			await this.sendMessage(
				goal.user.chatId,
				`✅ <b>Подцель выполнена!</b>\n\nВы выполнили подцель "${subGoal.description}" из цели "${goal.title}"!`
			)
		}
	}
}

export const telegramService = new TelegramService()
