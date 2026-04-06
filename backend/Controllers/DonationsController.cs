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
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        var filters = new List<string>();
        if (!string.IsNullOrEmpty(campaign)) filters.Add($"campaign=eq.{campaign}");
        if (!string.IsNullOrEmpty(channel)) filters.Add($"channel=eq.{channel}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var offset = (page - 1) * pageSize;
        var donations = await db.GetAllAsync<dynamic>("donations",
            $"select=*,supporters(name,type)&{filterStr}order=donated_at.desc&limit={pageSize}&offset={offset}");
        return Ok(donations);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var donations = await db.GetAllAsync<Donation>("donations", "select=amount,currency,donated_at,channel");
        var total = donations.Sum(d => d.Amount ?? 0);
        var monthly = donations
            .Where(d => !string.IsNullOrEmpty(d.DonatedAt))
            .GroupBy(d => d.DonatedAt![..7])
            .Select(g => new { month = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() })
            .OrderBy(x => x.month)
            .ToList();
        var byChannel = donations.GroupBy(d => d.Channel)
            .Select(g => new { channel = g.Key, total = g.Sum(d => d.Amount ?? 0) });
        return Ok(new { total, monthly, byChannel, count = donations.Count });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DonationRequest req)
    {
        var result = await db.InsertAsync<Donation>("donations", new
        {
            supporter_id = req.SupporterId,
            amount = req.Amount,
            currency = req.Currency ?? "IDR",
            donation_type = req.DonationType,
            campaign = req.Campaign,
            channel = req.Channel,
            donated_at = req.DonatedAt,
            receipt_issued = req.ReceiptIssued ?? false,
            notes = req.Notes
        });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] DonationRequest req)
    {
        var result = await db.UpdateAsync<Donation>("donations", $"id=eq.{id}", new
        {
            supporter_id = req.SupporterId,
            amount = req.Amount,
            currency = req.Currency,
            donation_type = req.DonationType,
            campaign = req.Campaign,
            channel = req.Channel,
            donated_at = req.DonatedAt,
            receipt_issued = req.ReceiptIssued,
            notes = req.Notes
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("donations", $"id=eq.{id}");
        return NoContent();
    }
}
