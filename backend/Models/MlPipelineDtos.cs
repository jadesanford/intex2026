namespace OpenArms.Api.Models;

public record MonthlyTotalPoint(string Month, decimal Total, int Count);

public record DonationForecastResult(
    IReadOnlyList<MonthlyTotalPoint> Monthly,
    decimal? ForecastNextMonthPhp,
    decimal TrendSlopePhpPerMonth,
    int MonthsUsed,
    string Method);

public record RiskLevelCount(string Level, int Count);

public record RiskScoringResult(
    IReadOnlyList<RiskLevelCount> ByLevel,
    double HighCriticalShare,
    int ActiveCases,
    int HighOrCriticalActive);

public record OccupancyLocationResult(
    string Name,
    int Capacity,
    int Current,
    double UtilizationPercent,
    double? StrainProbabilityPercent = null,
    double? StrainForecastValue = null);

public record OccupancyPipelineResult(
    IReadOnlyList<OccupancyLocationResult> Locations,
    double AvgUtilization);

public record DonorChurnResult(
    int MonetarySupportersActive,
    int WithMonetaryDonations,
    int ActiveLast90Days,
    int Lapsing,
    int NeverDonated,
    IReadOnlyList<MonthlyTotalPoint> RecentMonthly);

public record MlPipelinesBundle(
    DateTime GeneratedAt,
    DonationForecastResult DonationForecast,
    RiskScoringResult RiskScoring,
    OccupancyPipelineResult Occupancy,
    DonorChurnResult DonorChurn);
