Get Conversation
GET
https://services.leadconnectorhq.com/conversations/:conversationId
Get the conversation details based on the conversation ID

Requirements
Scope(s)
conversations.readonly
Auth Method(s)
OAuth Access Token
Private Integration Token
Token Type(s)
Sub-Account Token
Request
Header Parameters
Version
string
required
Possible values: [2021-04-15]

API Version

Path Parameters
conversationId
string
required
Conversation ID as string

Example: tDtDnQdgm2LXpyiqYvZ6
Responses
200
400
401
Successful response
application/json
Schema
Example (auto)
Schema
contactId
string
required
Unique identifier of the contact associated with this conversation

Example:ve9EPM428kjkvShlRW1KT
locationId
string
required
Unique identifier of the business location where this conversation takes place

Example:ve9EPM428kjkvShlRW1KT
deleted
boolean
required
Flag indicating if this conversation has been moved to trash/deleted

Example:false
inbox
boolean
required
Flag indicating if this conversation is currently in the main inbox view

Example:true
type
number
required
Communication channel type for this conversation: 1 (Phone), 2 (Email), 3 (Facebook Messenger), 4 (Review), 5 (Group SMS), 6 (Internal Chat - coming soon)

unreadCount
number
required
Number of messages in this conversation that have not been read by the user

Example:1
assignedTo
string
Unique identifier of the team member currently responsible for handling this conversation

Example:ve9EPM428kjkvShlRW1KT
id
string
required
Unique identifier for this specific conversation thread

Example:ve9EPM428kjkvShlRW1KT
starred
boolean
Flag indicating if this conversation has been marked as important/starred by the user

Example:true
Share your feedback
★
★
★
★
★
Authorization: Authorization
curl
nodejs
python
php
java
go
ruby
powershell
CURL
curl -L 'https://services.leadconnectorhq.com/conversations/:conversationId' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>'


Request
Collapse all
Base URL
https://services.leadconnectorhq.com
Auth
Bearer Token
Bearer Token
Parameters
conversationId — pathrequired
Conversation ID as string
Version — headerrequired

---
Send API Request

Update Conversation
PUT
https://services.leadconnectorhq.com/conversations/:conversationId
Update the conversation details based on the conversation ID

Requirements
Scope(s)
conversations.write
Auth Method(s)
OAuth Access Token
Private Integration Token
Token Type(s)
Sub-Account Token
Request
Header Parameters
Version
string
required
Possible values: [2021-04-15]

API Version

Path Parameters
conversationId
string
required
Conversation ID as string

Example: tDtDnQdgm2LXpyiqYvZ6
application/json
Bodyrequired
locationId
string
required
Location ID as string

Example:tDtDnQdgm2LXpyiqYvZ6
unreadCount
number
Count of unread messages in the conversation

Example:1
starred
boolean
Starred status of the conversation.

Example:true
feedback
object
Responses
200
400
401
Successful response
application/json
Schema
Example (auto)
Schema
success
boolean
required
Boolean value as the API response.

Example:true
conversation
object
Share your feedback
★
★
★
★
★
Authorization: Authorization
curl
nodejs
python
php
java
go
ruby
powershell
CURL
curl -L -X PUT 'https://services.leadconnectorhq.com/conversations/:conversationId' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>' \
-d '{
  "locationId": "tDtDnQdgm2LXpyiqYvZ6",
  "unreadCount": 1,
  "starred": true,
  "feedback": {}
}'


Request
Collapse all
Base URL
https://services.leadconnectorhq.com
Auth
Bearer Token
Bearer Token
Parameters
conversationId — pathrequired
Conversation ID as string
Version — headerrequired

---
Body
 required
{
  "locationId": "tDtDnQdgm2LXpyiqYvZ6",
  "unreadCount": 1,
  "starred": true,
  "feedback": {}
}
Send API Request
Response
Clear
Click the Send API Request button above and see the response here!
