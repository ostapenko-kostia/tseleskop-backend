import { prisma } from 'prisma/prisma-client'

function getDeadline(deadline: '3_MONTHS' | '6_MONTHS' | '1_YEAR') {
	const increments: Record<
		typeof deadline,
		{ months?: number; years?: number }
	> = {
		'3_MONTHS': { months: 3 },
		'6_MONTHS': { months: 6 },
		'1_YEAR': { years: 1 }
	}

	const date = new Date()
	if (increments[deadline].months)
		date.setMonth(date.getMonth() + increments[deadline].months!)
	if (increments[deadline].years)
		date.setFullYear(date.getFullYear() + increments[deadline].years!)

	return date
}

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

		delete dataWithoutSubGoals.description
		delete dataWithoutSubGoals.deadline

		const description = `Полное описание цели: ${data.description}\nКонкретность: ${data.specific}\nИзмеримость: ${data.measurable}\nДостижимость: ${data.attainable}\nНаграда: ${data.award}\nАктуальность: ${data.relevant}`

		const goal = await prisma.goal.create({
			data: { userId, deadline, description, ...dataWithoutSubGoals }
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
}

export const goalService = new GoalService()
