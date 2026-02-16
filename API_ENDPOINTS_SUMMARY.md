# Travel Express Backend - Complete API Endpoints Summary

## Overview
This document provides a comprehensive inventory of all API endpoints related to messaging, groups, broadcasts, users, and admin operations in the Travel Express backend.

---

## TABLE OF CONTENTS
1. [Conversations (1-1 Discussions)](#conversations--1-1-discussions)
2. [Messages](#messages)
3. [Groups](#groups)
4. [Broadcasts](#broadcasts)
5. [Users](#users)
6. [Admin - Messaging](#admin---messaging)
7. [Admin - Students](#admin---students)
8. [Admin - Activities](#admin---activities)
9. [Student-Specific Endpoints](#student-specific-endpoints)
10. [Permissions & Security](#permissions--security)
11. [Database Models](#database-models)

---

## CONVERSATIONS (1-1 Discussions)

### GET /api/conversations
**HTTP Method:** GET  
**Path:** `/api/conversations`  
**Description:** List all conversations for the current user  
**Authentication:** ✅ Required (Bearer Token + JWT verification)  
**Permission Checks:**
- `CONVERSATION.READ` permission required
- **Admin Access:** SUPERADMIN and SECRETARY see all conversations
- **Regular Users:** Only see conversations where they are participants

**Response Data:**
- conversations[] with:
  - id, subject
  - participants (with user details)
  - messages (last message only)

**CORS:** ✅ Enabled

---

### POST /api/conversations
**HTTP Method:** POST  
**Path:** `/api/conversations`  
**Description:** Create a new 1-1 conversation  
**Authentication:** ✅ Required  
**Permission Checks:**
- `CONVERSATION.CREATE` permission required

**Request Body:**
```json
{
  "participantId": "user-id",
  "subject": "Optional subject"
}
```

**Validations:**
- participantId is required and must exist
- Auto-assigns conversation name if not provided

**Response:** 201 Created - Conversation object with participants

**CORS:** ✅ Enabled

---

### DELETE /api/conversations/{id}
**HTTP Method:** DELETE  
**Path:** `/api/conversations/{id}`  
**Description:** Delete a conversation and all associated messages  
**Authentication:** ✅ Required  
**Permission Checks:**
- **Admin Only:** SUPERADMIN or SECRETARY can delete
- Non-admins get 403 Forbidden

**Cascade Behavior:**
1. Deletes all messages in conversation
2. Deletes all conversation participants
3. Deletes the conversation itself

**Response:** 200 OK - { message: "Conversation supprimée avec succès" }

**CORS:** ✅ Enabled

---

### GET /api/conversations/{id}/messages
**HTTP Method:** GET  
**Path:** `/api/conversations/{id}/messages`  
**Description:** Retrieve all messages from a conversation  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MESSAGE.READ` permission required
- User must be a participant in the conversation (403 if not)

**Response:**
```json
[
  {
    "id": "msg-id",
    "conversationId": "conv-id",
    "senderId": "user-id",
    "content": "Message content",
    "attachments": ["url1", "url2"],
    "createdAt": "2026-02-15T...",
    "sender": { "id", "email", "fullName", ... }
  }
]
```

**Sorting:** Chronological (oldest first)

**CORS:** ✅ Enabled

---

### POST /api/conversations/{id}/messages
**HTTP Method:** POST  
**Path:** `/api/conversations/{id}/messages`  
**Description:** Send a message to a conversation  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MESSAGE.SEND` permission required
- User must be a participant

**Request Body:**
```json
{
  "content": "Message text",
  "senderId": "user-id",
  "attachments": ["url1", "url2"]  // Optional
}
```

**Side Effects:**
- Updates `lastRead` timestamp for sender
- Updates `conversation.updatedAt`

**Response:** 201 Created - Message object with sender details

**CORS:** ✅ Enabled

---

## MESSAGES

### DELETE /api/messages/{id}
**HTTP Method:** DELETE  
**Path:** `/api/messages/{id}`  
**Description:** Delete a specific message  
**Authentication:** ✅ Required (JWT)  
**Validations:** Message must exist  
**Response:** 200 OK - { success: true }

---

### GET /api/messages/unread/{userId}
**HTTP Method:** GET  
**Path:** `/api/messages/unread/{userId}`  
**Description:** Get unread message count for a user across all conversations  
**Authentication:** Optional (errors silently default to 0)  
**Logic:**
- Iterates through all conversations user participates in
- Counts messages created AFTER `lastRead` timestamp
- Returns total unread count

**Response:**
```json
{
  "unreadCount": 5
}
```

---

## GROUPS

### GET /api/groups
**HTTP Method:** GET  
**Path:** `/api/groups`  
**Description:** List all groups accessible to user  
**Authentication:** ✅ Required (JWT)  
**Permission Checks:**
- **Admins** (SUPERADMIN/SECRETARY): See all groups
- **Regular Users:** Only see groups they created or are members of

**Response:**
```json
[
  {
    "id": "group-id",
    "name": "Group Name",
    "createdBy": "user-id",
    "creator": { "id", "fullName", "email" },
    "members": [ { "userId": "..." } ],
    "memberDetails": [
      { "id", "fullName", "email" }
    ],
    "isMember": true,
    "canManage": true,  // Creator or admin
    "createdAt": "2026-02-15T..."
  }
]
```

---

### POST /api/groups
**HTTP Method:** POST  
**Path:** `/api/groups`  
**Description:** Create a new discussion group  
**Authentication:** ✅ Required  
**Request Body:**
```json
{
  "name": "Group Name",
  "memberIds": ["user-id-1", "user-id-2", ...]
}
```

**Validations:**
- name is required
- memberIds array required with at least 1 member

**Auto-Behavior:**
- Group creator is automatically added as `createdBy`
- Members are created in GroupMember junction table

**Response:** 201 Created - Group object with member details

---

### GET /api/groups/{id}
**HTTP Method:** GET  
**Path:** `/api/groups/{id}`  
**Description:** Get detailed info about a specific group  
**Authentication:** ✅ Required  
**Response:** Group object with all enriched member details

---

### POST /api/groups/{id}
**HTTP Method:** POST  
**Path:** `/api/groups/{id}`  
**Description:** Add members to an existing group  
**Authentication:** ✅ Required  
**Request Body:**
```json
{
  "memberIds": ["user-id-1", "user-id-2"]
}
```

**Validations:**
- Group must exist
- Skip members already in group
- Returns error if all provided IDs already members

**Response:** 201 Created - Updated group object with enriched details

---

### DELETE /api/groups/{id}
**HTTP Method:** DELETE  
**Path:** `/api/groups/{id}`  
**Description:** Delete a group  
**Authentication:** ✅ Required  
**Permission Checks:**
- Only group creator or admin (SUPERADMIN/SECRETARY) can delete

**Cascade Behavior:**
- All GroupMembers deleted via `onDelete: Cascade`
- All associated Messages deleted

**Response:** 200 OK - { success: true }

---

## BROADCASTS

### GET /api/broadcasts
**HTTP Method:** GET  
**Path:** `/api/broadcasts`  
**Description:** List all broadcasts accessible to user  
**Authentication:** ✅ Required  
**Permission Checks:**
- **Admins**: See all broadcasts
- **Regular Users**: Only see broadcasts they created or are recipients of

**Response:**
```json
[
  {
    "id": "broadcast-id",
    "name": "Broadcast Name",
    "createdBy": "user-id",
    "creator": { "id", "fullName", "email" },
    "recipients": [ { "userId": "..." } ],
    "recipientDetails": [
      { "id", "fullName", "email" }
    ],
    "isRecipient": true,
    "canManage": true,  // Creator or admin
    "createdAt": "2026-02-15T..."
  }
]
```

---

### POST /api/broadcasts
**HTTP Method:** POST  
**Path:** `/api/broadcasts`  
**Description:** Create a new broadcast message list  
**Authentication:** ✅ Required  
**Request Body:**
```json
{
  "name": "Broadcast Name",
  "recipientIds": ["user-id-1", "user-id-2", ...]
}
```

**Validations:**
- name is required
- recipientIds array required with at least 1 recipient

**Response:** 201 Created - Broadcast object

---

### GET /api/broadcasts/{id}
**HTTP Method:** GET  
**Path:** `/api/broadcasts/{id}`  
**Description:** Get details of a specific broadcast  
**Authentication:** ✅ Required  
**Response:** Broadcast object with recipient details

---

### POST /api/broadcasts/{id}
**HTTP Method:** POST  
**Path:** `/api/broadcasts/{id}`  
**Description:** Add recipients to an existing broadcast  
**Authentication:** ✅ Required  
**Request Body:**
```json
{
  "recipientIds": ["user-id-1", "user-id-2"]
}
```

**Response:** 201 Created - Updated broadcast with new recipients

---

### DELETE /api/broadcasts/{id}
**HTTP Method:** DELETE  
**Path:** `/api/broadcasts/{id}`  
**Description:** Delete a broadcast  
**Authentication:** ✅ Required  
**Permission Checks:**
- Only broadcast creator or admin can delete

**Cascade Behavior:**
- All BroadcastRecipients deleted
- All associated Messages deleted

**Response:** 200 OK - { success: true }

---

## USERS

### GET /api/users
**HTTP Method:** GET  
**Path:** `/api/users`  
**Description:** List all users  
**Authentication:** ✅ Required  
**Permission Checks:**
- **Admin Only**: SUPERADMIN, QUALITY_OFFICER, SECRETARY, STUDENT_MANAGER
- Non-admins get 403 Forbidden

**Admin Selection:**
```typescript
select: {
  id, email, fullName, profileImage,
  role: { name }
}
```

**Response:** 200 OK - Array of user objects

**CORS:** ✅ Enabled

---

### GET /api/user/current
**HTTP Method:** GET  
**Path:** `/api/user/current`  
**Description:** Get current logged-in user's profile  
**Authentication:** ✅ Required (Session-based)  
**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "fullName": "Full Name",
  "phone": "123456789",
  "profileImage": "image-url",
  "role": { "name": "STUDENT" }
}
```

---

### PATCH /api/user/profile
**HTTP Method:** PATCH  
**Path:** `/api/user/profile`  
**Description:** Update user's profile information  
**Authentication:** ✅ Required (JWT Token in Authorization header)  
**Request Body:**
```json
{
  "fullName": "New Name",
  "email": "newemail@example.com",
  "phone": "987654321",
  "password": "current-password",      // Required if changing password
  "newPassword": "new-password-hash"   // Optional
}
```

**Validations:**
- If email changes, must not be already in use (409 Conflict)
- If changing password, current password is required and verified with bcrypt
- newPassword must be provided if password is given

**Update Data:**
```typescript
{
  fullName, email, phone, password (hashed)
}
```

**Response:** 200 OK - Updated user object (without password)

---

## ADMIN - MESSAGING

### GET /api/admin/messaging
**HTTP Method:** GET  
**Path:** `/api/admin/messaging`  
**Description:** List all conversations (admin dashboard)  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MANAGE_DISCUSSIONS` permission required

**Response Format (Formatted for Frontend):**
```json
{
  "conversations": [
    {
      "id": "conv-id",
      "subject": "Discussion ou 'Dossier de {Student Name}'",
      "applicationId": "app-id",
      "studentName": "Student Full Name",
      "studentEmail": "student@example.com",
      "universityName": "University Name",
      "participants": [
        {
          "id": "user-id",
          "fullName": "Name",
          "role": "STUDENT" | "SUPERADMIN" | etc
        }
      ],
      "lastMessage": {
        "content": "First 100 chars...",
        "sender": "Sender Name",
        "date": "2026-02-15T..."
      },
      "updatedAt": "2026-02-15T..."
    }
  ]
}
```

**Includes:**
- application details (status, university, student)
- all participants with roles
- most recent message (preview)

---

### POST /api/admin/messaging
**HTTP Method:** POST  
**Path:** `/api/admin/messaging`  
**Description:** Create a conversation from admin panel  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MANAGE_DISCUSSIONS` permission required

**Request Body:**
```json
{
  "applicationId": "optional-app-id",
  "subject": "optional subject",
  "participantIds": ["user-id-1", "user-id-2"],
  "initialMessage": "First message content"  // Required
}
```

**Auto-Behavior:**
- Admin creator automatically added as participant
- If applicationId provided, application student also added
- Initial message created by admin

**Response:** 201 Created - Conversation with all data

---

### GET /api/admin/messaging/{id}
**HTTP Method:** GET  
**Path:** `/api/admin/messaging/{id}`  
**Description:** Get full conversation with all messages  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MANAGE_DISCUSSIONS` permission required

**Response:**
```json
{
  "conversation": {
    "id": "conv-id",
    "subject": "...",
    "application": { /* full app data */ },
    "participants": [
      {
        "userId": "...",
        "user": { id, fullName, email, role }
      }
    ],
    "messages": [
      {
        "id": "msg-id",
        "content": "...",
        "senderId": "...",
        "sender": { id, fullName, role },
        "createdAt": "..."
      }
    ]
  }
}
```

**Side Effect:**
- Updates admin's `lastRead` timestamp if they are a participant

---

### POST /api/admin/messaging/{id}
**HTTP Method:** POST  
**Path:** `/api/admin/messaging/{id}`  
**Description:** Send a message in conversation as admin  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MANAGE_DISCUSSIONS` permission required

**Request Body:**
```json
{
  "content": "Message content",
  "attachments": ["url1", "url2"]  // Optional
}
```

**Validations:**
- content required and must not be empty (after trim)

**Auto-Behavior:**
- If admin not a participant, automatically adds them
- Updates conversation.updatedAt

**Response:** 201 Created - Message object with admin details

---

## ADMIN - STUDENTS

### GET /api/admin/students
**HTTP Method:** GET  
**Path:** `/api/admin/students`  
**Description:** List all students with their data  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MANAGE_STUDENTS` OR `VIEW_STUDENTS` permission required
- Non-permitted admins get 403 with detailed message

**Response:**
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "student@example.com",
      "fullName": "Student Name",
      "phone": "123456789",
      "passportNumber": "XXXX",
      "specificDiseases": ["disease1"],
      "createdAt": "2026-01-01T...",
      "applications": [
        {
          "id": "app-id",
          "country": "Chine",
          "status": "SUBMITTED",
          "applicationFee": 500000
        }
      ],
      "_count": {
        "payments": 2,
        "applications": 1
      }
    }
  ]
}
```

**Sorted:** By createdAt (newest first)

---

### GET /api/admin/students/search?q={query}
**HTTP Method:** GET  
**Path:** `/api/admin/students/search`  
**Description:** Search for students by name or email  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MANAGE_STUDENTS` OR `VIEW_STUDENTS` required

**Query Parameters:**
- `q`: Search query (minimum 2 characters)

**Search Fields:**
- fullName (case-insensitive contains)
- email (case-insensitive contains)

**Response:**
```json
{
  "students": [
    {
      "id": "user-id",
      "fullName": "Name",
      "email": "email@example.com"
    }
  ]
}
```

**Limit:** Returns max 5 results

---

### GET /api/admin/students/{id}
**HTTP Method:** GET  
**Path:** `/api/admin/students/{id}`  
**Description:** Get detailed student profile  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MANAGE_STUDENTS` OR `VIEW_STUDENTS` required

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "fullName": "Name",
    "email": "email@example.com",
    "phone": "123456789",
    "createdAt": "2026-01-01T...",
    "updatedAt": "2026-02-01T...",
    "role": { "name": "STUDENT" },
    "passportNumber": "XXXX",
    "specificDiseases": ["disease1"],
    "applications": [
      {
        "id": "app-id",
        "university": { "name": "...", "city": "..." },
        "payments": [ /* all payments for this app */ ],
        "_count": { "documents": 3 }
      }
    ],
    "payments": [ /* standalone payments */ ]
  }
}
```

---

### DELETE /api/admin/students/{id}
**HTTP Method:** DELETE  
**Path:** `/api/admin/students/{id}`  
**Description:** Delete a student account and all associated data  
**Authentication:** ✅ Required  
**Permission Checks:**
- `MANAGE_STUDENTS` permission required (not just VIEW)

**Cascade Delete Order:**
1. Find all applications by user
2. Delete conversations linked to applications
3. Delete messages and conversation participants
4. Delete documents from those applications
5. Delete messages sent by user
6. Delete conversation participations
7. Null out document verifications by user
8. Delete payments by user
9. Delete activity logs by user
10. Delete all applications
11. Delete the user

**Response:** 200 OK - { success: true }

---

## ADMIN - ACTIVITIES

### GET /api/admin/activities
**HTTP Method:** GET  
**Path:** `/api/admin/activities`  
**Description:** Get activity log dashboard (SUPERADMIN only)  
**Authentication:** ✅ Required  
**Permission Checks:**
- `ALL_ACCESS` (SUPERADMIN only)
- Other roles get 403 with message

**Response:**
```json
{
  "activities": [
    {
      "id": "activity-id",
      "type": "DOC_VERIFIED" | "DOC_REJECTED" | "DOC_NEW" | "APP_NEW" | "APP_UPDATE",
      "title": "Activity Title",
      "description": "Detailed description",
      "date": "2026-02-15T...",
      "user": "Admin/Student Name",
      "color": "bg-green-500" | "bg-red-500" | etc
    }
  ]
}
```

**Data Sources:**
- Recent documents (10 latest) → DOC_VERIFIED/REJECTED/NEW
- Recent applications (5 latest) → APP_NEW/APP_UPDATE
- Activity logs (15 latest) → Various actions

**Processing:**
- All merged and sorted by date (newest first)
- Color-coded by status/type

---

## STUDENT-SPECIFIC ENDPOINTS

### GET /api/student/groups
**HTTP Method:** GET  
**Path:** `/api/student/groups`  
**Description:** Get all groups the student belongs to  
**Authentication:** ✅ Required (Session)  
**Response:**
```json
{
  "groups": [
    {
      "id": "group-id",
      "name": "Group Name",
      "creator": {
        "id": "creator-id",
        "fullName": "Creator Name",
        "profileImage": "url"
      },
      "memberCount": 5,
      "createdAt": "2026-01-01T..."
    }
  ]
}
```

**Privacy:** Member names NOT included for student access

---

### GET /api/student/groups/{groupId}/messages
**HTTP Method:** GET  
**Path:** `/api/student/groups/{groupId}/messages`  
**Description:** Get all messages in a group  
**Authentication:** ✅ Required (Session)  
**Permission Checks:**
- User must be a group member (403 if not)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-id",
      "content": "Message content",
      "senderId": "sender-id",
      "sender": {
        "id": "sender-id",
        "fullName": "Sender Name",
        "profileImage": "url"
      },
      "readReceipts": [
        {
          "userId": "reader-id",
          "user": { "id", "fullName" },
          "readAt": "2026-02-15T..."
        }
      ],
      "createdAt": "2026-02-15T..."
    }
  ]
}
```

**Sorted:** Chronological (oldest first)

---

### POST /api/student/groups/{groupId}/messages
**HTTP Method:** POST  
**Path:** `/api/student/groups/{groupId}/messages`  
**Description:** Send a message to a group  
**Authentication:** ✅ Required (Session)  
**Permission Checks:**
- User must be a member (403 if not)

**Request Body:**
```json
{
  "content": "Message content"
}
```

**Validation:**
- content required and must not be empty

**Response:** 201 Created - Message object

---

### GET /api/student/messages/{applicationId}
**HTTP Method:** GET  
**Path:** `/api/student/messages/{applicationId}`  
**Description:** Get conversation about a student's application  
**Authentication:** ✅ Required (Session)  
**Permission Checks:**
- Application must belong to current student (403 if not)

**Auto-Create:** If no conversation exists, creates one automatically

**Response:**
```json
{
  "conversation": {
    "id": "conv-id",
    "applicationId": "app-id",
    "subject": "Discussion sur mon dossier",
    "messages": [ /* ordered by createdAt asc */ ],
    "participants": [
      {
        "userId": "user-id",
        "user": {
          "id": "user-id",
          "fullName": "Name",
          "role": { "name": "SUPERADMIN" | "STUDENT" }
        }
      }
    ]
  }
}
```

**Message Details Include:**
- readReceipts from other participants

---

### POST /api/student/messages/{applicationId}
**HTTP Method:** POST  
**Path:** `/api/student/messages/{applicationId}`  
**Description:** Send a message in application discussion  
**Authentication:** ✅ Required  
**Permission Checks:**
- Application must belong to student (403 if not)

**Request Body:**
```json
{
  "content": "Message content"
}
```

**Validation:**
- content required and not empty

**Auto-Behavior:**
- Creates conversation if it doesn't exist
- Updates conversation.updatedAt

**Response:** 201 Created - { message, success: true }

---

### POST /api/student/messages/{applicationId}/mark-read
**HTTP Method:** POST  
**Path:** `/api/student/messages/{applicationId}/mark-read`  
**Description:** Mark all messages in conversation as read  
**Authentication:** ✅ Required  
**Permission Checks:**
- Application must belong to student (403 if not)

**Logic:**
- Finds all messages NOT sent by student
- Creates ReadReceipt entries with current timestamp
- Uses UPSERT to avoid duplicates

**Response:**
```json
{
  "success": true,
  "markedCount": 5
}
```

---

## PERMISSIONS & SECURITY

### Authentication
- **Bearer Token Format**: `Authorization: Bearer <token>`
- **JWT Verification**: Via `verifyToken()` from `/lib/jwt.ts`
- **Session-Based**: Some endpoints use `authService.getSession()`

### Permission Checks

#### Available Permission Enum (Prisma)
```
ALL_ACCESS              // SuperAdmin
MANAGE_STUDENTS         // Admin Étudiants
VIEW_STUDENTS
MANAGE_DOCUMENTS        // Admin Qualité/Docs
VALIDATE_DOCUMENTS    
MANAGE_DISCUSSIONS      // Admin Discussions
VIEW_FINANCES
MANAGE_FINANCES
MANAGE_UNIVERSITIES
```

#### Custom Permission Strings (JWT-based)
```
CONVERSATION.READ
CONVERSATION.CREATE
MESSAGE.READ
MESSAGE.SEND
```

### Admin Roles
- **SUPERADMIN**: Has `ALL_ACCESS` permission
- **SECRETARY**: Can perform admin operations
- **STUDENT_MANAGER**: Can manage students
- **QUALITY_OFFICER**: Can validate documents
- **STUDENT**: Regular student user

### CORS Configuration
**Enabled Endpoints:** Conversations, Messages, Groups, Broadcasts, Users  
**Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Rate Limiting & Validation
- No explicit rate limiting found
- Input validation present (required fields, type checks)
- Case-insensitive search available

---

## DATABASE MODELS

### Key Relationships

**User** (Central)
- ↔ Role (Many-to-One)
- → sentMessages (Message[]) "SentMessages" 
- → conversations (ConversationParticipant[])
- → groupsCreated (Group[]) "GroupCreator"
- → groupMembers (GroupMember[]) "GroupMembers"
- → broadcastsCreated (Broadcast[]) "BroadcastCreator"
- → broadcastRecipients (BroadcastRecipient[])
- → verifiedDocs (Document[]) "Verifier"
- → readReceipts (ReadReceipt[])

**Conversation**
- ↔ Application (One-to-One, optional)
- → messages (Message[], onDelete: Cascade)
- → participants (ConversationParticipant[])

**Message**
- ↔ Conversation (optional, onDelete: Cascade)
- ↔ Group (optional, onDelete: Cascade)
- ↔ Broadcast (optional, onDelete: Cascade)
- → sender (User)
- → readReceipts (ReadReceipt[])

**Group**
- → creator (User)
- → members (GroupMember[])
- → messages (Message[])

**Broadcast**
- → creator (User)
- → recipients (BroadcastRecipient[])
- → messages (Message[])

**ReadReceipt**
- Unique constraint: (messageId, userId)
- Links Message ↔ User for read tracking

---

## SUMMARY STATISTICS

| Resource | Total Endpoints | GET | POST | PATCH | DELETE |
|----------|-----------------|-----|------|-------|--------|
| Messages | 2 | 1 | 0 | 0 | 1 |
| Conversations | 3 | 2 | 1 | 1 | 1 |
| Conversations Messages | 2 | 1 | 1 | 0 | 0 |
| Groups | 4 | 2 | 2 | 0 | 1 |
| Broadcasts | 4 | 2 | 2 | 0 | 1 |
| Users | 3 | 2 | 0 | 1 | 0 |
| Admin Messaging | 2 | 1 | 1 | 0 | 0 |
| Admin Students | 3 | 2 | 0 | 0 | 1 |
| Admin Activities | 1 | 1 | 0 | 0 | 0 |
| Student Groups | 2 | 2 | 1 | 0 | 0 |
| Student Messages | 3 | 1 | 2 | 0 | 0 |
| **TOTAL** | **30+** | **19** | **13** | **1** | **5** |

---

## KEY FEATURES

✅ **Delete Operations:**
- Delete messages individually
- Delete entire conversations with cascade
- Delete groups with cascade
- Delete broadcasts with cascade
- Delete student accounts with full cascade

✅ **Edit/Update Operations:**
- Update user profile & password
- Add members to groups
- Add recipients to broadcasts
- Update conversation participants

✅ **Forward Functionality:**
- No explicit "forward" endpoint found
- Messages can be shared via broadcasts or groups

✅ **Read Tracking:**
- ReadReceipt model tracks message reads
- Mark-read endpoint for conversations
- ReadReceipt arrays returned in message responses

✅ **Privacy:**
- Student group views hide member details
- Permission-based access control
- User ownership checks on resources

---

## POTENTIAL SECURITY NOTES

1. **Message Deletion**: No ownership check on DELETE /api/messages/{id} (anyone with auth can delete)
2. **Profile Update**: Email uniqueness check present
3. **Password**: Hashed with bcrypt, requires current password verification
4. **Cascade Deletes**: Comprehensive cascade behavior for student deletion
5. **Admin-Only Operations**: Properly restricted to SUPERADMIN/SECRETARY where needed

---

*Last Updated: February 15, 2026*
*Document Version: 1.0*
