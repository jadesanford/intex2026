using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DonationsController(SupabaseService db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? campaign,
        [FromQuery] string? channel,
        [FromQuery] string? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        var filters = new List<string>();
        if (!string.IsNullOrEmpty(campaign)) filters.Add($"campaign_name=eq.{campaign}");
        if (!string.IsNullOrEmpty(channel)) filters.Add($"channel_source=eq.{channel}");
        if (!string.IsNullOrEmpty(type)) filters.Add($"donation_type=eq.{type}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var offset = (page - 1) * pageSize;
        var donations = await db.GetAllAsync<dynamic>("donations",
            $"select=*,supporters(display_name,supporter_type,organization_name)&{filterStr}order=donation_date.desc&limit={pageSize}&offset={offset}");
        return Ok(donations);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var donations = await db.GetAllAsync<Donation>("donations",
            "select=amount,currency_code,donation_date,channel_source,donation_type,campaign_name");

        var monetary = donations.Where(d => d.DonationType == "Monetary").ToList();
        var total = monetary.Sum(d => d.Amount ?? 0);

        var monthly = monetary
            .Where(d => !string.IsNullOrEmpty(d.DonationDate))
            .GroupBy(d => d.DonationDate![..7])
            .Select(g => new { month = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() })
            .OrderBy(x => x.month)
            .ToList();

        var byChannel = donations.GroupBy(d => d.ChannelSource)
            .Select(g => new { channel = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() });

        var byType = donations.GroupBy(d => d.DonationType)
            .Select(g => new { type = g.Key, count = g.Count() });

        var byCampaign = monetary
            .Where(d => !string.IsNullOrEmpty(d.CampaignName))
            .GroupBy(d => d.CampaignName)
            .Select(g => new { campaign = g.Key, total = g.Sum(d => d.Amount ?? 0) })
            .OrderByDescending(x => x.total).Take(10);

        var monetaryCount = monetary.Count;
        return Ok(new { total, monthly, byChannel, byType, byCampaign, count = donations.Count, monetaryCount });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DonationRequest req)
    {
        var result = await db.InsertAsync<Donation>("donations", new
        {
            supporter_id = req.SupporterId,
            donation_type = req.DonationType ?? "Monetary",
            donation_date = req.DonationDate,
            channel_source = req.ChannelSource,
            currency_code = req.CurrencyCode ?? "PHP",
            amount = req.Amount,
            estimated_value = req.EstimatedValue,
            impact_unit = req.ImpactUnit,
            is_recurring = req.IsRecurring ?? false,
            campaign_name = req.CampaignName,
            notes = req.Notes,
            created_by_partner_id = req.CreatedByPartnerId
        });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] DonationRequest req)
    {
        var result = await db.UpdateAsync<Donation>("donations", $"donation_id=eq.{id}", new
        {
            supporter_id = req.SupporterId,
            donation_type = req.DonationType,
            donation_date = req.DonationDate,
            channel_source = req.ChannelSource,
            currency_code = req.CurrencyCode,
            amount = req.Amount,
            estimated_value = req.EstimatedValue,
            impact_unit = req.ImpactUnit,
            is_recurring = req.IsRecurring,
            campaign_name = req.CampaignName,
            notes = req.Notes
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("donations", $"donation_id=eq.{id}");
        return NoContent();
    }
}
