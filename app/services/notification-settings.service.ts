import { prisma } from 'prisma/prisma-client'

class NotificationSettingsService {
	async getSettings(userId: string) {
		return await prisma.notificationSettings.findUnique({
			where: { userId }
		})
	}

	async updateSettings(
		userId: string,
		settings: {
			dailySubGoalsNotifications?: boolean
			everyDaySubGoalNotifications?: boolean
			monthlyGoalDeadlineNotifications?: boolean
			customNotifications?: boolean
		}
	) {
		const existingSettings = await prisma.notificationSettings.findUnique({
			where: { userId }
		})

		if (existingSettings) {
			return await prisma.notificationSettings.update({
				where: { userId },
				data: settings
			})
		} else {
			return await prisma.notificationSettings.create({
				data: {
					userId,
					...settings
				}
			})
		}
	}
}

export const notificationSettingsService = new NotificationSettingsService()
