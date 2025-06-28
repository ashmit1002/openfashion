# OpenFashion - AI-Powered Fashion Analyzer

OpenFashion is a comprehensive fashion application that combines AI-powered image analysis, reverse image search, and personalized style recommendations to help users discover and curate their perfect wardrobe.

## Features

### 🎯 Core Features
- **AI Image Analysis**: Upload clothing items and get detailed analysis including colors, patterns, style categories, and recommendations
- **Reverse Image Search**: Find similar items across the web using advanced image recognition
- **Google Shopping Integration**: Get shopping results based on AI-generated queries from image analysis
- **Personalized Style Chatbot**: Interactive AI assistant for style advice and wardrobe planning
- **Closet Management**: Organize and categorize your wardrobe items
- **Wishlist**: Save items you love for future reference
- **User Profiles**: Personalized experience with style preferences and history

### 🤖 Style Chatbot
The application features an intelligent style chatbot that provides:
- **Personalized Style Advice**: Get recommendations based on your preferences and lifestyle
- **Wardrobe Planning**: Receive suggestions for outfit combinations and shopping recommendations
- **Style Evolution Tracking**: Monitor how your style preferences change over time
- **Interactive Conversations**: Natural language interactions with quick suggestion buttons
- **Profile Integration**: Leverages your existing style quiz data and chat history

#### How to Use the Chatbot:
1. **Floating Chat Button**: Click the chat icon in the bottom-right corner of any page
2. **Dedicated Chat Page**: Visit `/chat` for a full-screen chat experience
3. **Navigation Menu**: Access via the "Style Chat" link in the main navigation

### 🔍 Search & Discovery
- **User Search**: Find and explore other users' closets and style preferences
- **Advanced Filtering**: Filter items by category, color, style, and more
- **Smart Recommendations**: AI-powered suggestions based on your style profile

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Real-time Updates**: Instant feedback and live chat interactions
- **Accessibility**: Designed with accessibility best practices

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icons
- **Sonner**: Toast notifications

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and session management
- **OpenAI GPT-4**: AI-powered chatbot and analysis
- **SerpAPI**: Google Shopping integration
- **AWS S3**: Image storage
- **Remove.bg API**: Background removal for images

### AI & ML
- **OpenAI Vision API**: Image analysis and understanding
- **GPT-4**: Natural language processing for chatbot
- **Custom ML Models**: Style classification and recommendation systems

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL database
- Redis server
- OpenAI API key
- SerpAPI key
- AWS S3 credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd openfashion
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create `.env` files in both frontend and backend directories with your API keys and configuration.

5. **Start the development servers**
   ```bash
   # Backend (from backend directory)
   uvicorn app.main:app --reload
   
   # Frontend (from frontend directory)
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Image Analysis
- `POST /upload/analyze` - Analyze uploaded image
- `POST /upload/remove-background` - Remove image background

### Shopping & Search
- `GET /users/shopping/light/search` - Google Shopping Light search
- `GET /users/similar` - Find similar items

### Chatbot
- `GET /users/chat/style/start` - Start a new chat session
- `POST /users/chat/style` - Send a message to the chatbot
- `GET /users/chat/style/profile` - Get user's style profile from chat

### User Management
- `GET /users/profile/{username}` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/search` - Search for users

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@openfashion.com or create an issue in the repository.
