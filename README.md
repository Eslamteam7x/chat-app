# ChatApp - Real-Time Messaging Application

A professional full-stack real-time chat application similar to WhatsApp Web, built with modern web technologies.

## Features

### 💬 Real-Time Messaging
- Instant message delivery via Socket.IO
- Online/Offline status with real-time updates
- Typing indicator
- Last seen tracking
- Message delivery status (sent, delivered, read)
- Optimistic UI updates

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting and Helmet security headers
- Input validation and sanitization
- XSS and CSRF protection

### 📁 File Sharing
- Image sharing with preview
- File uploads (documents, PDFs, etc.)
- Audio recording and playback
- Drag & drop support
- Cloudinary integration for cloud storage

### 🎨 User Experience
- WhatsApp-like responsive design
- Dark mode and light mode
- Framer Motion animations
- Emoji picker integration
- Infinite scroll for messages
- Pinned conversations
- Search conversations
- Message reply and forward
- Message editing and deletion
- Group chat support

### 📱 PWA Support
- Installable on mobile and desktop
- Offline support via Service Worker
- Push notification ready

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **Socket.IO Client** - Real-time communication
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Dropzone** - File uploads

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.IO** - WebSocket server
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting

## Project Structure

```
chat-app/
├── server/                    # Backend
│   ├── src/
│   │   ├── config/           # Database & Cloudinary config
│   │   ├── controllers/      # Route handlers
│   │   ├── middlewares/       # Auth, upload, error handling
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   ├── sockets/          # Socket.IO event handlers
│   │   ├── utils/            # Helper functions
│   │   └── index.js          # Server entry point
│   ├── uploads/              # Local file storage
│   ├── package.json
│   └── .env.example
│
├── client/                    # Frontend
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   │   ├── auth/         # Auth-related components
│   │   │   ├── chat/         # Chat UI components
│   │   │   ├── common/       # Reusable components
│   │   │   └── settings/     # Settings components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   ├── sockets/          # Socket.IO client setup
│   │   ├── store/            # Zustand stores
│   │   └── utils/            # Utility functions
│   ├── public/               # Static assets
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Cloudinary account (for file uploads)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chat-app
```

2. Install server dependencies:
```bash
cd server
cp .env.example .env
npm install
```

3. Configure server `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. Install client dependencies:
```bash
cd ../client
cp .env.example .env
npm install
```

5. Configure client `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Running the Application

Start MongoDB:
```bash
mongod
```

Start the server (development):
```bash
cd server
npm run dev
```

Start the client (development):
```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Server:
```bash
cd server
NODE_ENV=production npm start
```

Client:
```bash
cd client
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token

### Users
- `GET /api/users/search?query=` - Search users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/avatar` - Update avatar
- `GET /api/users/contacts` - Get contacts
- `POST /api/users/contacts` - Add contact
- `DELETE /api/users/contacts/:contactId` - Remove contact
- `POST /api/users/block/:userId` - Block user
- `POST /api/users/unblock/:userId` - Unblock user

### Conversations
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id` - Get conversation
- `PUT /api/conversations/:id/group` - Update group
- `POST /api/conversations/:id/participants` - Add participants
- `DELETE /api/conversations/:id/participants/:userId` - Remove participant
- `POST /api/conversations/:id/leave` - Leave group
- `POST /api/conversations/:id/pin` - Pin/unpin conversation

### Messages
- `GET /api/messages/:conversationId` - Get messages (paginated)
- `POST /api/messages/:conversationId` - Send message
- `PUT /api/messages/:messageId/edit` - Edit message
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/read` - Mark messages as read

## Socket.IO Events

### Client → Server
- `join_conversations` - Join all user conversations
- `join_conversation` - Join specific conversation
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `send_message` - Send a message
- `mark_read` - Mark messages as read
- `delete_message` - Delete a message
- `edit_message` - Edit a message

### Server → Client
- `new_message` - New message received
- `message_sent` - Message sent confirmation
- `message_edited` - Message was edited
- `message_deleted` - Message was deleted
- `messages_read` - Messages were read
- `user_typing` - User is typing
- `user_stop_typing` - User stopped typing
- `user_status` - User online/offline status
- `conversation_updated` - Conversation last message updated

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens with configurable expiration
- HTTP security headers via Helmet
- Rate limiting on API endpoints
- Input validation and sanitization
- File type validation
- CORS configured for client origin only
- Refresh token rotation

## Performance

- Lazy loading with React dynamic imports
- Infinite scroll for message history
- Optimistic UI updates
- Socket.IO with WebSocket transport
- MongoDB indexes on frequently queried fields
- Image optimization via Cloudinary
- CSS animations with GPU acceleration

## License

MIT
