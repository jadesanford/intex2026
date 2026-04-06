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
        // Always compute live from actual data
        var residents = await db.GetAllAsync<Resident>("residents",
            "select=resident_id,case_status,reintegration_status,current_risk_level");
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses",
            "select=safehouse_id,status,capacity_girls,current_occupancy,name,city,region");
        var donations = await db.GetAllAsync<Donation>("donations",
            "select=amount,donation_type");

        var total = residents.Count;
        var active = residents.Count(r => r.CaseStatus == "Active");
        var reintegrated = residents.Count(r => r.ReintegrationStatus == "Completed");
        var totalDonations = donations.Where(d => d.DonationType == "Monetary").Sum(d => d.Amount ?? 0);
        var activeSafehouses = safehouses.Count(s => s.Status == "Active");
        var totalCapacity = safehouses.Where(s => s.Status == "Active").Sum(s => s.CapacityGirls ?? 0);
        var totalOccupancy = safehouses.Where(s => s.Status == "Active").Sum(s => s.CurrentOccupancy ?? 0);

        return Ok(new
        {
            totalResidentsHelped = total,
            activeResidents = active,
            reintegratedResidents = reintegrated,
            reintegrationRate = total > 0 ? Math.Round((double)reintegrated / total * 100, 1) : 0,
            totalSafehouses = activeSafehouses,
            totalCapacity,
            totalOccupancy,
            totalDonationsReceived = totalDonations,
            lastUpdated = DateTime.UtcNow
        });
    }

    [HttpGet("safehouses")]
    public async Task<IActionResult> GetSafehouses()
    {
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses",
            "select=*&status=eq.Active&order=name.asc");

        var result = safehouses.Select(s => new
        {
            s.SafehouseId, s.SafehouseCode, s.Name, s.Region, s.City, s.Province,
            s.CapacityGirls, s.CurrentOccupancy, s.Status
        });

        return Ok(result);
    }

    [HttpGet("donation-trends")]
    public async Task<IActionResult> DonationTrends()
    {
        var donations = await db.GetAllAsync<Donation>("donations",
            "select=amount,donation_date,donation_type&donation_type=eq.Monetary&order=donation_date.asc");

        var grouped = donations
            .Where(d => !string.IsNullOrEmpty(d.DonationDate))
            .GroupBy(d => d.DonationDate![..7])
            .Select(g => new { month = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() })
            .OrderBy(x => x.month)
            .ToList();

        return Ok(grouped);
    }

    [HttpGet("outcome-metrics")]
    public async Task<IActionResult> OutcomeMetrics()
    {
        var residents = await db.GetAllAsync<Resident>("residents",
            "select=case_status,current_risk_level,case_category,reintegration_status");

        var byStatus = residents.GroupBy(r => r.CaseStatus)
            .Select(g => new { status = g.Key, count = g.Count() });
        var byRisk = residents.GroupBy(r => r.CurrentRiskLevel)
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
