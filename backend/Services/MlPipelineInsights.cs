using OpenArms.Api.Models;

namespace OpenArms.Api.Services;

public static class MlPipelineInsights
{
    /// <summary>Stable yyyy-MM prefix for grouping; avoids Range exceptions on malformed dates.</summary>
    public static string? MonthKey(string? donationDate)
    {
        if (string.IsNullOrWhiteSpace(donationDate)) return null;
        var d = donationDate.Trim();
        if (d.Length >= 7 && d[4] == '-' && char.IsDigit(d[0]))
            return d[..7];
        if (DateTime.TryParse(d, System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var dt))
            return dt.ToString("yyyy-MM");
        return null;
    }

    public static DonationForecastResult BuildDonationForecast(IReadOnlyList<Donation> donations)
    {
        var monetary = donations
            .Where(d => d.DonationType == "Monetary")
            .Select(d => (d, mk: MonthKey(d.DonationDate)))
            .Where(x => x.mk != null)
            .ToList();

        var monthly = monetary
            .GroupBy(x => x.mk!)
            .Select(g => new MonthlyTotalPoint(g.Key, g.Sum(x => x.d.Amount ?? 0), g.Count()))
            .OrderBy(x => x.Month)
            .ToList();

        if (monthly.Count < 2)
        {
            return new DonationForecastResult(monthly, null, 0, monthly.Count,
                "linear_regression (insufficient history — need at least 2 months)");
        }

        var ys = monthly.Select(m => (double)m.Total).ToArray();
        var n = ys.Length;
        double sumX = 0, sumY = 0, sumXy = 0, sumX2 = 0;
        for (var i = 0; i < n; i++)
        {
            sumX += i;
            sumY += ys[i];
            sumXy += i * ys[i];
            sumX2 += i * i;
        }

        var denom = n * sumX2 - sumX * sumX;
        var slope = denom != 0 ? (n * sumXy - sumX * sumY) / denom : 0d;
        var intercept = (sumY - slope * sumX) / n;
        var next = slope * n + intercept;
        if (next < 0) next = 0;

        return new DonationForecastResult(monthly, (decimal)next, (decimal)slope, n,
            "ordinary_least_squares_on_month_index");
    }

    public static RiskScoringResult BuildRiskScoring(IReadOnlyList<Resident> residents)
    {
        var active = residents.Where(r => r.CaseStatus == "Active").ToList();
        var byLevel = active
            .GroupBy(r => string.IsNullOrWhiteSpace(r.CurrentRiskLevel) ? "Unknown" : r.CurrentRiskLevel!)
            .Select(g => new RiskLevelCount(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var highCrit = active.Count(r => r.CurrentRiskLevel is "High" or "Critical");
        var share = active.Count > 0 ? (double)highCrit / active.Count : 0;

        return new RiskScoringResult(byLevel, share, active.Count, highCrit);
    }

    public static OccupancyPipelineResult BuildOccupancy(IReadOnlyList<Safehouse> safehouses)
    {
        var active = safehouses.Where(s => s.Status == "Active").ToList();
        var locations = active.Select(s =>
        {
            var cap = s.CapacityGirls ?? 0;
            var cur = s.CurrentOccupancy ?? 0;
            var pct = cap > 0 ? Math.Round(100d * cur / cap, 1) : 0d;
            return new OccupancyLocationResult(s.Name ?? $"Safehouse {s.SafehouseId}", cap, cur, pct);
        }).ToList();

        var avg = locations.Count > 0
            ? Math.Round(locations.Average(l => l.UtilizationPercent), 1)
            : 0d;

        return new OccupancyPipelineResult(locations, avg);
    }

    public static DonorChurnResult BuildDonorChurn(
        IReadOnlyList<Donation> donations,
        IReadOnlyList<Supporter> supporters)
    {
        var monetary = donations
            .Where(d => d.DonationType == "Monetary" && d.SupporterId.HasValue)
            .ToList();

        var lastBySupporter = monetary
            .GroupBy(d => d.SupporterId!.Value)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var dates = g.Where(d => !string.IsNullOrEmpty(d.DonationDate)).Select(d => d.DonationDate!).ToList();
                    return dates.Count > 0 ? dates.Max() : "";
                });

        var cutoff = DateTime.UtcNow.AddDays(-90).ToString("yyyy-MM-dd");
        var active90 = lastBySupporter.Values.Count(d => string.CompareOrdinal(d, cutoff) >= 0);
        var lapsing = lastBySupporter.Count - active90;

        var monetaryActive = supporters
            .Where(s => s.SupporterType == "MonetaryDonor" && s.Status == "Active")
            .ToList();

        var withIds = lastBySupporter.Keys.ToHashSet();
        var neverDonated = monetaryActive.Count(s => !withIds.Contains(s.SupporterId));

        var sixMonthPrefix = DateTime.UtcNow.AddMonths(-6).ToString("yyyy-MM");
        var recentMonthly = monetary
            .Select(d => (d, mk: MonthKey(d.DonationDate)))
            .Where(x => x.mk != null && string.CompareOrdinal(x.mk, sixMonthPrefix) >= 0)
            .GroupBy(x => x.mk!)
            .Select(g => new MonthlyTotalPoint(g.Key, g.Sum(x => x.d.Amount ?? 0), g.Count()))
            .OrderBy(x => x.Month)
            .ToList();

        return new DonorChurnResult(
            monetaryActive.Count,
            lastBySupporter.Count,
            active90,
            lapsing,
            neverDonated,
            recentMonthly);
    }
}
