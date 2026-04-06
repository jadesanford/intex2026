using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController(SupabaseService db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var residents = await db.GetAllAsync<Resident>("residents", "select=id,status,risk_level,safehouse_id,created_at");
        var donations = await db.GetAllAsync<Donation>("donations", "select=amount,donated_at");
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses", "select=id,capacity,status");
        var incidents = await db.GetAllAsync<Incident>("incidents", "select=id,resolved,severity");
        var supporters = await db.GetAllAsync<Supporter>("supporters", "select=id,is_recurring");

        var thisMonth = DateTime.UtcNow.ToString("yyyy-MM");
        var monthlyDonations = donations
            .Where(d => d.DonatedAt?.StartsWith(thisMonth) == true)
            .Sum(d => d.Amount ?? 0);

        return Ok(new
        {
            residents = new
            {
                total = residents.Count,
                active = residents.Count(r => r.Status == "active"),
                reintegrated = residents.Count(r => r.Status == "reintegrated"),
                highRisk = residents.Count(r => r.RiskLevel is "high" or "critical"),
                critical = residents.Count(r => r.RiskLevel == "critical")
            },
            donations = new
            {
                thisMonth = monthlyDonations,
                total = donations.Sum(d => d.Amount ?? 0),
                count = donations.Count
            },
            safehouses = new
            {
                total = safehouses.Count(s => s.Status == "active"),
                totalCapacity = safehouses.Sum(s => s.Capacity ?? 0)
            },
            incidents = new
            {
                total = incidents.Count,
                unresolved = incidents.Count(i => i.Resolved != true),
                critical = incidents.Count(i => i.Severity == "critical")
            },
            supporters = new
            {
                total = supporters.Count,
                recurring = supporters.Count(s => s.IsRecurring == true)
            }
        });
    }

    [HttpGet("safehouse-comparison")]
    public async Task<IActionResult> SafehouseComparison()
    {
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses", "select=*");
        var residents = await db.GetAllAsync<Resident>("residents", "select=safehouse_id,status,risk_level");

        var result = safehouses.Select(s =>
        {
            var mine = residents.Where(r => r.SafehouseId == s.Id).ToList();
            return new
            {
                s.Id, s.Name, s.City, s.Capacity,
                current = mine.Count(r => r.Status == "active"),
                total = mine.Count,
                reintegrated = mine.Count(r => r.Status == "reintegrated"),
                highRisk = mine.Count(r => r.RiskLevel is "high" or "critical"),
                occupancyRate = s.Capacity > 0
                    ? Math.Round((double)mine.Count(r => r.Status == "active") / s.Capacity!.Value * 100, 1)
                    : 0
            };
        });
        return Ok(result);
    }

    [HttpGet("donation-trends")]
    public async Task<IActionResult> DonationTrends()
    {
        var donations = await db.GetAllAsync<Donation>("donations",
            "select=amount,donated_at,channel,campaign&order=donated_at.asc");

        var monthly = donations
            .Where(d => !string.IsNullOrEmpty(d.DonatedAt))
            .GroupBy(d => d.DonatedAt![..7])
            .Select(g => new { month = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() })
            .OrderBy(x => x.month);

        var byChannel = donations.GroupBy(d => d.Channel)
            .Select(g => new { channel = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() });

        var byCampaign = donations.GroupBy(d => d.Campaign)
            .Select(g => new { campaign = g.Key, total = g.Sum(d => d.Amount ?? 0) })
            .OrderByDescending(x => x.total).Take(10);

        return Ok(new { monthly, byChannel, byCampaign });
    }

    [HttpGet("resident-outcomes")]
    public async Task<IActionResult> ResidentOutcomes()
    {
        var residents = await db.GetAllAsync<Resident>("residents",
            "select=status,risk_level,case_category,reintegration_progress,created_at");

        var byStatus = residents.GroupBy(r => r.Status)
            .Select(g => new { name = g.Key, value = g.Count() });
        var byCategory = residents.GroupBy(r => r.CaseCategory)
            .Select(g => new { name = g.Key, value = g.Count() });
        var avgProgress = residents.Any() ? residents.Average(r => r.ReintegrationProgress ?? 0) : 0;

        var monthly = residents
            .Where(r => r.CreatedAt.HasValue)
            .GroupBy(r => r.CreatedAt!.Value.ToString("yyyy-MM"))
            .Select(g => new { month = g.Key, admissions = g.Count() })
            .OrderBy(x => x.month);

        return Ok(new { byStatus, byCategory, avgProgress = Math.Round(avgProgress, 1), monthly });
    }

    [HttpGet("at-risk")]
    public async Task<IActionResult> AtRisk()
    {
        var residents = await db.GetAllAsync<Resident>("residents",
            "select=*,safehouses(name)&risk_level=in.(high,critical)&status=eq.active&order=risk_level.asc");
        return Ok(residents);
    }
}
