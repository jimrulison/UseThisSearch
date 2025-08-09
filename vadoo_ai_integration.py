#!/usr/bin/env python3
"""
Vadoo AI Integration for Use This Search Social Media Videos
Creates 5 different promotional videos with varying styles and lengths
"""

import requests
import json
import os
import time
from datetime import datetime
from typing import List, Dict, Optional
import asyncio

class VadooAIVideoGenerator:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://viralapi.vadoo.tv/api"
        self.headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }
        self.generated_videos = []
    
    def create_video(self, topic: str, voice: str = "Charlie", theme: str = "Hormozi_1", 
                    duration: str = "30-60", language: str = "English") -> Dict:
        """Generate a single video using Vadoo AI API"""
        
        payload = {
            "topic": topic,
            "voice": voice,
            "theme": theme,
            "language": language,
            "duration": duration
        }
        
        print(f"🎬 Creating video: {topic[:50]}...")
        print(f"   Voice: {voice} | Theme: {theme} | Duration: {duration}s")
        
        try:
            response = requests.post(
                f"{self.base_url}/generate_video",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                video_data = {
                    "video_id": result.get("vid"),
                    "topic": topic,
                    "voice": voice,
                    "theme": theme,
                    "duration": duration,
                    "status": "processing",
                    "created_at": datetime.now().isoformat(),
                    "payload": payload
                }
                self.generated_videos.append(video_data)
                print(f"✅ Video generation started - ID: {result.get('vid')}")
                return video_data
            else:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                return {"error": f"API Error: {response.status_code}", "details": response.text}
                
        except requests.RequestException as e:
            print(f"❌ Request failed: {str(e)}")
            return {"error": "Request failed", "details": str(e)}
    
    def create_promotional_video_series(self) -> List[Dict]:
        """Create 5 different promotional videos for Use This Search"""
        
        print("🚀 Starting 'Use This Search' Video Campaign Creation")
        print("=" * 60)
        
        videos = []
        
        # Video 1: Flashy/Viral Style (15-20 seconds)
        print("\n📹 VIDEO 1: FLASHY/VIRAL STYLE")
        video1 = self.create_video(
            topic="🔥 STOP wasting time on basic keyword research! Use This Search's AI finds HIDDEN opportunities that AnswerThePublic misses. Get 10x more content ideas, SEO insights, and profit from keywords your competitors don't even know exist!",
            voice="Emily",  # Energetic voice
            theme="MrBeast_1",  # Engaging viral theme
            duration="30-60"  # Standard duration format
        )
        videos.append({"style": "Flashy/Viral", "length": "15-20s", **video1})
        time.sleep(3)  # Rate limiting
        
        # Video 2: Professional/Business (30-45 seconds)
        print("\n📹 VIDEO 2: PROFESSIONAL/BUSINESS STYLE")
        video2 = self.create_video(
            topic="Transform your content strategy with Use This Search - the professional AI-powered keyword research platform. Unlike basic tools, we provide complete workflow solutions: from keyword discovery to blog titles, FAQs, and social media content. Trusted by agencies and enterprises for multi-user collaboration, advanced analytics, and superior results.",
            voice="Charlie",  # Professional voice
            theme="Hormozi_1",  # Business theme
            duration="30-60"  # Standard duration format
        )
        videos.append({"style": "Professional/Business", "length": "30-45s", **video2})
        time.sleep(3)
        
        # Video 3: Animated/Fun (20-30 seconds)
        print("\n📹 VIDEO 3: ANIMATED/FUN STYLE")
        video3 = self.create_video(
            topic="Meet your new keyword research superhero! 🦸‍♂️ Use This Search doesn't just find keywords - it creates your entire content strategy! Generate blog titles, FAQs, hashtags, and social posts with AI magic. It's like having a content team in your pocket! Ready to level up your SEO game?",
            voice="Alice",  # Friendly, animated voice
            theme="Joe_Rogan_1",  # Creative theme
            duration="30-60"  # Standard duration format
        )
        videos.append({"style": "Animated/Fun", "length": "20-30s", **video3})
        time.sleep(3)
        
        # Video 4: Data-Driven/Educational (45-60 seconds)
        print("\n📹 VIDEO 4: DATA-DRIVEN/EDUCATIONAL STYLE")
        video4 = self.create_video(
            topic="Here's why Use This Search outperforms AnswerThePublic: 7 AI content generation tools, multi-user team management, unlimited company workspaces, advanced analytics, and enterprise-grade features. We don't just show you keywords - we generate blog titles, meta descriptions, FAQs, and complete content briefs. Save 10+ hours per week while creating better content that actually ranks and converts.",
            voice="Dave",  # Educational voice
            theme="Hormozi_1",  # Professional educational theme
            duration="60-90"  # Longer for educational content
        )
        videos.append({"style": "Data-Driven/Educational", "length": "45-60s", **video4})
        time.sleep(3)
        
        # Video 5: Quick Hook/TikTok Style (15 seconds)
        print("\n📹 VIDEO 5: QUICK HOOK/TIKTOK STYLE")
        video5 = self.create_video(
            topic="POV: You discover Use This Search and realize you've been wasting time on basic keyword tools 😱 AI generates your blog titles, FAQs, social posts AND finds hidden keywords your competitors miss. This is the content creation cheat code! 🚀",
            voice="Emily",  # Quick, energetic
            theme="MrBeast_1",  # Social media optimized
            duration="30-60"  # Standard duration format
        )
        videos.append({"style": "Quick Hook/TikTok", "length": "15s", **video5})
        
        print("\n" + "=" * 60)
        print(f"🎉 Campaign Complete! Generated {len(videos)} videos")
        print("⏱️ Videos are now processing and will be ready in 2-3 minutes")
        
        return videos
    
    def get_video_status(self, video_id: str) -> Dict:
        """Check the status of a video generation"""
        # Note: This would typically query the Vadoo AI API for status
        # For now, we'll return a processing status
        return {
            "video_id": video_id,
            "status": "processing",
            "message": "Video is being generated. Check back in 2-3 minutes."
        }
    
    def save_campaign_summary(self, videos: List[Dict], filename: str = "/app/vadoo_campaign_summary.json"):
        """Save campaign summary to file"""
        
        campaign_data = {
            "campaign_name": "Use This Search Social Media Campaign",
            "created_at": datetime.now().isoformat(),
            "total_videos": len(videos),
            "api_key_used": self.api_key[:10] + "...",  # Partial key for reference
            "videos": videos,
            "estimated_completion": "2-3 minutes from creation",
            "platforms_optimized": ["Instagram", "TikTok", "YouTube Shorts", "LinkedIn", "Twitter"],
            "campaign_objectives": [
                "Increase brand awareness",
                "Showcase competitive advantages",
                "Drive platform signups",
                "Highlight AI capabilities",
                "Target different audience segments"
            ]
        }
        
        with open(filename, 'w') as f:
            json.dump(campaign_data, f, indent=2)
        
        print(f"💾 Campaign summary saved to: {filename}")
        return campaign_data

def main():
    """Main execution function"""
    
    # Your Vadoo AI API Key
    api_key = "VtvMYaKRdlfwpwVoN9ve9OK2Dw_1yUqIpgFXJ8EBdXo"
    
    # Initialize the video generator
    generator = VadooAIVideoGenerator(api_key)
    
    # Create the 5-video campaign
    campaign_videos = generator.create_promotional_video_series()
    
    # Save campaign summary
    campaign_summary = generator.save_campaign_summary(campaign_videos)
    
    # Display results
    print("\n" + "🎯 CAMPAIGN SUMMARY" + "\n" + "=" * 50)
    for i, video in enumerate(campaign_videos, 1):
        print(f"\nVideo {i}: {video['style']}")
        print(f"  Length: {video['length']}")
        print(f"  Video ID: {video.get('video_id', 'Error')}")
        print(f"  Status: {video.get('status', 'Error')}")
        if 'error' in video:
            print(f"  Error: {video['error']}")
    
    print(f"\n✨ All videos are processing and will be ready shortly!")
    print(f"📊 Full campaign details saved to: vadoo_campaign_summary.json")
    
    return campaign_videos

if __name__ == "__main__":
    main()