// Enhanced AI Service for market insights and analysis - ICP Native Integration
export interface MarketInsight {
  summary: string;
  analysis: string;
  probabilityAssessment: string;
  keyInfluencingFactors: string;
  recentDevelopments: string;
  confidence: number;
  lastUpdated: string;
  sources: string[];
  sentimentScore: number; // -1 to 1
  riskLevel: "Low" | "Medium" | "High";
  historicalComparisons: string[];
  aiProvider: "ICP-Native" | "Simulation" | "External";
}

export interface AIConfiguration {
  useICPNative: boolean;
  fallbackToSimulation: boolean;
  enableSentimentAnalysis: boolean;
  enableHistoricalComparison: boolean;
}

class EnhancedAIService {
  private static instance: EnhancedAIService;
  private cache = new Map<string, { data: MarketInsight; timestamp: number }>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private config: AIConfiguration = {
    useICPNative: false, // Pour l'instant, simulation avancée
    fallbackToSimulation: true,
    enableSentimentAnalysis: true,
    enableHistoricalComparison: true,
  };

  private constructor() {}

  static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    return EnhancedAIService.instance;
  }

  setConfiguration(config: Partial<AIConfiguration>): void {
    this.config = { ...this.config, ...config };
  }

  async getMarketInsight(
    marketTitle: string,
    marketDescription: string,
  ): Promise<MarketInsight> {
    const cacheKey = `${marketTitle}-${marketDescription}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      let insight: MarketInsight;

      if (this.config.useICPNative) {
        insight = await this.getICPNativeAnalysis(
          marketTitle,
          marketDescription,
        );
      } else {
        insight = await this.getSimulatedAnalysis(
          marketTitle,
          marketDescription,
        );
      }

      this.cache.set(cacheKey, {
        data: insight,
        timestamp: Date.now(),
      });

      return insight;
    } catch (error) {
      console.error("Failed to get AI insight:", error);

      if (this.config.fallbackToSimulation) {
        return this.getSimulatedAnalysis(marketTitle, marketDescription);
      }

      throw error;
    }
  }

  private async getICPNativeAnalysis(
    marketTitle: string,
    marketDescription: string,
  ): Promise<MarketInsight> {
    // TODO: Intégration avec le backend ICP pour l'analyse IA
    // Pour l'instant, on utilise la simulation avancée
    console.log("🧠 Using ICP Native AI Analysis (simulated)");
    return this.getSimulatedAnalysis(marketTitle, marketDescription);
  }

  private async getSimulatedAnalysis(
    marketTitle: string,
    marketDescription: string,
  ): Promise<MarketInsight> {
    // Simulation d'un délai de traitement IA
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 1200),
    );

    const confidence = 75 + Math.random() * 20; // 75-95%
    const sentimentScore = (Math.random() - 0.5) * 2; // -1 to 1
    const riskLevel = this.calculateRiskLevel(confidence, sentimentScore);

    // Analyse basée sur le contenu du marché
    const marketAnalysis = this.analyzeMarketContent(
      marketTitle,
      marketDescription,
    );

    return {
      summary: marketAnalysis.summary,
      analysis: marketAnalysis.analysis,
      probabilityAssessment: this.generateProbabilityAssessment(
        confidence,
        sentimentScore,
      ),
      keyInfluencingFactors: marketAnalysis.keyFactors,
      recentDevelopments: this.generateRecentDevelopments(marketTitle),
      confidence: Math.round(confidence),
      lastUpdated: new Date().toISOString(),
      sources: [
        "Historical Market Data",
        "Sentiment Analysis Engine",
        "ICP Prediction Analytics",
        "Market Trend Database",
      ],
      sentimentScore: Math.round(sentimentScore * 100) / 100,
      riskLevel,
      historicalComparisons: this.generateHistoricalComparisons(marketTitle),
      aiProvider: this.config.useICPNative ? "ICP-Native" : "Simulation",
    };
  }

  private calculateRiskLevel(
    confidence: number,
    sentimentScore: number,
  ): "Low" | "Medium" | "High" {
    const volatility = Math.abs(sentimentScore);

    if (confidence > 85 && volatility < 0.3) return "Low";
    if (confidence < 70 || volatility > 0.7) return "High";
    return "Medium";
  }

  private analyzeMarketContent(title: string, description: string) {
    const content = `${title} ${description}`.toLowerCase();

    // Détection de mots-clés pour personnaliser l'analyse
    const cryptoKeywords = [
      "bitcoin",
      "crypto",
      "blockchain",
      "ethereum",
      "defi",
    ];
    const sportsKeywords = [
      "football",
      "soccer",
      "basketball",
      "tennis",
      "olympics",
    ];
    const politicsKeywords = [
      "election",
      "president",
      "vote",
      "politics",
      "government",
    ];
    const techKeywords = ["ai", "technology", "tech", "innovation", "startup"];
    const economicKeywords = ["economy", "market", "stock", "gdp", "inflation"];

    if (cryptoKeywords.some((keyword) => content.includes(keyword))) {
      return {
        summary:
          "Cryptocurrency markets are highly volatile and influenced by regulatory news, adoption rates, and market sentiment. This prediction involves significant technical and fundamental analysis.",
        analysis:
          "The cryptocurrency sector shows strong correlation with institutional adoption, regulatory developments, and macroeconomic factors. Recent DeFi innovations and institutional interest are key drivers.",
        keyFactors:
          "Regulatory environment, institutional adoption, technical developments, market sentiment, macroeconomic conditions",
      };
    }

    if (sportsKeywords.some((keyword) => content.includes(keyword))) {
      return {
        summary:
          "Sports predictions rely on team performance, player statistics, historical matchups, and current form. External factors like injuries and weather can significantly impact outcomes.",
        analysis:
          "Statistical analysis of team performance, player metrics, and historical data provides strong predictive indicators. Recent form and head-to-head records are crucial factors.",
        keyFactors:
          "Team form, player injuries, historical performance, weather conditions, home advantage",
      };
    }

    if (politicsKeywords.some((keyword) => content.includes(keyword))) {
      return {
        summary:
          "Political predictions are influenced by polling data, demographic trends, economic conditions, and current events. High uncertainty due to voter behavior complexity.",
        analysis:
          "Political outcomes depend on multiple variables including voter turnout, demographic shifts, economic conditions, and campaign effectiveness. Polling accuracy varies significantly.",
        keyFactors:
          "Polling data, voter turnout, economic conditions, demographic trends, campaign spending",
      };
    }

    if (techKeywords.some((keyword) => content.includes(keyword))) {
      return {
        summary:
          "Technology sector predictions involve innovation cycles, market adoption, competitive landscape, and regulatory environment. High growth potential with elevated risk.",
        analysis:
          "Tech market dynamics are driven by innovation cycles, consumer adoption rates, competitive positioning, and regulatory changes. Disruption potential is significant.",
        keyFactors:
          "Innovation pipeline, market adoption, competitive landscape, regulatory environment, funding availability",
      };
    }

    if (economicKeywords.some((keyword) => content.includes(keyword))) {
      return {
        summary:
          "Economic predictions rely on macroeconomic indicators, policy decisions, global events, and market cycles. Complex interconnected factors create prediction challenges.",
        analysis:
          "Economic forecasting involves multiple indicators including GDP growth, inflation rates, employment data, and central bank policies. Global interconnectedness adds complexity.",
        keyFactors:
          "Economic indicators, monetary policy, geopolitical events, market sentiment, global trade",
      };
    }

    // Default analysis
    return {
      summary:
        "This prediction market involves multiple variables and uncertainty factors. Comprehensive analysis of available data suggests moderate predictability with several key influencing factors.",
      analysis:
        "Market outcome depends on various interconnected factors that require careful analysis. Historical patterns and current trends provide some predictive value.",
      keyFactors:
        "Market trends, historical data, external events, public sentiment, regulatory factors",
    };
  }

  private generateProbabilityAssessment(
    confidence: number,
    sentimentScore: number,
  ): string {
    const sentiment =
      sentimentScore > 0.3
        ? "positive"
        : sentimentScore < -0.3
          ? "negative"
          : "neutral";
    const confidenceLevel =
      confidence > 85 ? "high" : confidence > 70 ? "moderate" : "low";

    return `Based on current analysis, there is ${confidenceLevel} confidence in the prediction with ${sentiment} market sentiment. The probability assessment considers multiple data points and historical patterns.`;
  }

  private generateRecentDevelopments(_marketTitle: string): string {
    const developments = [
      "Recent market volatility has increased uncertainty in prediction accuracy",
      "New data sources have been integrated to improve analysis quality",
      "Market sentiment has shifted following recent news developments",
      "Technical indicators show emerging trends that may impact outcomes",
      "Historical pattern analysis reveals interesting correlations",
    ];

    return developments[Math.floor(Math.random() * developments.length)];
  }

  private generateHistoricalComparisons(_marketTitle: string): string[] {
    const comparisons = [
      "Similar events in 2023 showed 70% accuracy in predictions",
      "Historical pattern suggests 65% probability for positive outcomes",
      "Comparable markets demonstrated high volatility in final weeks",
      "Previous predictions with similar confidence levels achieved 78% accuracy",
      "Market behavior aligns with patterns observed in Q3 2024",
    ];

    return comparisons.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  // Méthode pour l'intégration future avec le backend ICP
  async enableICPNativeMode(): Promise<void> {
    try {
      // TODO: Vérifier la disponibilité du canister IA
      console.log("🔄 Checking ICP AI Canister availability...");

      // Pour l'instant, on reste en mode simulation
      this.config.useICPNative = false;
      console.log(
        "ℹ️ ICP Native AI not yet available, using enhanced simulation",
      );
    } catch (error) {
      console.error("Failed to enable ICP Native AI:", error);
      this.config.useICPNative = false;
    }
  }

  // Méthodes utilitaires pour l'interface
  getConfigurationStatus(): AIConfiguration {
    return { ...this.config };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export de l'instance singleton
export const aiService = EnhancedAIService.getInstance();
