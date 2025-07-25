import logging
import openai
from typing import Dict, List, Optional, Any
from app.config.settings import settings
from app.database import style_profiles_collection, style_quizzes_collection, user_interactions_collection
from datetime import datetime

logger = logging.getLogger(__name__)

class StyleChatbot:
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
    async def start_conversation(self, user_id: str) -> Dict[str, Any]:
        """
        Start a new style chat conversation with personalized initial questions.
        """
        try:
            # Get user's existing style profile
            user_profile = await self._get_user_profile(user_id)
            
            # Generate personalized initial message
            prompt = f"""
You are a world-class fashion expert and personal stylist with deep knowledge of style theory, trends, and personal branding. You have access to the user's complete style profile and can provide expert-level advice.

User's Complete Style Profile:
{user_profile.get('summary', 'No existing profile')}

Style Categories: {user_profile.get('style_categories', [])}
Color Preferences: {user_profile.get('color_preferences', [])}
Fit Preferences: {user_profile.get('fit_preferences', [])}
Lifestyle: {user_profile.get('lifestyle', 'Not specified')}
Budget Range: {user_profile.get('budget_range', 'Not specified')}
Occasion Preferences: {user_profile.get('occasion_preferences', [])}
Profile Last Updated: {user_profile.get('last_updated', 'Never')}

As a fashion expert, start a conversation that:
1. Acknowledges their existing style profile with expert insight
2. Offers to help them refine, evolve, or expand their style
3. Asks 1-2 strategic questions to understand their current goals
4. Positions yourself as their personal style consultant

Be confident, knowledgeable, and show deep understanding of their style. You're not just a chatbot - you're their personal fashion expert.

Respond with a JSON object containing:
{{
    "message": "Your expert-level response (2-3 sentences max)",
    "next_questions": ["Example user question 1", "Example user question 2"],
    "suggestions": ["Example quick user prompt 1", "Example quick user prompt 2"]
}}
For both 'next_questions' and 'suggestions', provide example questions or prompts that a user might ask you, the fashion expert, to further the conversation. Phrase them in the first person, as if the user is asking for advice or information (e.g., "How can I add more variety to my wardrobe?" or "What are some comfortable yet stylish fabrics for summer?").
"""
            
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a world-class fashion expert and personal stylist. You have deep knowledge of the user's style profile and provide expert-level, personalized advice. Be confident, knowledgeable, and show understanding of their unique style. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            
            # Log the conversation start
            await self._log_interaction(user_id, "chat_start", {
                "message": result["message"],
                "questions_asked": result.get("next_questions", [])
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error starting chat conversation: {e}")
            return {
                "message": "I'm your personal fashion expert! I can see your style profile and I'm here to help you elevate your look. What's your biggest style goal right now?",
                "next_questions": [
                    "What's your biggest style goal?",
                    "How would you like to evolve your current style?"
                ],
                "suggestions": [
                    "Get personalized outfit recommendations",
                    "Explore style evolution strategies"
                ]
            }
    
    async def process_message(self, user_id: str, message: str, context: Dict = None) -> Dict[str, Any]:
        """
        Process a user message and provide expert-level personalized style advice.
        """
        try:
            # Get user's style profile and chat history
            user_profile = await self._get_user_profile(user_id)
            chat_history = await self._get_chat_history(user_id)
            
            # Build context for the AI
            context_prompt = f"""
You are a world-class fashion expert and personal stylist. You have deep knowledge of the user's complete style profile and can provide expert-level, personalized advice.

User's Complete Style Profile:
{user_profile.get('summary', 'No existing profile')}

Style Categories: {user_profile.get('style_categories', [])}
Color Preferences: {user_profile.get('color_preferences', [])}
Fit Preferences: {user_profile.get('fit_preferences', [])}
Lifestyle: {user_profile.get('lifestyle', 'Not specified')}
Budget Range: {user_profile.get('budget_range', 'Not specified')}
Occasion Preferences: {user_profile.get('occasion_preferences', [])}
Profile Last Updated: {user_profile.get('last_updated', 'Never')}

Recent Conversation:
{self._format_chat_history(chat_history) if chat_history else 'No recent history'}

User's Current Message: "{message}"

As their personal fashion expert, provide a response that:
1. Shows deep understanding of their unique style profile
2. Offers expert-level, personalized advice based on their preferences
3. Suggests specific improvements or evolutions to their style
4. Asks strategic questions to help them achieve their style goals
5. Demonstrates fashion expertise and confidence

IMPORTANT: 
- You're their personal fashion expert, not just a chatbot
- Reference their specific style profile and preferences
- Provide expert-level insights and recommendations
- Be confident and knowledgeable about fashion
- Keep responses concise but impactful
- Focus on helping them improve and evolve their style
- If they ask questions, provide expert answers first, then ask strategic follow-ups

Respond with a JSON object:
{{
    "message": "Your expert-level response",
    "style_insights": {{"key_insight": "value"}},
    "next_questions": ["Example user follow-up question"],
    "suggestions": ["Example quick user prompt"]
}}
For both 'next_questions' and 'suggestions', provide example questions or prompts that a user might ask you, the fashion expert, to further the conversation. Phrase them in the first person, as if the user is asking for advice or information (e.g., "How can I add more variety to my wardrobe?" or "What are some comfortable yet stylish fabrics for summer?").
"""
            
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a world-class fashion expert and personal stylist. You have deep knowledge of the user's style profile and provide expert-level, personalized advice. Be confident, knowledgeable, and show understanding of their unique style. Always respond with valid JSON."},
                    {"role": "user", "content": context_prompt}
                ],
                temperature=0.8
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            
            # Log the interaction
            await self._log_interaction(user_id, "chat_message", {
                "user_message": message,
                "bot_response": result["message"],
                "insights": result.get("style_insights", {}),
                "context": context
            })
            
            # Update user's style profile based on new insights
            if result.get("style_insights"):
                await self._update_style_profile(user_id, result["style_insights"])
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing chat message: {e}")
            return {
                "message": "I'd love to help you with that! Based on your style profile, I can provide some expert recommendations. What specific aspect of your style would you like to improve?",
                "style_insights": {},
                "next_questions": ["What specific style area would you like to focus on?"],
                "suggestions": ["Get personalized recommendations"]
            }
    
    async def get_user_style_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive style profile insights from chat interactions.
        """
        try:
            # Get existing profile
            profile = style_profiles_collection.find_one({"user_id": user_id})
            
            # Get chat insights
            chat_insights = await self._analyze_chat_insights(user_id)
            
            return {
                "existing_profile": profile or {},
                "chat_insights": chat_insights,
                "recommendations": await self._generate_recommendations(user_id),
                "style_evolution": await self._get_style_evolution(user_id)
            }
            
        except Exception as e:
            logger.error(f"Error getting style profile: {e}")
            return {"error": "Failed to get style profile"}
    
    async def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user's existing style profile with comprehensive details."""
        profile = style_profiles_collection.find_one({"user_id": user_id})
        quiz_data = style_quizzes_collection.find_one({"user_id": user_id})
        
        if profile:
            return {
                "summary": profile.get("style_summary", ""),
                "preferences": profile.get("style_preferences", []),
                "last_updated": profile.get("updated_at", ""),
                "style_categories": profile.get("style_categories", []),
                "color_preferences": profile.get("color_preferences", []),
                "fit_preferences": profile.get("fit_preferences", []),
                "lifestyle": profile.get("lifestyle", ""),
                "budget_range": profile.get("budget_range", ""),
                "occasion_preferences": profile.get("occasion_preferences", [])
            }
        elif quiz_data:
            # If no profile but quiz data exists, create a basic summary
            return {
                "summary": f"Based on your style quiz, you prefer {quiz_data.get('style_preference', 'versatile')} styles with {quiz_data.get('color_preference', 'neutral')} colors.",
                "preferences": [quiz_data.get('style_preference', ''), quiz_data.get('color_preference', '')],
                "last_updated": quiz_data.get("created_at", ""),
                "style_categories": [quiz_data.get('style_preference', '')],
                "color_preferences": [quiz_data.get('color_preference', '')],
                "fit_preferences": [quiz_data.get('fit_preference', '')],
                "lifestyle": quiz_data.get('lifestyle', ''),
                "budget_range": quiz_data.get('budget_range', ''),
                "occasion_preferences": [quiz_data.get('occasion', '')]
            }
        else:
            return {
                "summary": "No existing style profile - ready to discover your unique style!",
                "preferences": [],
                "last_updated": "Never",
                "style_categories": [],
                "color_preferences": [],
                "fit_preferences": [],
                "lifestyle": "",
                "budget_range": "",
                "occasion_preferences": []
            }
    
    async def _get_chat_history(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get recent chat history for context."""
        interactions = list(user_interactions_collection.find({
            "user_id": user_id,
            "interaction_type": {"$in": ["chat_start", "chat_message"]}
        }).sort("created_at", -1).limit(limit))
        
        # Build a more detailed history including user messages
        history = []
        for i in interactions:
            if i["interaction_type"] == "chat_message":
                metadata = i.get("metadata", {})
                history.append({
                    "type": "user_message",
                    "content": metadata.get("user_message", ""),
                    "bot_response": metadata.get("bot_response", "")
                })
            else:
                history.append({
                    "type": "chat_start",
                    "content": i.get("metadata", {}).get("message", "")
                })
        
        return history
    
    async def _log_interaction(self, user_id: str, interaction_type: str, metadata: Dict):
        """Log chat interactions for analysis."""
        interaction = {
            "user_id": user_id,
            "interaction_type": interaction_type,
            "metadata": metadata,
            "created_at": datetime.utcnow()
        }
        user_interactions_collection.insert_one(interaction)
    
    async def _update_style_profile(self, user_id: str, insights: Dict):
        """Update user's style profile with new insights from chat."""
        try:
            # Get current profile
            current_profile = style_profiles_collection.find_one({"user_id": user_id})
            
            if current_profile:
                # Update existing profile
                style_profiles_collection.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "updated_at": datetime.utcnow(),
                            "chat_insights": insights
                        },
                        "$push": {
                            "style_preferences": {
                                "$each": insights.get("new_preferences", [])
                            }
                        }
                    }
                )
            else:
                # Create new profile
                new_profile = {
                    "user_id": user_id,
                    "style_summary": insights.get("style_summary", ""),
                    "style_preferences": insights.get("new_preferences", []),
                    "chat_insights": insights,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                style_profiles_collection.insert_one(new_profile)
                
        except Exception as e:
            logger.error(f"Error updating style profile: {e}")
    
    async def _analyze_chat_insights(self, user_id: str) -> Dict[str, Any]:
        """Analyze chat interactions to extract style insights."""
        try:
            # Get all chat interactions
            interactions = list(user_interactions_collection.find({
                "user_id": user_id,
                "interaction_type": {"$in": ["chat_start", "chat_message"]}
            }).sort("created_at", -1))
            
            if not interactions:
                return {"message": "No chat history available"}
            
            # Analyze patterns in chat
            insights = {
                "total_interactions": len(interactions),
                "frequent_topics": [],
                "style_preferences": [],
                "challenges_mentioned": [],
                "goals_mentioned": []
            }
            
            # Extract insights from chat metadata
            for interaction in interactions:
                metadata = interaction.get("metadata", {})
                if "insights" in metadata:
                    insights.update(metadata["insights"])
            
            return insights
            
        except Exception as e:
            logger.error(f"Error analyzing chat insights: {e}")
            return {"error": "Failed to analyze chat insights"}
    
    async def _generate_recommendations(self, user_id: str) -> List[str]:
        """Generate personalized style recommendations based on chat history."""
        try:
            profile = await self._get_user_profile(user_id)
            insights = await self._analyze_chat_insights(user_id)
            
            prompt = f"""
Based on the user's style profile and chat insights, generate 5 personalized style recommendations.

Profile: {profile.get('summary', 'No profile')}
Insights: {insights}

Generate specific, actionable recommendations that would help this user improve their style.
"""
            
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a fashion expert. Provide specific style recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            return result.get("recommendations", [])
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return ["Focus on comfort and confidence", "Experiment with new styles gradually"]
    
    async def _get_style_evolution(self, user_id: str) -> Dict[str, Any]:
        """Get style evolution insights from chat interactions."""
        try:
            interactions = list(user_interactions_collection.find({
                "user_id": user_id,
                "interaction_type": "chat_message"
            }).sort("created_at", 1))
            
            if not interactions:
                return {"evolution": "No chat history available"}
            
            # Analyze style preferences over time
            early_preferences = []
            recent_preferences = []
            
            mid_point = len(interactions) // 2
            
            for i, interaction in enumerate(interactions):
                insights = interaction.get("metadata", {}).get("insights", {})
                if i < mid_point:
                    early_preferences.extend(list(insights.keys()))
                else:
                    recent_preferences.extend(list(insights.keys()))
            
            return {
                "early_preferences": list(set(early_preferences)),
                "recent_preferences": list(set(recent_preferences)),
                "total_interactions": len(interactions)
            }
            
        except Exception as e:
            logger.error(f"Error getting style evolution: {e}")
            return {"error": "Failed to get style evolution"}

    def _format_chat_history(self, chat_history: List[Dict]) -> str:
        """Format chat history for display in prompt."""
        formatted_history = []
        for interaction in chat_history[-5:]:  # Only last 5 interactions
            if interaction["type"] == "user_message":
                formatted_history.append(f"User: {interaction['content']}")
                if interaction.get('bot_response'):
                    formatted_history.append(f"Bot: {interaction['bot_response']}")
            elif interaction["type"] == "chat_start":
                formatted_history.append(f"Bot: {interaction['content']}")
        return "\n".join(formatted_history) 