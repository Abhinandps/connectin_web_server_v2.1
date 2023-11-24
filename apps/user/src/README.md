
FOLLWO USER

MATCH (follower:User {userId: $followerId})
MATCH (following:User {userId: $followingId})
CREATE (follower)-[:FOLLOWS]->(following)


Unfollow User:

MATCH (follower:User {userId: $followerId})-[rel:FOLLOWS]->(following:User {userId: $followingId})
DELETE rel

CONNECT USERS

MATCH (user1:User {userId: $userId1})
MATCH (user2:User {userId: $userId2})
CREATE (user1)-[:CONNECTED]->(user2)


# Recommendations:

To find users that a specific user follows:

MATCH (follower:User {userId: $userId})-[:FOLLOWS]->(following:User)
RETURN following


To find common connections between two users:

MATCH (user1:User {userId: $userId1})-[:CONNECTED]-(common:User)-[:CONNECTED]-(user2:User {userId: $userId2})
RETURN common



# Send Connection Request:

When a user sends a connection request, create a PENDING_CONNECTION relationship:

MATCH (sender:User {userId: $senderId})
MATCH (receiver:User {userId: $receiverId})
CREATE (sender)-[:PENDING_CONNECTION]->(receiver)


Accept Connection Request:

When the receiver accepts the connection request, create a CONNECTED relationship and remove the PENDING_CONNECTION relationship:

MATCH (sender:User {userId: $senderId})-[:PENDING_CONNECTION]->(receiver:User {userId: $receiverId})
CREATE (sender)-[:CONNECTED]->(receiver)
DELETE (sender)-[:PENDING_CONNECTION]->(receiver)


Decline Connection Request:

If the receiver declines the connection request, simply remove the PENDING_CONNECTION relationship:


MATCH (sender:User {userId: $senderId})-[:PENDING_CONNECTION]->(receiver:User {userId: $receiverId})
DELETE (sender)-[:PENDING_CONNECTION]->(receiver)


Query Pending Connection Requests:
To find pending connection requests for a user:

MATCH (receiver:User {userId: $userId})<-[rel:PENDING_CONNECTION]-(sender:User)
RETURN sender


Query Connected Users:
To find connected users for a user:

MATCH (user:User {userId: $userId})-[:CONNECTED]-(connected:User)
RETURN connected


# Count of Connections:

MATCH (user:User {userId: $userId})-[:CONNECTED]-(connected:User)
RETURN COUNT(connected) AS connectionsCount


# Count of Followers:

MATCH (user:User {userId: $userId})<-[:FOLLOW]-(follower:User)
RETURN COUNT(follower) AS followersCount


# . Initial Private Setting:

Set the initial privacy setting to private when a user registers or creates a profile:


MATCH (user:User {userId: $userId})
SET user.profileVisitPrivacy = 'private'

# 2. Record Profile Visits:

MATCH (visitor:User {userId: $visitorId}), (visited:User {userId: $visitedId})
CREATE (visitor)-[:VISITED_PROFILE]->(visited)

# 3. Subscription Policy Update:

When the subscription policy allows for making profile visits public, update the privacy setting:

MATCH (user:User {userId: $userId})
SET user.profileVisitPrivacy = 'public'


# 4. Querying Profile Visits:

When querying profile visits, consider the privacy setting:

MATCH (visitor:User)-[:VISITED_PROFILE]->(visited:User {userId: $visitedId})
WHERE visited.profileVisitPrivacy = 'public' OR (visited.profileVisitPrivacy = 'private' AND visitor = visited)
RETURN DISTINCT visitor

# Privacy Settings Update Based on Subscription:
When the subscription policy changes, update the privacy settings for all users accordingly.



