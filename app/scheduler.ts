import { telegramService } from './services/telegram.service'

// Run daily sub-goals check at 9:00 AM
const DAILY_CHECK_HOUR = 9
const DAILY_CHECK_MINUTE = 0

// Run monthly deadlines check at 9:00 AM
const MONTHLY_CHECK_HOUR = 9
const MONTHLY_CHECK_MINUTE = 0

function scheduleDailyCheck() {
	const now = new Date()
	const scheduledTime = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		DAILY_CHECK_HOUR,
		DAILY_CHECK_MINUTE,
		0
	)

	if (now > scheduledTime) {
		scheduledTime.setDate(scheduledTime.getDate() + 1)
	}

	const timeUntilScheduled = scheduledTime.getTime() - now.getTime()

	setTimeout(async () => {
		try {
			// Check today's sub-goals
			await telegramService.checkTodaySubGoals()
			console.log('Today sub-goals check completed')

			// Check tomorrow's sub-goals
			await telegramService.checkTomorrowSubGoals()
			console.log('Tomorrow sub-goals check completed')
		} catch (error) {
			console.error('Error in daily sub-goals check:', error)
		}
		scheduleDailyCheck() // Schedule next day
	}, timeUntilScheduled)
}

function scheduleMonthlyCheck() {
	const now = new Date()
	const scheduledTime = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		MONTHLY_CHECK_HOUR,
		MONTHLY_CHECK_MINUTE,
		0
	)

	if (now > scheduledTime) {
		scheduledTime.setDate(scheduledTime.getDate() + 1)
	}

	const timeUntilScheduled = scheduledTime.getTime() - now.getTime()

	setTimeout(async () => {
		try {
			await telegramService.checkMonthlyDeadlines()
			console.log('Monthly deadlines check completed')
		} catch (error) {
			console.error('Error in monthly deadlines check:', error)
		}
		scheduleMonthlyCheck() // Schedule next day
	}, timeUntilScheduled)
}

// Start the schedulers
scheduleDailyCheck()
scheduleMonthlyCheck()
