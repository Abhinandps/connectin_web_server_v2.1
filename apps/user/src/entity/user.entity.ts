import { Node } from 'neo4j-driver'
import { User } from '../interface'


export class Neo4jUser {
    constructor(private readonly node: Node) { }

    getId(): string {
        return (<Record<string, any>>this.node.properties).id
    }

    getUserId(): string {
        return (<Record<string, any>>this.node.properties).userId
    }

    toJson(): Record<string, any> {
        const { userId, firstName, lastName, profileImage, coverImage } = <Record<string, any>>this.node.properties
        
        return { userId, firstName, lastName, profileImage, coverImage }
    }
}

