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
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type,
        [FromQuery] string? status,
        [FromQuery] string? relationship)
    {
        var filters = new List<string>();
        if (!string.IsNullOrEmpty(type)) filters.Add($"supporter_type=eq.{type}");
        if (!string.IsNullOrEmpty(status)) filters.Add($"status=eq.{status}");
        if (!string.IsNullOrEmpty(relationship)) filters.Add($"relationship_type=eq.{relationship}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var supporters = await db.GetAllAsync<Supporter>("supporters",
            $"select=*&{filterStr}order=display_name.asc");

        var donations = await db.GetAllAsync<Donation>("donations",
            "select=supporter_id,amount,donation_date,donation_type");

        var result = supporters.Select(s =>
        {
            var myDonations = donations.Where(d => d.SupporterId == s.SupporterId).ToList();
            var monetary = myDonations.Where(d => d.DonationType == "Monetary").ToList();
            var lastDonation = myDonations.MaxBy(d => d.DonationDate);
            return new
            {
                s.SupporterId, s.SupporterType, s.DisplayName, s.OrganizationName,
                s.FirstName, s.LastName, s.RelationshipType, s.Region, s.Country,
                s.Email, s.Phone, s.Status, s.FirstDonationDate, s.AcquisitionChannel, s.CreatedAt,
                totalMonetary = monetary.Sum(d => d.Amount ?? 0),
                donationCount = myDonations.Count,
                lastDonationDate = lastDonation?.DonationDate
            };
        });
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var supporter = await db.GetOneAsync<Supporter>("supporters",
            $"supporter_id=eq.{id}&select=*");
        if (supporter == null) return NotFound();

        var donations = await db.GetAllAsync<Donation>("donations",
            $"supporter_id=eq.{id}&select=*&order=donation_date.desc");

        return Ok(new { supporter, donations });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SupporterRequest req)
    {
        var result = await db.InsertAsync<Supporter>("supporters", new
        {
            supporter_type = req.SupporterType,
            display_name = req.DisplayName,
            organization_name = req.OrganizationName,
            first_name = req.FirstName,
            last_name = req.LastName,
            relationship_type = req.RelationshipType,
            region = req.Region,
            country = req.Country,
            email = req.Email,
            phone = req.Phone,
            status = req.Status ?? "Active",
            acquisition_channel = req.AcquisitionChannel
        });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SupporterRequest req)
    {
        var result = await db.UpdateAsync<Supporter>("supporters", $"supporter_id=eq.{id}", new
        {
            supporter_type = req.SupporterType,
            display_name = req.DisplayName,
            organization_name = req.OrganizationName,
            first_name = req.FirstName,
            last_name = req.LastName,
            relationship_type = req.RelationshipType,
            region = req.Region,
            country = req.Country,
            email = req.Email,
            phone = req.Phone,
            status = req.Status,
            acquisition_channel = req.AcquisitionChannel
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("supporters", $"supporter_id=eq.{id}");
        return NoContent();
    }
}
