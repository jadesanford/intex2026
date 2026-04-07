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
    private async Task<int> NextSupporterId()
    {
        var latest = await db.GetAllAsync<Supporter>("supporters", "select=supporter_id&order=supporter_id.desc&limit=1");
        return latest.Count == 0 ? 1 : (latest[0].SupporterId + 1);
    }

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
            supporter_id = await NextSupporterId(),
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
            acquisition_channel = req.AcquisitionChannel,
            first_donation_date = string.IsNullOrWhiteSpace(req.FirstDonationDate) ? null : req.FirstDonationDate
        });
        if (result == null)
            return BadRequest(new { message = "Unable to create supporter." });
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
            status = string.IsNullOrWhiteSpace(req.Status) ? "Active" : req.Status,
            acquisition_channel = req.AcquisitionChannel,
            first_donation_date = string.IsNullOrWhiteSpace(req.FirstDonationDate) ? null : req.FirstDonationDate
        });
        if (result == null)
            return BadRequest(new { message = "Unable to update supporter." });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await db.DeleteAsync("supporters", $"supporter_id=eq.{id}");
        if (!deleted)
            return BadRequest(new { message = "Unable to delete supporter. They may have related donations, a linked login account, or database constraints prevented removal." });
        return NoContent();
    }
}
