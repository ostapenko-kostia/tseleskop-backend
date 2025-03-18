import { notificationService } from './services/notification.service'
import { prisma } from 'prisma/prisma-client'

// Run daily sub-goals check based on user-defined times
async function scheduleNotifications() {
    const users = await prisma.user.findMany({
        include: { notificationSettings: true }
    })

    users.forEach(user => {
        if (user.notificationSettings?.todaySubGoalsNotificationsTime) {
            const [hours, minutes] = user.notificationSettings.todaySubGoalsNotificationsTime.split(':').map(Number)
            scheduleNotification(user, hours, minutes, 'today')
        }

        if (user.notificationSettings?.tomorrowSubGoalNotificationsTime) {
            const [hours, minutes] = user.notificationSettings.tomorrowSubGoalNotificationsTime.split(':').map(Number)
            scheduleNotification(user, hours, minutes, 'tomorrow')
        }

        if (user.notificationSettings?.monthlyGoalDeadlineNotificationsTime) {
            const [hours, minutes] = user.notificationSettings.monthlyGoalDeadlineNotificationsTime.split(':').map(Number)
            scheduleNotification(user, hours, minutes, 'monthly')
        }
    })
}

function scheduleNotification(user: any, hours: number, minutes: number, type: 'today' | 'tomorrow' | 'monthly') {
    const now = new Date()
    const notificationTime = new Date()
    notificationTime.setHours(hours, minutes, 0, 0)

    if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1)
    }

    const delay = notificationTime.getTime() - now.getTime()

    setTimeout(async () => {
        try {
            if (type === 'today') {
                await notificationService.checkTodaySubGoals(user)
            } else if (type === 'tomorrow') {
                await notificationService.checkTomorrowSubGoals(user)
            } else if (type === 'monthly') {
                await notificationService.checkMonthlyDeadlines(user)
            }
        } catch (error) {
            console.error(`Error in notification for ${type}:`, error)
        }

        // Re-run the schedule for the next day
        scheduleNotification(user, hours, minutes, type)
    }, delay)
}

// Start the scheduler
scheduleNotifications()
