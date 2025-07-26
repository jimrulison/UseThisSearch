// Mock data for AnswerThePublic clone - simulating real keyword research results

export const generateMockResults = (searchTerm) => {
  const questionWords = ['who', 'what', 'where', 'when', 'why', 'how', 'will', 'can', 'are', 'is'];
  const prepositions = ['for', 'with', 'without', 'to', 'from', 'near', 'like', 'versus', 'against', 'about'];
  const comparisons = ['vs', 'versus', 'or', 'and', 'like', 'similar to', 'compared to', 'better than'];
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  const results = {
    questions: [],
    prepositions: [],
    comparisons: [],
    alphabetical: []
  };

  // Generate question-based suggestions
  questionWords.forEach(word => {
    const variations = [
      `${word} is ${searchTerm}`,
      `${word} ${searchTerm} works`,
      `${word} ${searchTerm} benefits`,
      `${word} to use ${searchTerm}`,
      `${word} ${searchTerm} matters`
    ];
    
    // Add 2-3 random variations for each question word
    const count = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < count; i++) {
      const variation = variations[Math.floor(Math.random() * variations.length)];
      if (!results.questions.includes(variation)) {
        results.questions.push(variation);
      }
    }
  });

  // Generate preposition-based suggestions
  prepositions.forEach(prep => {
    const variations = [
      `${searchTerm} ${prep} beginners`,
      `${searchTerm} ${prep} business`,
      `${searchTerm} ${prep} home`,
      `${searchTerm} ${prep} professionals`,
      `${searchTerm} ${prep} students`,
      `${searchTerm} ${prep} everyone`,
      `${searchTerm} ${prep} small business`,
      `${searchTerm} ${prep} online`,
      `${searchTerm} ${prep} free`,
      `${searchTerm} ${prep} mobile`
    ];
    
    const count = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < count; i++) {
      const variation = variations[Math.floor(Math.random() * variations.length)];
      if (!results.prepositions.includes(variation)) {
        results.prepositions.push(variation);
      }
    }
  });

  // Generate comparison suggestions
  const competitorTerms = getCompetitorTerms(searchTerm);
  comparisons.forEach(comp => {
    competitorTerms.forEach(competitor => {
      const variations = [
        `${searchTerm} ${comp} ${competitor}`,
        `${competitor} ${comp} ${searchTerm}`
      ];
      
      variations.forEach(variation => {
        if (!results.comparisons.includes(variation) && Math.random() > 0.6) {
          results.comparisons.push(variation);
        }
      });
    });
  });

  // Generate alphabetical suggestions
  alphabet.forEach(letter => {
    const variations = [
      `${searchTerm} ${letter}${getRandomWord()}`,
      `${letter}${getRandomWord()} ${searchTerm}`,
      `${searchTerm} ${letter}${getRandomSuffix()}`
    ];
    
    const variation = variations[Math.floor(Math.random() * variations.length)];
    if (Math.random() > 0.7) { // Only add some alphabetical suggestions
      results.alphabetical.push(variation);
    }
  });

  // Add some topic-specific variations based on search term
  addTopicSpecificSuggestions(searchTerm, results);

  // Shuffle and limit results
  Object.keys(results).forEach(key => {
    results[key] = shuffleArray(results[key]).slice(0, getRandomCount(key));
  });

  return results;
};

const getCompetitorTerms = (searchTerm) => {
  const commonCompetitors = {
    'coffee': ['tea', 'espresso', 'latte', 'cappuccino', 'americano'],
    'fitness': ['yoga', 'gym', 'workout', 'exercise', 'training'],
    'marketing': ['advertising', 'promotion', 'branding', 'SEO', 'social media'],
    'crypto': ['bitcoin', 'ethereum', 'blockchain', 'defi', 'NFT'],
    'AI': ['machine learning', 'automation', 'chatbot', 'neural network', 'deep learning'],
    'sustainability': ['eco-friendly', 'green', 'renewable', 'carbon neutral', 'organic']
  };

  const lowerTerm = searchTerm.toLowerCase();
  for (const [key, competitors] of Object.entries(commonCompetitors)) {
    if (lowerTerm.includes(key) || key.includes(lowerTerm)) {
      return competitors;
    }
  }

  // Default competitors
  return ['alternative', 'solution', 'option', 'competitor', 'similar'];
};

const getRandomWord = () => {
  const words = ['apps', 'tools', 'guide', 'tips', 'course', 'book', 'software', 'platform', 'service', 'product'];
  return words[Math.floor(Math.random() * words.length)];
};

const getRandomSuffix = () => {
  const suffixes = ['analysis', 'strategy', 'consulting', 'training', 'certification', 'workshop', 'mastery', 'basics'];
  return suffixes[Math.floor(Math.random() * suffixes.length)];
};

const addTopicSpecificSuggestions = (searchTerm, results) => {
  const topicSuggestions = {
    'coffee': {
      questions: ['how to brew coffee', 'what coffee beans to buy', 'why coffee keeps you awake'],
      prepositions: ['coffee for weight loss', 'coffee with milk', 'coffee without sugar'],
      comparisons: ['coffee vs tea', 'instant coffee vs ground coffee']
    },
    'fitness': {
      questions: ['how to start fitness journey', 'what fitness equipment to buy', 'why fitness is important'],
      prepositions: ['fitness for beginners', 'fitness with home equipment', 'fitness without gym'],
      comparisons: ['fitness vs wellness', 'cardio vs strength training']
    },
    'marketing': {
      questions: ['how to do digital marketing', 'what marketing strategies work', 'why marketing automation matters'],
      prepositions: ['marketing for small business', 'marketing with social media', 'marketing without budget'],
      comparisons: ['digital marketing vs traditional marketing', 'content marketing vs paid ads']
    }
  };

  const lowerTerm = searchTerm.toLowerCase();
  for (const [topic, suggestions] of Object.entries(topicSuggestions)) {
    if (lowerTerm.includes(topic) || topic.includes(lowerTerm)) {
      Object.keys(suggestions).forEach(category => {
        results[category] = [...results[category], ...suggestions[category]];
      });
      break;
    }
  }
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getRandomCount = (category) => {
  const counts = {
    questions: Math.floor(Math.random() * 20) + 15, // 15-35
    prepositions: Math.floor(Math.random() * 25) + 20, // 20-45
    comparisons: Math.floor(Math.random() * 15) + 10, // 10-25
    alphabetical: Math.floor(Math.random() * 20) + 15 // 15-35
  };
  return counts[category] || 20;
};