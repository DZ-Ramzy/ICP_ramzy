// Service de distribution des gains pour les marchés de prédiction

export interface WinnerPosition {
  userPrincipal: string;
  stakedAmount: number;
  winningsShare: number;
  totalPayout: number;
}

export interface DistributionResult {
  totalPool: number;
  winningPool: number;
  losingPool: number;
  adminFee: number; // 10% du pool total
  distributableAmount: number; // Montant à distribuer après admin fee
  winners: WinnerPosition[];
  distributionFormula: string;
}

export class RewardsDistributionService {
  /**
   * Calcule la distribution équitable des gains basée sur une formule proportionnelle
   * avec bonus pour les early adopters ET commission admin de 10%
   *
   * Formule hybride utilisée :
   * 1. 10% du pool total va à l'admin
   * 2. 90% du pool perdant distribué aux gagnants :
   *    - 80% distribué proportionnellement selon les montants misés
   *    - 20% distribué avec bonus pour early adopters (ordre chronologique)
   *
   * @param winningPositions - Positions gagnantes avec leurs montants
   * @param totalYesPool - Pool total des mises "Yes"
   * @param totalNoPool - Pool total des mises "No"
   * @param winningsside - Côté gagnant ("Yes" ou "No")
   */
  static calculateDistribution(
    winningPositions: Array<{
      userPrincipal: string;
      stakedAmount: number;
      timestamp?: number; // Pour le bonus early adopter
    }>,
    totalYesPool: number,
    totalNoPool: number,
    winningSide: "Yes" | "No",
  ): DistributionResult {
    const winningPool = winningSide === "Yes" ? totalYesPool : totalNoPool;
    const losingPool = winningSide === "Yes" ? totalNoPool : totalYesPool;
    const totalPool = winningPool + losingPool;

    // 10% du pool total pour l'admin
    const adminFee = totalPool * 0.1;

    // 90% du pool perdant distribué aux gagnants (le pool gagnant leur est remboursé)
    const distributableAmount = losingPool * 0.9;

    // Protection contre division par zéro
    if (winningPositions.length === 0 || winningPool === 0) {
      return {
        totalPool,
        winningPool,
        losingPool,
        adminFee,
        distributableAmount,
        winners: [],
        distributionFormula: "No winning positions found",
      };
    }

    // Calcul des parts
    const totalStakedByWinners = winningPositions.reduce(
      (sum, pos) => sum + pos.stakedAmount,
      0,
    );

    // 80% du montant distribuable (90% du losing pool) distribué proportionnellement
    const proportionalPool = distributableAmount * 0.8;

    // 20% du montant distribuable avec bonus early adopter
    const earlyAdopterPool = distributableAmount * 0.2;

    // Trier par timestamp pour identifier les early adopters (si disponible)
    const sortedPositions = [...winningPositions].sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
    );

    const winners: WinnerPosition[] = winningPositions.map((position) => {
      // 1. Part proportionnelle (80% du distributable amount)
      const proportionalShare =
        (position.stakedAmount / totalStakedByWinners) * proportionalPool;

      // 2. Bonus early adopter (20% du distributable amount)
      // Plus tôt vous avez misé, plus le bonus est important
      const earlyAdopterRank = sortedPositions.findIndex(
        (p) => p.userPrincipal === position.userPrincipal,
      );
      const earlyAdopterMultiplier = this.calculateEarlyAdopterMultiplier(
        earlyAdopterRank,
        winningPositions.length,
      );
      const earlyAdopterBonus =
        (position.stakedAmount / totalStakedByWinners) *
        earlyAdopterPool *
        earlyAdopterMultiplier;

      // 3. Remboursement de la mise initiale
      const initialStake = position.stakedAmount;

      // Total des gains
      const winningsShare = proportionalShare + earlyAdopterBonus;
      const totalPayout = initialStake + winningsShare;

      return {
        userPrincipal: position.userPrincipal,
        stakedAmount: position.stakedAmount,
        winningsShare,
        totalPayout,
      };
    });

    const distributionFormula = this.getFormulaExplanation();

    return {
      totalPool,
      winningPool,
      losingPool,
      adminFee,
      distributableAmount,
      winners,
      distributionFormula,
    };
  }

  /**
   * Calcule le multiplicateur pour le bonus early adopter
   * Les premiers à miser reçoivent un bonus plus important
   */
  private static calculateEarlyAdopterMultiplier(
    rank: number,
    totalParticipants: number,
  ): number {
    if (totalParticipants <= 1) return 1;

    // Formule décroissante : les premiers obtiennent plus
    // Rang 0 (premier) = 2x, dernier rang = 0.5x
    const normalizedRank = rank / (totalParticipants - 1); // 0 à 1
    return 2 - 1.5 * normalizedRank; // 2 à 0.5
  }

  /**
   * Calcule la distribution simple proportionnelle (pour comparaison)
   * Inclut également la commission admin de 10%
   */
  static calculateSimpleProportionalDistribution(
    winningPositions: Array<{
      userPrincipal: string;
      stakedAmount: number;
    }>,
    totalYesPool: number,
    totalNoPool: number,
    winningSide: "Yes" | "No",
  ): DistributionResult {
    const winningPool = winningSide === "Yes" ? totalYesPool : totalNoPool;
    const losingPool = winningSide === "Yes" ? totalNoPool : totalYesPool;
    const totalPool = winningPool + losingPool;

    // 10% du pool total pour l'admin
    const adminFee = totalPool * 0.1;

    // 90% du pool perdant distribué aux gagnants
    const distributableAmount = losingPool * 0.9;

    if (winningPositions.length === 0 || winningPool === 0) {
      return {
        totalPool,
        winningPool,
        losingPool,
        adminFee,
        distributableAmount,
        winners: [],
        distributionFormula:
          "Simple proportional distribution - No winning positions",
      };
    }

    const totalStakedByWinners = winningPositions.reduce(
      (sum, pos) => sum + pos.stakedAmount,
      0,
    );

    const winners: WinnerPosition[] = winningPositions.map((position) => {
      // Part proportionnelle simple du montant distribuable
      const proportion = position.stakedAmount / totalStakedByWinners;
      const winningsShare = distributableAmount * proportion;
      const totalPayout = position.stakedAmount + winningsShare;

      return {
        userPrincipal: position.userPrincipal,
        stakedAmount: position.stakedAmount,
        winningsShare,
        totalPayout,
      };
    });

    return {
      totalPool,
      winningPool,
      losingPool,
      adminFee,
      distributableAmount,
      winners,
      distributionFormula:
        "Simple Proportional: winnings = (your_stake / total_winning_stakes) * 90% * losing_pool (10% admin fee)",
    };
  }

  /**
   * Calcule la distribution avec formule Kelly Criterion adaptée
   * Favorise ceux qui ont pris plus de risques quand les cotes étaient défavorables
   * Inclut également la commission admin de 10%
   */
  static calculateKellyBasedDistribution(
    winningPositions: Array<{
      userPrincipal: string;
      stakedAmount: number;
      oddsWhenBet: number; // Cotes au moment de la mise
    }>,
    totalYesPool: number,
    totalNoPool: number,
    winningSide: "Yes" | "No",
  ): DistributionResult {
    const winningPool = winningSide === "Yes" ? totalYesPool : totalNoPool;
    const losingPool = winningSide === "Yes" ? totalNoPool : totalYesPool;
    const totalPool = winningPool + losingPool;

    // 10% du pool total pour l'admin
    const adminFee = totalPool * 0.1;

    // 90% du pool perdant distribué aux gagnants
    const distributableAmount = losingPool * 0.9;

    if (winningPositions.length === 0 || winningPool === 0) {
      return {
        totalPool,
        winningPool,
        losingPool,
        adminFee,
        distributableAmount,
        winners: [],
        distributionFormula: "Kelly-based distribution - No winning positions",
      };
    }

    // Calcul du score Kelly pour chaque position
    const positionsWithKellyScore = winningPositions.map((position) => {
      // Score basé sur le courage de miser quand les cotes étaient faibles
      const kellyScore = position.stakedAmount * (1 / position.oddsWhenBet);
      return { ...position, kellyScore };
    });

    const totalKellyScore = positionsWithKellyScore.reduce(
      (sum, pos) => sum + pos.kellyScore,
      0,
    );

    const winners: WinnerPosition[] = positionsWithKellyScore.map(
      (position) => {
        // Distribution basée sur le score Kelly du montant distribuable
        const kellyProportion = position.kellyScore / totalKellyScore;
        const winningsShare = distributableAmount * kellyProportion;
        const totalPayout = position.stakedAmount + winningsShare;

        return {
          userPrincipal: position.userPrincipal,
          stakedAmount: position.stakedAmount,
          winningsShare,
          totalPayout,
        };
      },
    );

    return {
      totalPool,
      winningPool,
      losingPool,
      adminFee,
      distributableAmount,
      winners,
      distributionFormula:
        "Kelly-based: winnings = (stake * (1/odds_when_bet)) / total_kelly_score * 90% * losing_pool (10% admin fee)",
    };
  }

  /**
   * Explication de la formule hybride recommandée avec commission admin
   */
  private static getFormulaExplanation(): string {
    return `
Formule Hybride Équitable avec Commission Admin :

🏛️ COMMISSION ADMIN : 10% du pool total récupéré par l'administrateur

📊 DISTRIBUTION AUX GAGNANTS : 90% du pool perdant distribué comme suit :
1. 80% Distribution Proportionnelle : (votre_mise / total_mises_gagnantes) × 80% × 90% × pool_perdant
2. 20% Bonus Early Adopter : (votre_mise / total_mises_gagnantes) × 20% × 90% × pool_perdant × multiplicateur_early_adopter
3. Remboursement : + votre_mise_initiale

Multiplicateur Early Adopter :
- 1er à miser : 2x le bonus
- Dernier à miser : 0.5x le bonus
- Distribution linéaire entre les deux

Cette formule récompense :
- La taille de la mise (proportionnalité)
- La prise de risque précoce (early adopter bonus)
- Garantit l'équité pour tous les participants
- Assure la viabilité financière de la plateforme (commission admin)
    `.trim();
  }

  /**
   * Formate les résultats pour l'affichage avec commission admin
   */
  static formatDistributionResults(distribution: DistributionResult): string {
    let result = `\n=== DISTRIBUTION DES GAINS ===\n`;
    result += `Pool Total: ${distribution.totalPool.toFixed(2)} tokens\n`;
    result += `Pool Gagnant: ${distribution.winningPool.toFixed(2)} tokens\n`;
    result += `Pool Perdant: ${distribution.losingPool.toFixed(2)} tokens\n`;
    result += `🏛️ Commission Admin (10%): ${distribution.adminFee.toFixed(2)} tokens\n`;
    result += `💰 Montant Distribuable (90% du pool perdant): ${distribution.distributableAmount.toFixed(2)} tokens\n\n`;

    result += `--- GAGNANTS ---\n`;
    distribution.winners.forEach((winner, index) => {
      result += `${index + 1}. User: ${winner.userPrincipal.slice(0, 8)}...\n`;
      result += `   Mise initiale: ${winner.stakedAmount.toFixed(2)} tokens\n`;
      result += `   Gains supplémentaires: ${winner.winningsShare.toFixed(2)} tokens\n`;
      result += `   💸 Total reçu: ${winner.totalPayout.toFixed(2)} tokens\n`;
      result += `   📈 ROI: ${((winner.totalPayout / winner.stakedAmount - 1) * 100).toFixed(1)}%\n\n`;
    });

    const totalDistributed = distribution.winners.reduce(
      (sum, w) => sum + w.totalPayout,
      0,
    );
    result += `💵 Total distribué aux gagnants: ${totalDistributed.toFixed(2)} tokens\n`;
    result += `🏛️ Total pour l'admin: ${distribution.adminFee.toFixed(2)} tokens\n`;
    result += `✅ Vérification: ${(totalDistributed + distribution.adminFee).toFixed(2)} tokens = ${distribution.totalPool.toFixed(2)} tokens\n\n`;

    result += `--- FORMULE UTILISÉE ---\n`;
    result += distribution.distributionFormula;

    return result;
  }

  /**
   * Fonction principale pour traiter la fermeture d'un marché et distribuer les gains
   * Cette fonction doit être appelée automatiquement lors de la fermeture d'un marché
   */
  static async processMarketClosure(
    marketId: number,
    winningSide: "Yes" | "No",
    winningPositions: Array<{
      userPrincipal: string;
      stakedAmount: number;
      timestamp?: number;
    }>,
    totalYesPool: number,
    totalNoPool: number,
    adminPrincipal: string,
  ): Promise<{
    distribution: DistributionResult;
    transfers: Array<{
      to: string;
      amount: number;
      type: "winner_payout" | "admin_fee";
    }>;
  }> {
    // Calculer la distribution avec la formule hybride
    const distribution = this.calculateDistribution(
      winningPositions,
      totalYesPool,
      totalNoPool,
      winningSide,
    );

    // Préparer les transferts
    const transfers: Array<{
      to: string;
      amount: number;
      type: "winner_payout" | "admin_fee";
    }> = [];

    // Ajouter les payouts pour les gagnants
    distribution.winners.forEach((winner) => {
      transfers.push({
        to: winner.userPrincipal,
        amount: winner.totalPayout,
        type: "winner_payout",
      });
    });

    // Ajouter la commission admin
    transfers.push({
      to: adminPrincipal,
      amount: distribution.adminFee,
      type: "admin_fee",
    });

    console.log(`📊 Market ${marketId} closed - Distribution calculated:`);
    console.log(this.formatDistributionResults(distribution));
    console.log(`💸 Preparing ${transfers.length} transfers...`);

    return {
      distribution,
      transfers,
    };
  }

  /**
   * Valide qu'une distribution est mathématiquement correcte
   */
  static validateDistribution(distribution: DistributionResult): boolean {
    const totalDistributed = distribution.winners.reduce(
      (sum, w) => sum + w.totalPayout,
      0,
    );
    const expectedTotal = distribution.totalPool;
    const actualTotal = totalDistributed + distribution.adminFee;

    const tolerance = 0.01; // Tolérance pour les erreurs d'arrondi
    const isValid = Math.abs(actualTotal - expectedTotal) < tolerance;

    if (!isValid) {
      console.error(`❌ Distribution validation failed:`);
      console.error(`Expected total: ${expectedTotal}`);
      console.error(`Actual total: ${actualTotal}`);
      console.error(`Difference: ${Math.abs(actualTotal - expectedTotal)}`);
    }

    return isValid;
  }
}
