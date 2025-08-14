"""
Keyword Clustering Engine for Use This Search
Premium feature for annual subscribers only
"""

import numpy as np
import asyncio
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import json
import re
from collections import defaultdict, Counter
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import PCA
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import spacy

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')
    
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

@dataclass
class KeywordCluster:
    """Represents a cluster of related keywords"""
    id: str
    name: str
    primary_keyword: str
    keywords: List[str]
    search_intent: str
    topic_theme: str
    search_volume_total: int
    difficulty_average: float
    content_suggestions: List[str]
    buyer_journey_stage: str
    priority_score: float
    created_at: datetime
    
@dataclass
class ClusterAnalysis:
    """Complete clustering analysis results"""
    total_keywords: int
    total_clusters: int
    clusters: List[KeywordCluster]
    unclustered_keywords: List[str]
    content_gaps: List[Dict]
    pillar_opportunities: List[Dict]
    processing_time: float

class KeywordClusteringEngine:
    """Advanced keyword clustering with semantic analysis and intent detection"""
    
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()
        self.vectorizer = None
        self.intent_patterns = self._load_intent_patterns()
        self.buyer_journey_patterns = self._load_buyer_journey_patterns()
        
        # Try to load spaCy model, fallback to basic processing if not available
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Warning: spaCy model 'en_core_web_sm' not found. Using basic processing.")
            self.nlp = None
    
    def _load_intent_patterns(self) -> Dict[str, List[str]]:
        """Load search intent classification patterns"""
        return {
            'informational': [
                'what is', 'how to', 'why', 'when', 'where', 'guide', 'tutorial', 
                'learn', 'understand', 'explain', 'definition', 'meaning', 'help',
                'tips', 'advice', 'examples', 'benefits', 'advantages', 'disadvantages'
            ],
            'commercial': [
                'best', 'top', 'review', 'compare', 'comparison', 'vs', 'versus',
                'alternative', 'option', 'choice', 'recommend', 'rating', 'ranking',
                'solution', 'tool', 'software', 'service', 'provider', 'company'
            ],
            'transactional': [
                'buy', 'purchase', 'price', 'cost', 'cheap', 'discount', 'deal',
                'coupon', 'sale', 'order', 'shop', 'store', 'online', 'download',
                'free trial', 'signup', 'subscribe', 'get started', 'pricing'
            ],
            'navigational': [
                'login', 'sign in', 'dashboard', 'account', 'profile', 'settings',
                'contact', 'support', 'official', 'website', 'homepage'
            ]
        }
    
    def _load_buyer_journey_patterns(self) -> Dict[str, List[str]]:
        """Load buyer journey stage classification patterns"""
        return {
            'awareness': [
                'what is', 'how to', 'why', 'benefits', 'importance', 'guide',
                'introduction', 'basics', 'beginner', 'start', 'learn', 'understand'
            ],
            'consideration': [
                'best', 'top', 'compare', 'comparison', 'vs', 'versus', 'alternative',
                'option', 'features', 'pros and cons', 'review', 'evaluation'
            ],
            'decision': [
                'price', 'pricing', 'cost', 'buy', 'purchase', 'trial', 'demo',
                'discount', 'coupon', 'plan', 'subscription', 'get started'
            ]
        }
    
    def preprocess_keywords(self, keywords: List[str]) -> List[str]:
        """Clean and preprocess keywords for clustering"""
        processed = []
        
        for keyword in keywords:
            # Convert to lowercase
            keyword = keyword.lower().strip()
            
            # Remove special characters but keep spaces and hyphens
            keyword = re.sub(r'[^\w\s-]', '', keyword)
            
            # Remove extra whitespace
            keyword = ' '.join(keyword.split())
            
            if keyword and len(keyword) > 2:
                processed.append(keyword)
        
        return list(set(processed))  # Remove duplicates
    
    def extract_features(self, keywords: List[str]) -> np.ndarray:
        """Extract TF-IDF features from keywords"""
        
        # Create expanded text for each keyword by including variations
        expanded_keywords = []
        for keyword in keywords:
            # Add the original keyword
            expanded_text = keyword
            
            # Add tokenized version
            tokens = word_tokenize(keyword)
            expanded_text += " " + " ".join([
                self.lemmatizer.lemmatize(token.lower()) 
                for token in tokens 
                if token.lower() not in self.stop_words and token.isalpha()
            ])
            
            expanded_keywords.append(expanded_text)
        
        # Use TF-IDF vectorization
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 3),
            stop_words='english',
            lowercase=True,
            min_df=1,
            max_df=0.95
        )
        
        feature_matrix = self.vectorizer.fit_transform(expanded_keywords)
        return feature_matrix.toarray()
    
    def determine_optimal_clusters(self, features: np.ndarray, max_clusters: int = 15) -> int:
        """Determine optimal number of clusters using elbow method"""
        
        if len(features) < 3:
            return 1
        
        max_k = min(max_clusters, len(features) - 1)
        
        if max_k < 2:
            return 1
        
        inertias = []
        k_range = range(2, max_k + 1)
        
        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(features)
            inertias.append(kmeans.inertia_)
        
        # Find elbow point
        if len(inertias) < 2:
            return 2
        
        # Simple elbow detection
        diffs = [inertias[i] - inertias[i+1] for i in range(len(inertias)-1)]
        if not diffs:
            return 2
        
        elbow_idx = diffs.index(max(diffs))
        optimal_k = k_range[elbow_idx]
        
        return optimal_k
    
    def classify_search_intent(self, keyword: str) -> str:
        """Classify keyword search intent"""
        keyword_lower = keyword.lower()
        
        intent_scores = defaultdict(int)
        
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if pattern in keyword_lower:
                    intent_scores[intent] += 1
        
        if not intent_scores:
            return 'informational'  # Default
        
        return max(intent_scores.items(), key=lambda x: x[1])[0]
    
    def classify_buyer_journey_stage(self, keyword: str) -> str:
        """Classify buyer journey stage"""
        keyword_lower = keyword.lower()
        
        stage_scores = defaultdict(int)
        
        for stage, patterns in self.buyer_journey_patterns.items():
            for pattern in patterns:
                if pattern in keyword_lower:
                    stage_scores[stage] += 1
        
        if not stage_scores:
            return 'awareness'  # Default
        
        return max(stage_scores.items(), key=lambda x: x[1])[0]
    
    def generate_cluster_name(self, keywords: List[str]) -> str:
        """Generate meaningful cluster name from keywords"""
        
        # Extract common terms
        all_words = []
        for keyword in keywords:
            words = keyword.lower().split()
            all_words.extend([word for word in words if word not in self.stop_words and len(word) > 2])
        
        # Find most common terms
        word_counts = Counter(all_words)
        
        if not word_counts:
            return "Cluster"
        
        # Get top 2-3 most common terms
        top_words = [word for word, count in word_counts.most_common(3)]
        
        # Create cluster name
        if len(top_words) >= 2:
            return f"{top_words[0].title()} {top_words[1].title()}"
        else:
            return top_words[0].title()
    
    def generate_content_suggestions(self, cluster_keywords: List[str], intent: str) -> List[str]:
        """Generate content suggestions for a cluster"""
        
        suggestions = []
        
        # Get primary topic from most common words
        all_words = []
        for keyword in cluster_keywords:
            all_words.extend(keyword.lower().split())
        
        common_words = Counter(all_words).most_common(3)
        primary_topic = common_words[0][0] if common_words else "topic"
        
        if intent == 'informational':
            suggestions = [
                f"Complete Guide to {primary_topic.title()}",
                f"What You Need to Know About {primary_topic.title()}",
                f"{primary_topic.title()} 101: Beginner's Guide",
                f"Ultimate {primary_topic.title()} Resource",
                f"Everything About {primary_topic.title()} Explained"
            ]
        elif intent == 'commercial':
            suggestions = [
                f"Best {primary_topic.title()} Tools & Software",
                f"Top {primary_topic.title()} Solutions Compared",
                f"{primary_topic.title()} Review & Comparison",
                f"How to Choose the Right {primary_topic.title()} Tool",
                f"{primary_topic.title()} Alternatives & Options"
            ]
        elif intent == 'transactional':
            suggestions = [
                f"{primary_topic.title()} Pricing & Plans",
                f"Get Started with {primary_topic.title()}",
                f"{primary_topic.title()} Free Trial & Demo",
                f"Buy {primary_topic.title()} - Best Deals",
                f"{primary_topic.title()} Purchase Guide"
            ]
        else:
            suggestions = [
                f"{primary_topic.title()} Content Hub",
                f"Learn About {primary_topic.title()}",
                f"{primary_topic.title()} Resources",
                f"{primary_topic.title()} Information Center"
            ]
        
        return suggestions[:3]  # Return top 3 suggestions
    
    def calculate_priority_score(self, keywords: List[str], search_volumes: List[int], difficulties: List[float]) -> float:
        """Calculate priority score for a cluster"""
        
        if not keywords:
            return 0.0
        
        # Default values if no data provided
        if not search_volumes:
            search_volumes = [100] * len(keywords)
        if not difficulties:
            difficulties = [50.0] * len(keywords)
        
        # Normalize lengths
        min_len = min(len(keywords), len(search_volumes), len(difficulties))
        keywords = keywords[:min_len]
        search_volumes = search_volumes[:min_len]
        difficulties = difficulties[:min_len]
        
        # Calculate weighted score
        total_volume = sum(search_volumes)
        avg_difficulty = sum(difficulties) / len(difficulties) if difficulties else 50.0
        
        # Priority = (Search Volume) / (Difficulty + 1) * (Number of Keywords)
        priority = (total_volume / (avg_difficulty + 1)) * len(keywords)
        
        # Normalize to 0-100 scale
        return min(100.0, priority / 100)
    
    async def cluster_keywords(
        self, 
        keywords: List[str],
        search_volumes: Optional[List[int]] = None,
        difficulties: Optional[List[float]] = None
    ) -> ClusterAnalysis:
        """Main clustering function"""
        
        start_time = datetime.now()
        
        # Preprocess keywords
        processed_keywords = self.preprocess_keywords(keywords)
        
        if len(processed_keywords) < 2:
            # Return single cluster if too few keywords
            cluster = KeywordCluster(
                id="cluster_1",
                name="Main Cluster",
                primary_keyword=processed_keywords[0] if processed_keywords else "keywords",
                keywords=processed_keywords,
                search_intent="informational",
                topic_theme="general",
                search_volume_total=sum(search_volumes) if search_volumes else 0,
                difficulty_average=sum(difficulties) / len(difficulties) if difficulties else 0,
                content_suggestions=["Content about your keywords"],
                buyer_journey_stage="awareness",
                priority_score=50.0,
                created_at=datetime.now()
            )
            
            return ClusterAnalysis(
                total_keywords=len(processed_keywords),
                total_clusters=1,
                clusters=[cluster],
                unclustered_keywords=[],
                content_gaps=[],
                pillar_opportunities=[],
                processing_time=(datetime.now() - start_time).total_seconds()
            )
        
        # Extract features
        features = self.extract_features(processed_keywords)
        
        # Determine optimal cluster count
        optimal_clusters = self.determine_optimal_clusters(features)
        
        # Perform clustering
        kmeans = KMeans(n_clusters=optimal_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(features)
        
        # Group keywords by cluster
        clustered_keywords = defaultdict(list)
        for i, label in enumerate(cluster_labels):
            clustered_keywords[label].append(processed_keywords[i])
        
        # Create cluster objects
        clusters = []
        for cluster_id, cluster_keywords in clustered_keywords.items():
            
            # Get primary keyword (most central/representative)
            primary_keyword = max(cluster_keywords, key=len) if cluster_keywords else "keywords"
            
            # Classify intent and journey stage
            intent_votes = [self.classify_search_intent(kw) for kw in cluster_keywords]
            search_intent = Counter(intent_votes).most_common(1)[0][0]
            
            journey_votes = [self.classify_buyer_journey_stage(kw) for kw in cluster_keywords]
            buyer_journey_stage = Counter(journey_votes).most_common(1)[0][0]
            
            # Generate cluster name and content suggestions
            cluster_name = self.generate_cluster_name(cluster_keywords)
            content_suggestions = self.generate_content_suggestions(cluster_keywords, search_intent)
            
            # Calculate metrics
            cluster_indices = [i for i, label in enumerate(cluster_labels) if label == cluster_id]
            cluster_volumes = [search_volumes[i] if search_volumes and i < len(search_volumes) else 100 for i in cluster_indices]
            cluster_difficulties = [difficulties[i] if difficulties and i < len(difficulties) else 50.0 for i in cluster_indices]
            
            priority_score = self.calculate_priority_score(cluster_keywords, cluster_volumes, cluster_difficulties)
            
            cluster = KeywordCluster(
                id=f"cluster_{cluster_id + 1}",
                name=cluster_name,
                primary_keyword=primary_keyword,
                keywords=sorted(cluster_keywords),
                search_intent=search_intent,
                topic_theme=cluster_name.lower(),
                search_volume_total=sum(cluster_volumes),
                difficulty_average=sum(cluster_difficulties) / len(cluster_difficulties) if cluster_difficulties else 0,
                content_suggestions=content_suggestions,
                buyer_journey_stage=buyer_journey_stage,
                priority_score=priority_score,
                created_at=datetime.now()
            )
            
            clusters.append(cluster)
        
        # Sort clusters by priority score
        clusters.sort(key=lambda x: x.priority_score, reverse=True)
        
        # Generate content gap analysis and pillar opportunities
        content_gaps = self._analyze_content_gaps(clusters)
        pillar_opportunities = self._identify_pillar_opportunities(clusters)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return ClusterAnalysis(
            total_keywords=len(processed_keywords),
            total_clusters=len(clusters),
            clusters=clusters,
            unclustered_keywords=[],  # All keywords are clustered with KMeans
            content_gaps=content_gaps,
            pillar_opportunities=pillar_opportunities,
            processing_time=processing_time
        )
    
    def _analyze_content_gaps(self, clusters: List[KeywordCluster]) -> List[Dict]:
        """Analyze content gaps based on cluster analysis"""
        
        gaps = []
        
        # Intent distribution analysis
        intent_counts = Counter([cluster.search_intent for cluster in clusters])
        total_clusters = len(clusters)
        
        for intent, count in intent_counts.items():
            percentage = (count / total_clusters) * 100
            if percentage < 20:  # Less than 20% coverage
                gaps.append({
                    "type": "search_intent_gap",
                    "intent": intent,
                    "description": f"Low coverage for {intent} keywords ({percentage:.1f}%)",
                    "recommendation": f"Create more {intent}-focused content",
                    "priority": "high" if percentage < 10 else "medium"
                })
        
        # Buyer journey analysis
        journey_counts = Counter([cluster.buyer_journey_stage for cluster in clusters])
        
        for stage, count in journey_counts.items():
            percentage = (count / total_clusters) * 100
            if percentage < 25:  # Less than 25% coverage
                gaps.append({
                    "type": "buyer_journey_gap",
                    "stage": stage,
                    "description": f"Limited {stage} stage content ({percentage:.1f}%)",
                    "recommendation": f"Develop more {stage}-stage content",
                    "priority": "high" if percentage < 15 else "medium"
                })
        
        return gaps
    
    def _identify_pillar_opportunities(self, clusters: List[KeywordCluster]) -> List[Dict]:
        """Identify content pillar opportunities"""
        
        opportunities = []
        
        # High-priority clusters with many keywords
        for cluster in clusters:
            if cluster.priority_score > 70 and len(cluster.keywords) >= 5:
                opportunities.append({
                    "type": "pillar_page",
                    "cluster_name": cluster.name,
                    "primary_keyword": cluster.primary_keyword,
                    "supporting_keywords": len(cluster.keywords),
                    "search_volume": cluster.search_volume_total,
                    "content_suggestions": cluster.content_suggestions,
                    "priority": "high"
                })
        
        # Clusters that could be combined into topic hubs
        intent_groups = defaultdict(list)
        for cluster in clusters:
            intent_groups[cluster.search_intent].append(cluster)
        
        for intent, intent_clusters in intent_groups.items():
            if len(intent_clusters) >= 3:
                total_volume = sum([c.search_volume_total for c in intent_clusters])
                total_keywords = sum([len(c.keywords) for c in intent_clusters])
                
                opportunities.append({
                    "type": "topic_hub",
                    "intent": intent,
                    "clusters_involved": len(intent_clusters),
                    "total_keywords": total_keywords,
                    "total_search_volume": total_volume,
                    "description": f"Create comprehensive {intent} content hub",
                    "priority": "medium"
                })
        
        return opportunities

# Async wrapper for easy integration
async def cluster_keywords_async(
    keywords: List[str],
    search_volumes: Optional[List[int]] = None,
    difficulties: Optional[List[float]] = None
) -> ClusterAnalysis:
    """Async wrapper for keyword clustering"""
    
    engine = KeywordClusteringEngine()
    return await engine.cluster_keywords(keywords, search_volumes, difficulties)