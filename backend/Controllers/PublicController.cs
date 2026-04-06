using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController(SupabaseService db) : ControllerBase
{
    [HttpGet("impact-snapshot")]
    public async Task<IActionResult> ImpactSnapshot()
    {
        var residents = await db.GetAllAsync<Resident>("residents", "select=id,status,reintegration_progress");
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses", "select=id,status");
        var donations = await db.GetAllAsync<Donation>("donations", "select=amount");

        var total = residents.Count;
        var active = residents.Count(r => r.Status == "active");
        var reintegrated = residents.Count(r => r.Status == "reintegrated");
        var totalDonations = donations.Sum(d => d.Amount ?? 0);
        var activeSafehouses = safehouses.Count(s => s.Status == "active");

        return Ok(new
        {
            totalResidentsHelped = total,
            activeResidents = active,
            reintegratedResidents = reintegrated,
            reintegrationRate = total > 0 ? (int)Math.Round((double)reintegrated / total * 100) : 0,
            totalSafehouses = activeSafehouses,
            totalDonationsReceived = totalDonations,
            lastUpdated = DateTime.UtcNow
        });
    }

    [HttpGet("safehouses")]
    public async Task<IActionResult> GetSafehouses()
    {
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses",
            "select=*&status=eq.active");
        var residents = await db.GetAllAsync<Resident>("residents", "select=safehouse_id,status");

        var result = safehouses.Select(s => new
        {
            s.Id, s.Name, s.Region, s.City, s.Capacity,
            s.Latitude, s.Longitude,
            currentResidents = residents.Count(r => r.SafehouseId == s.Id && r.Status == "active")
        });

        return Ok(result);
    }

    [HttpGet("donation-trends")]
    public async Task<IActionResult> DonationTrends()
    {
        var donations = await db.GetAllAsync<Donation>("donations", "select=amount,donated_at&order=donated_at.asc");

        var grouped = donations
            .Where(d => !string.IsNullOrEmpty(d.DonatedAt))
            .GroupBy(d => d.DonatedAt![..7])
            .Select(g => new { month = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() })
            .OrderBy(x => x.month)
            .ToList();

        return Ok(grouped);
    }

    [HttpGet("outcome-metrics")]
    public async Task<IActionResult> OutcomeMetrics()
    {
        var residents = await db.GetAllAsync<Resident>("residents", "select=status,risk_level,case_category");

        var byStatus = residents.GroupBy(r => r.Status)
            .Select(g => new { status = g.Key, count = g.Count() });
        var byRisk = residents.GroupBy(r => r.RiskLevel)
            .Select(g => new { riskLevel = g.Key, count = g.Count() });
        var byCategory = residents.GroupBy(r => r.CaseCategory)
            .Select(g => new { category = g.Key, count = g.Count() });

        return Ok(new { byStatus, byRisk, byCategory });
    }

    [HttpPost("contact")]
    public async Task<IActionResult> Contact([FromBody] object body)
    {
        return Ok(new { message = "Thank you for your message. We will be in touch soon." });
    }
}
