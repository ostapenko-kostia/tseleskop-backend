export class UserDto {
	firstName: string
	lastName: string
	id: string
	username: string
	photoUrl: string

	constructor(user: any) {
		this.firstName = user.firstName
		this.lastName = user.lastName
		this.username = user.username
		this.photoUrl = user.photoUrl
		this.id = user.id
	}
}
