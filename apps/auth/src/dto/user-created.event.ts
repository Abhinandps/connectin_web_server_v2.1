
export class UserCreatedEvent {
    constructor(
        public readonly userId: string,
        public readonly firstName: string,
        public readonly lastName: string,
    ) { }

    toString() {
        return JSON.stringify({
            userId: this.userId,
            firstName: this.firstName,
            lastName: this.lastName
        })
    }
}