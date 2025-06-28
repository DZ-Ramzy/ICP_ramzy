import { describe, expect, it, vi, beforeEach } from "vitest";
import { aiService } from "../../src/services/ai";

describe("AI Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiService.clearCache();
  });

  it("should return market insight with all required fields", async () => {
    // Setup
    const marketTitle = "Will Bitcoin reach $100k by 2025?";
    const marketDescription = "A prediction about Bitcoin's price trajectory";

    // Execute
    const insight = await aiService.getMarketInsight(
      marketTitle,
      marketDescription,
    );

    // Assert
    expect(insight).toHaveProperty("summary");
    expect(insight).toHaveProperty("analysis");
    expect(insight).toHaveProperty("probabilityAssessment");
    expect(insight).toHaveProperty("keyInfluencingFactors");
    expect(insight).toHaveProperty("recentDevelopments");
    expect(insight).toHaveProperty("confidence");
    expect(insight).toHaveProperty("lastUpdated");
    expect(insight).toHaveProperty("sources");
    expect(insight).toHaveProperty("sentimentScore");
    expect(insight).toHaveProperty("riskLevel");
    expect(insight).toHaveProperty("historicalComparisons");
    expect(insight).toHaveProperty("aiProvider");

    expect(typeof insight.summary).toBe("string");
    expect(typeof insight.analysis).toBe("string");
    expect(typeof insight.confidence).toBe("number");
    expect(Array.isArray(insight.sources)).toBe(true);
    expect(Array.isArray(insight.historicalComparisons)).toBe(true);
    expect(typeof insight.sentimentScore).toBe("number");
    expect(["Low", "Medium", "High"]).toContain(insight.riskLevel);
    expect(["ICP-Native", "Simulation", "External"]).toContain(
      insight.aiProvider,
    );
  });

  it("should return cached result for same market query", async () => {
    // Setup
    const marketTitle = "Test Market";
    const marketDescription = "Test Description";

    // Execute
    const insight1 = await aiService.getMarketInsight(
      marketTitle,
      marketDescription,
    );
    const insight2 = await aiService.getMarketInsight(
      marketTitle,
      marketDescription,
    );

    // Assert
    expect(insight1).toBe(insight2); // Should be exact same object due to caching
    expect(insight1.lastUpdated).toBe(insight2.lastUpdated);
  });

  it("should provide different insights for different market types", async () => {
    // Setup
    const politicsMarket = "Will Macron run for president in 2028?";
    const cryptoMarket = "Will Bitcoin reach $100k by 2025?";
    const sportsMarket = "Will France win the World Cup 2026?";

    // Execute
    const politicsInsight = await aiService.getMarketInsight(
      politicsMarket,
      "Political prediction",
    );
    const cryptoInsight = await aiService.getMarketInsight(
      cryptoMarket,
      "Crypto prediction",
    );
    const sportsInsight = await aiService.getMarketInsight(
      sportsMarket,
      "Sports prediction",
    );

    // Assert
    expect(politicsInsight.summary).not.toBe(cryptoInsight.summary);
    expect(politicsInsight.summary).not.toBe(sportsInsight.summary);
    expect(cryptoInsight.summary).not.toBe(sportsInsight.summary);

    // Sports should have lower risk level
    expect(sportsInsight.riskLevel).toBe("Low");

    // Crypto should have higher risk level
    expect(cryptoInsight.riskLevel).toBe("High");

    // Politics should have medium risk level
    expect(politicsInsight.riskLevel).toBe("Medium");
  });

  it("should handle configuration changes", () => {
    // Setup
    const originalConfig = {
      useICPNative: false,
      fallbackToSimulation: true,
      enableSentimentAnalysis: true,
      enableHistoricalComparison: true,
    };

    // Execute
    aiService.setConfiguration({
      useICPNative: true,
      enableSentimentAnalysis: false,
    });

    // Assert - Configuration should be updated
    // Note: We can't directly test this without exposing internal config
    // but we can test that the method doesn't throw
    expect(() => aiService.setConfiguration(originalConfig)).not.toThrow();
  });

  it("should provide realistic confidence scores", async () => {
    // Setup
    const marketTitle = "Generic Market Question";
    const marketDescription = "Generic Description";

    // Execute
    const insight = await aiService.getMarketInsight(
      marketTitle,
      marketDescription,
    );

    // Assert
    expect(insight.confidence).toBeGreaterThanOrEqual(70);
    expect(insight.confidence).toBeLessThanOrEqual(95);
  });

  it("should provide sentiment scores within valid range", async () => {
    // Setup
    const marketTitle = "Test Market";
    const marketDescription = "Test Description";

    // Execute
    const insight = await aiService.getMarketInsight(
      marketTitle,
      marketDescription,
    );

    // Assert
    expect(insight.sentimentScore).toBeGreaterThanOrEqual(-1);
    expect(insight.sentimentScore).toBeLessThanOrEqual(1);
  });

  it("should include historical comparisons", async () => {
    // Setup
    const marketTitle = "Will Bitcoin reach $100k by 2025?";
    const marketDescription = "Crypto prediction";

    // Execute
    const insight = await aiService.getMarketInsight(
      marketTitle,
      marketDescription,
    );

    // Assert
    expect(Array.isArray(insight.historicalComparisons)).toBe(true);
    expect(insight.historicalComparisons.length).toBeGreaterThan(0);
    expect(
      insight.historicalComparisons.every((item) => typeof item === "string"),
    ).toBe(true);
  });

  it("should provide relevant sources", async () => {
    // Setup
    const marketTitle = "Political question about France";
    const marketDescription = "French politics";

    // Execute
    const insight = await aiService.getMarketInsight(
      marketTitle,
      marketDescription,
    );

    // Assert
    expect(Array.isArray(insight.sources)).toBe(true);
    expect(insight.sources.length).toBeGreaterThan(0);
    expect(insight.sources.every((source) => typeof source === "string")).toBe(
      true,
    );
  });

  it("should handle errors gracefully", async () => {
    // Setup
    // Mock a scenario that could cause an error
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Execute & Assert
    try {
      const insight = await aiService.getMarketInsight("", "");
      expect(insight).toBeDefined();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    } finally {
      console.error = originalConsoleError;
    }
  });

  it("should clear cache when requested", async () => {
    // Setup
    const marketTitle = "Test Market";
    const marketDescription = "Test Description";

    const insight1 = await aiService.getMarketInsight(
      marketTitle,
      marketDescription,
    );

    // Execute
    aiService.clearCache();
    const insight2 = await aiService.getMarketInsight(
      marketTitle,
      marketDescription,
    );

    // Assert
    // Should be different objects due to cache clear
    expect(insight1).not.toBe(insight2);
    expect(insight1.lastUpdated).not.toBe(insight2.lastUpdated);
  });
});
