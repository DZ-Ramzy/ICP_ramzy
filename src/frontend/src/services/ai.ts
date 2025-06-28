// AI Service for market insights and analysis - Enhanced with ICP integration
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

class AIService {
  private static instance: AIService;
  private cache = new Map<string, { data: MarketInsight; timestamp: number }>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private config: AIConfiguration = {
    useICPNative: false, // Pour l'instant, on utilise la simulation
    fallbackToSimulation: true,
    enableSentimentAnalysis: true,
    enableHistoricalComparison: true,
  };

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
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
      // Simulate AI analysis with realistic data
      const insight = await this.simulateAIAnalysis(
        marketTitle,
        marketDescription,
      );

      this.cache.set(cacheKey, {
        data: insight,
        timestamp: Date.now(),
      });

      return insight;
    } catch (error) {
      console.error("Failed to get market insight:", error);
      throw new Error("Failed to analyze market data");
    }
  }

  private async simulateAIAnalysis(
    title: string,
    _description: string,
  ): Promise<MarketInsight> {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1500 + Math.random() * 1000),
    );

    // Generate realistic insights based on market title
    const insights = this.generateInsightFromTitle(title);

    return {
      summary: insights.summary,
      analysis: insights.analysis,
      probabilityAssessment: insights.probabilityAssessment,
      keyInfluencingFactors: insights.keyInfluencingFactors,
      recentDevelopments: insights.recentDevelopments,
      confidence: Math.floor(70 + Math.random() * 25), // 70-95% confidence
      lastUpdated: new Date().toISOString(),
      sources: insights.sources,
      sentimentScore: insights.sentimentScore,
      riskLevel: insights.riskLevel,
      historicalComparisons: insights.historicalComparisons,
      aiProvider: insights.aiProvider,
    };
  }

  private generateInsightFromTitle(
    title: string,
  ): Omit<MarketInsight, "confidence" | "lastUpdated"> {
    const titleLower = title.toLowerCase();

    // French politics
    if (
      titleLower.includes("macron") ||
      titleLower.includes("président") ||
      titleLower.includes("france") ||
      titleLower.includes("2028")
    ) {
      return {
        summary:
          "Emmanuel Macron is currently serving his second presidential term, which ends in 2027. The French Constitution limits consecutive presidential terms, but after a break, a former president can theoretically run again.",
        analysis:
          "This question requires careful examination of both constitutional and political factors. First, the French Constitution doesn't impose an absolute limit on the number of presidential terms a person can serve in their lifetime, unlike the United States. However, it does limit consecutive terms to two. Since Macron was elected in 2017 and re-elected in 2022, he cannot run in 2027. The situation would be different for 2028, as there would be an interruption. Politically, several factors come into play: the evolution of his popularity, the state of his Renaissance party, the reshaping of the French political landscape, and the emergence of new political figures. Macron's age in 2028 (50 years old) would not be an obstacle. French history shows that comeback attempts by former presidents have rarely succeeded, as illustrated by cases like Valéry Giscard d'Estaing and Nicolas Sarkozy.",
        probabilityAssessment:
          "The probability of Macron's return in 2028 remains moderate. While legally possible, historical precedents and French political dynamics suggest that voters generally favor renewal. Current polling trends and the evolution of presidential popularity will be determining factors.",
        keyInfluencingFactors:
          "The most influential factors include the state of the French and European economy by 2028, Macron's ability to maintain a solid political base after leaving office, whether credible candidates emerge within his political camp, the evolution of major challenges (climate, immigration, purchasing power), and the potential reshaping of the French political spectrum. The international geopolitical situation and France's role in Europe will also play a crucial role.",
        recentDevelopments:
          "Recent ministerial reshuffles and tensions within the presidential majority indicate Macron's willingness to prepare for the post-2027 period. Statements by several political figures about the future of Macronism after Macron suggest ongoing strategic reflection. Results from the 2024 European elections and local elections provide insights into the evolution of presidential popularity and his political movement.",
        sources: [
          "Le Monde - Political Analysis",
          "France24 - French Politics",
          "BFM TV - Political Polling",
          "Fondation Jean Jaurès - Electoral Studies",
        ],
        sentimentScore: 0.1, // Slightly positive sentiment
        riskLevel: "Medium" as const,
        historicalComparisons: [
          "Nicolas Sarkozy's failed comeback attempt in 2016",
          "Valéry Giscard d'Estaing's unsuccessful return in 1988",
          "Historical precedent of French voters favoring political renewal",
        ],
        aiProvider: this.config.useICPNative
          ? "ICP-Native"
          : ("Simulation" as const),
      };
    }

    // General elections
    if (
      titleLower.includes("election") ||
      titleLower.includes("president") ||
      titleLower.includes("vote")
    ) {
      return {
        summary:
          "Modern electoral analysis combines polling data, historical trends, and socio-economic factors to assess the probabilities of electoral outcomes.",
        analysis:
          "Contemporary elections are influenced by a multitude of interconnected factors. Opinion polls, while imperfect, remain an important indicator but must be analyzed considering their margins of error and temporal evolution. Demographic trends play an increasingly important role, particularly voter age, education level, and geographic location. Economic factors, especially purchasing power and employment, remain decisive in electoral choices. The impact of social media and disinformation now constitutes a central element of any electoral analysis. Geopolitical events can also significantly influence results, as recently demonstrated by health crises and international conflicts.",
        probabilityAssessment:
          "Probabilistic assessment of electoral results requires a multifactorial approach that combines statistical analysis and understanding of local political dynamics.",
        keyInfluencingFactors:
          "Key factors include economic performance, dominant social issues, mobilization capacity of different camps, influence of traditional and social media, political alliances, and unexpected events that may occur late in campaigns.",
        recentDevelopments:
          "Recent electoral consultations in various countries show increasing voter volatility and a questioning of traditional predictions. The emergence of new political movements and fragmentation of the political landscape complicate predictive analyses.",
        sources: [
          "Polling Institutes",
          "Academic Research",
          "Political Media",
          "Historical Electoral Data",
        ],
        sentimentScore: 0.0, // Neutral sentiment
        riskLevel: "Medium" as const,
        historicalComparisons: [
          "2016 US Presidential Election polling vs. actual results",
          "Brexit referendum prediction challenges",
          "Recent trend of increased electoral volatility globally",
        ],
        aiProvider: this.config.useICPNative
          ? "ICP-Native"
          : ("Simulation" as const),
      };
    }

    // Sports events
    if (
      titleLower.includes("world cup") ||
      titleLower.includes("championship") ||
      titleLower.includes("olympic") ||
      titleLower.includes("football") ||
      titleLower.includes("soccer")
    ) {
      return {
        summary:
          "Sports prediction markets rely on statistical models incorporating team performance, player conditions, and historical data to assess likely outcomes.",
        analysis:
          "Modern sports analytics combine multiple data sources to evaluate competitive probabilities. Team performance metrics include recent form, head-to-head records, player fitness levels, and tactical adaptations. Environmental factors such as home advantage, weather conditions, and crowd support significantly impact outcomes. Injury reports and player availability create dynamic odds adjustments. Historical patterns reveal trends in tournament progression and upset probabilities. Advanced metrics like expected goals (xG) in football or player efficiency ratings in basketball provide deeper insights than traditional statistics.",
        probabilityAssessment:
          "Statistical models suggest competitive balance with slight advantages based on current form and historical performance patterns.",
        keyInfluencingFactors:
          "Critical factors include recent team performance, key player availability, tactical matchups, home field advantage, weather conditions, and psychological pressure in high-stakes competitions.",
        recentDevelopments:
          "Recent transfer activity, coaching changes, and pre-tournament friendlies provide updated performance indicators. Injury updates and squad announcements affect betting odds and prediction models.",
        sources: [
          "ESPN Sports Analytics",
          "FiveThirtyEight Predictions",
          "UEFA Technical Reports",
          "Sports Betting Markets",
        ],
        sentimentScore: 0.3, // Positive sentiment around sports analysis
        riskLevel: "Low" as const,
        historicalComparisons: [
          "Leicester City's 2016 Premier League upset (5000-1 odds)",
          "Germany's 2014 World Cup victory in Brazil",
          "Golden State Warriors' 2016 regular season dominance vs. Finals loss",
        ],
        aiProvider: this.config.useICPNative
          ? "ICP-Native"
          : ("Simulation" as const),
      };
    }

    // Cryptocurrency markets
    if (
      titleLower.includes("bitcoin") ||
      titleLower.includes("crypto") ||
      titleLower.includes("ethereum") ||
      titleLower.includes("btc") ||
      titleLower.includes("eth")
    ) {
      return {
        summary:
          "Cryptocurrency market analysis reveals mixed signals with institutional adoption trends and regulatory developments influencing price action and long-term viability.",
        analysis:
          "The cryptocurrency market operates within a complex ecosystem of technological innovation, regulatory uncertainty, and speculative trading. Bitcoin's position as digital gold continues to strengthen with institutional adoption, while Ethereum's transition to proof-of-stake has improved its environmental profile and utility. Regulatory clarity in major markets like the US and EU significantly impacts investor confidence. On-chain metrics including network activity, whale movements, and exchange flows provide insights into market sentiment. Macroeconomic factors such as inflation rates and central bank policies increasingly correlate with crypto price movements.",
        probabilityAssessment:
          "Market volatility remains high with probabilities shifting based on regulatory announcements and institutional adoption milestones.",
        keyInfluencingFactors:
          "Key drivers include regulatory framework development, institutional investment flows, technological upgrades, macroeconomic conditions, and adoption by major corporations and governments.",
        recentDevelopments:
          "Recent ETF approvals, central bank digital currency announcements, and major corporate treasury allocations signal growing mainstream acceptance despite ongoing regulatory challenges.",
        sources: [
          "CoinDesk Market Analysis",
          "Bloomberg Crypto Coverage",
          "On-chain Analytics Platforms",
          "Federal Reserve Publications",
        ],
        sentimentScore: 0.2, // Slightly positive due to institutional adoption
        riskLevel: "High" as const,
        historicalComparisons: [
          "2017 Bitcoin bull run and subsequent crash",
          "Ethereum's transition from proof-of-work to proof-of-stake",
          "Previous regulatory crackdowns vs. current ETF approvals",
        ],
        aiProvider: this.config.useICPNative
          ? "ICP-Native"
          : ("Simulation" as const),
      };
    }

    // Technology and business markets
    if (
      titleLower.includes("stock") ||
      titleLower.includes("company") ||
      titleLower.includes("tech") ||
      titleLower.includes("ipo") ||
      titleLower.includes("acquisition")
    ) {
      return {
        summary:
          "Corporate market analysis incorporates financial fundamentals, industry trends, and competitive positioning to assess business probabilities and stock performance.",
        analysis:
          "Technology sector valuations reflect expectations of future growth amid changing market conditions. Company fundamentals including revenue growth, profit margins, and cash flow generation remain core valuation drivers. Industry disruption from AI, automation, and digital transformation creates both opportunities and risks. Regulatory scrutiny of major tech platforms affects market sentiment and business models. Global supply chain dynamics and geopolitical tensions impact multinational operations. Interest rate environments significantly influence growth stock valuations and M&A activity.",
        probabilityAssessment:
          "Market probabilities fluctuate based on earnings performance, competitive dynamics, and broader economic conditions affecting growth expectations.",
        keyInfluencingFactors:
          "Critical factors include quarterly earnings results, product innovation cycles, competitive landscape changes, regulatory environment, and macroeconomic conditions affecting technology spending.",
        recentDevelopments:
          "Recent earnings reports, product launches, and strategic partnerships provide updated insights into competitive positioning and growth prospects in rapidly evolving technology markets.",
        sources: [
          "Financial Times Tech Coverage",
          "Wall Street Journal Markets",
          "SEC Filing Analysis",
          "Industry Research Reports",
        ],
        sentimentScore: 0.1, // Slightly positive but cautious
        riskLevel: "Medium" as const,
        historicalComparisons: [
          "Dot-com bubble burst of 2000-2002",
          "2008 financial crisis impact on tech stocks",
          "COVID-19 pandemic acceleration of digital transformation",
        ],
        aiProvider: this.config.useICPNative
          ? "ICP-Native"
          : ("Simulation" as const),
      };
    }

    // Default generic response for other topics
    return {
      summary:
        "Market analysis requires a methodological approach combining historical data, current trends, and identified influence factors to assess probabilistic outcomes.",
      analysis:
        "To rigorously evaluate this probability, it's appropriate to examine similar historical precedents, identify factors that could influence the outcome, and analyze relevant current trends. The analytical approach must account for the complexity of studied systems and the inherent uncertainty in predictions. Predictive models, whether statistical or expertise-based, have their limitations and should be interpreted with caution. Multiple data sources and analytical frameworks provide more robust assessments than single-point estimates.",
      probabilityAssessment:
        "Probability assessment requires thorough analysis of available data and understanding of underlying mechanisms that could influence the outcome.",
      keyInfluencingFactors:
        "Key factors to consider include historical trends observed in similar situations, recent changes in relevant environments, decisions and actions of key actors, and external events that could modify current conditions.",
      recentDevelopments:
        "Recent developments in the relevant domain suggest evolving conditions that could influence the final outcome. Continuous monitoring of pertinent indicators allows for assessment adjustments.",
      sources: [
        "Expert Analysis",
        "Historical Data",
        "Specialized Sources",
        "Relevant Studies",
      ],
      sentimentScore: 0.0, // Neutral sentiment for generic analysis
      riskLevel: "Medium" as const,
      historicalComparisons: [
        "Historical precedents in similar domains",
        "Comparative analysis of analogous situations",
        "Long-term trend patterns in relevant sectors",
      ],
      aiProvider: this.config.useICPNative
        ? "ICP-Native"
        : ("Simulation" as const),
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const aiService = AIService.getInstance();
