using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupportersController(SupabaseService db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? type, [FromQuery] string? status)
    {
        var filters = new List<string>();
        if (!string.IsNullOrEmpty(type)) filters.Add($"type=eq.{type}");
        if (!string.IsNullOrEmpty(status)) filters.Add($"status=eq.{status}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var supporters = await db.GetAllAsync<Supporter>("supporters",
            $"select=*&{filterStr}order=name.asc");

        var donations = await db.GetAllAsync<Donation>("donations", "select=supporter_id,amount,donated_at");

        var result = supporters.Select(s =>
        {
            var myDonations = donations.Where(d => d.SupporterId == s.Id).ToList();
            var lastDonation = myDonations.MaxBy(d => d.DonatedAt);
            var daysSinceLast = lastDonation?.DonatedAt != null
                ? (DateTime.UtcNow - DateTime.Parse(lastDonation.DonatedAt)).Days : (int?)null;
            return new
            {
                s.Id, s.Name, s.Email, s.Phone, s.Type, s.Country, s.City,
                s.IsRecurring, s.Notes, s.Status, s.CreatedAt,
                totalDonations = myDonations.Sum(d => d.Amount ?? 0),
                donationCount = myDonations.Count,
                lastDonationDate = lastDonation?.DonatedAt,
                daysSinceLastDonation = daysSinceLast,
                lapsing = s.IsRecurring == true && daysSinceLast > 60
            };
        });
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var supporter = await db.GetOneAsync<Supporter>("supporters", $"id=eq.{id}&select=*");
        if (supporter == null) return NotFound();
        var donations = await db.GetAllAsync<Donation>("donations",
            $"supporter_id=eq.{id}&select=*&order=donated_at.desc");
        return Ok(new { supporter, donations });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SupporterRequest req)
    {
        var result = await db.InsertAsync<Supporter>("supporters", new
        {
            name = req.Name, email = req.Email, phone = req.Phone,
            type = req.Type, country = req.Country, city = req.City,
            is_recurring = req.IsRecurring, notes = req.Notes,
            status = req.Status ?? "active"
        });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SupporterRequest req)
    {
        var result = await db.UpdateAsync<Supporter>("supporters", $"id=eq.{id}", new
        {
            name = req.Name, email = req.Email, phone = req.Phone,
            type = req.Type, country = req.Country, city = req.City,
            is_recurring = req.IsRecurring, notes = req.Notes, status = req.Status
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("supporters", $"id=eq.{id}");
        return NoContent();
    }
}
