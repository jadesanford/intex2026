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
    private async Task<int> NextDonationIdAsync()
    {
        var latest = await db.GetAllAsync<Donation>("donations", "select=donation_id&order=donation_id.desc&limit=1");
        return latest.Count == 0 ? 1 : (latest[0].DonationId + 1);
    }

    private async Task<int> NextInKindItemIdAsync()
    {
        var latest = await db.GetAllAsync<InKindDonationItem>("in_kind_donation_items",
            "select=item_id&order=item_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].ItemId + 1;
    }

    private async Task<int> NextSupporterIdAsync()
    {
        var latest = await db.GetAllAsync<Supporter>("supporters", "select=supporter_id&order=supporter_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].SupporterId + 1;
    }

    private async Task<int?> ResolveSupporterIdAsync()
    {
        var supporterClaim = User.FindFirst("supporter_id")?.Value;
        if (!string.IsNullOrWhiteSpace(supporterClaim) && int.TryParse(supporterClaim, out var claimSupporterId))
            return claimSupporterId;

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return null;

        var user = await db.GetOneAsync<User>("users", $"id=eq.{userId}&select=id,username,display_name,email,supporter_id");
        if (user == null) return null;
        if (user.SupporterId != null) return user.SupporterId;

        // Auto-provision a supporter profile for authenticated users missing supporter_id
        var supporter = await db.InsertAsync<Supporter>("supporters", new
        {
            supporter_id = await NextSupporterIdAsync(),
            supporter_type = "MonetaryDonor",
            display_name = string.IsNullOrWhiteSpace(user.DisplayName) ? user.Username : user.DisplayName,
            relationship_type = "Local",
            country = "Philippines",
            email = user.Email,
            status = "Active",
            acquisition_channel = "Website",
            created_at = DateTime.UtcNow
        });
        if (supporter == null) return null;

        var updatedUser = await db.UpdateAsync<User>("users", $"id=eq.{userId}", new
        {
            supporter_id = supporter.SupporterId,
            updated_at = DateTime.UtcNow
        });
        return updatedUser?.SupporterId ?? supporter.SupporterId;
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var supporterId = await ResolveSupporterIdAsync();
        if (supporterId == null)
            return Ok(Array.Empty<object>());

        var donations = await db.GetAllAsync<Donation>("donations",
            $"supporter_id=eq.{supporterId.Value}&select=*&order=donation_date.desc");
        return Ok(donations);
    }

    /// <summary>Donor-facing detail for one of the signed-in supporter's donations (includes in-kind line items).</summary>
    [HttpGet("mine/{id:int}/details")]
    public async Task<IActionResult> GetMineById(int id)
    {
        var supporterId = await ResolveSupporterIdAsync();
        if (supporterId == null)
            return NotFound();

        var donation = await db.GetOneAsync<Donation>("donations", $"donation_id=eq.{id}&select=*");
        if (donation == null || donation.SupporterId != supporterId)
            return NotFound();

        var inKindItems = await db.GetAllAsync<InKindDonationItem>("in_kind_donation_items",
            $"donation_id=eq.{id}&select=item_id,donation_id,item_name,item_category,quantity,unit_of_measure,estimated_unit_value,intended_use,received_condition&order=item_id.asc");

        return Ok(new
        {
            donation,
            inKindItems = inKindItems.Select(i => new
            {
                i.ItemId,
                i.DonationId,
                i.ItemName,
                i.ItemCategory,
                i.Quantity,
                i.UnitOfMeasure,
                i.EstimatedUnitValue,
                i.IntendedUse,
                i.ReceivedCondition
            }).ToList()
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? campaign,
        [FromQuery] string? channel,
        [FromQuery] string? type,
        [FromQuery] string? recurring,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        var filters = new List<string>();
        if (!string.IsNullOrEmpty(campaign)) filters.Add($"campaign_name=eq.{campaign}");
        if (!string.IsNullOrEmpty(channel)) filters.Add($"channel_source=eq.{channel}");
        if (!string.IsNullOrEmpty(type)) filters.Add($"donation_type=eq.{type}");
        if (string.Equals(recurring, "true", StringComparison.OrdinalIgnoreCase))
            filters.Add("is_recurring=eq.true");
        else if (string.Equals(recurring, "false", StringComparison.OrdinalIgnoreCase))
            filters.Add("is_recurring=eq.false");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var offset = (page - 1) * pageSize;

        var donationsTask = db.GetAllAsync<Donation>("donations",
            $"select=*&{filterStr}order=donation_date.desc&limit={pageSize}&offset={offset}");
        var supportersTask = db.GetAllAsync<Supporter>("supporters",
            "select=supporter_id,display_name,organization_name,supporter_type");

        await Task.WhenAll(donationsTask, supportersTask);
        var donations = await donationsTask;
        var supportersMap = (await supportersTask).ToDictionary(s => s.SupporterId);

        var result = donations.Select(d =>
        {
            supportersMap.TryGetValue(d.SupporterId ?? -1, out var sup);
            return new
            {
                d.DonationId, d.SupporterId, d.DonationType, d.DonationDate,
                d.ChannelSource, d.CurrencyCode, d.Amount, d.EstimatedValue,
                d.ImpactUnit, d.IsRecurring, d.CampaignName, d.Notes,
                supporters = sup != null
                    ? new { sup.DisplayName, sup.OrganizationName, sup.SupporterType }
                    : null
            };
        });

        return Ok(result);
    }

    /// <summary>Sub-path avoids route ambiguity with PATCH/DELETE on the same controller in some hosts.</summary>
    [HttpGet("{id:int}/details")]
    public async Task<IActionResult> GetById(int id)
    {
        var donation = await db.GetOneAsync<Donation>("donations", $"donation_id=eq.{id}&select=*");
        if (donation == null)
            return NotFound();

        Supporter? sup = null;
        if (donation.SupporterId.HasValue)
        {
            sup = await db.GetOneAsync<Supporter>("supporters",
                $"supporter_id=eq.{donation.SupporterId.Value}&select=supporter_id,display_name,organization_name,supporter_type,email");
        }

        // Line items: in_kind_donation_items.donation_id → donations.donation_id (explicit columns match schema)
        var inKindItems = await db.GetAllAsync<InKindDonationItem>("in_kind_donation_items",
            $"donation_id=eq.{id}&select=item_id,donation_id,item_name,item_category,quantity,unit_of_measure,estimated_unit_value,intended_use,received_condition&order=item_id.asc");

        return Ok(new
        {
            donation,
            supporters = sup != null
                ? new { sup.DisplayName, sup.OrganizationName, sup.SupporterType, sup.Email }
                : null,
            inKindItems = inKindItems.Select(i => new
            {
                i.ItemId,
                i.DonationId,
                i.ItemName,
                i.ItemCategory,
                i.Quantity,
                i.UnitOfMeasure,
                i.EstimatedUnitValue,
                i.IntendedUse,
                i.ReceivedCondition
            }).ToList()
        });
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
        var resolvedSupporterId = await ResolveSupporterIdAsync();
        var supporterId = resolvedSupporterId ?? req.SupporterId;
        if (supporterId == null)
            return BadRequest(new { message = "No supporter profile linked to this account. Please sign in again." });

        var result = await db.InsertAsync<Donation>("donations", new
        {
            donation_id = await NextDonationIdAsync(),
            supporter_id = supporterId,
            donation_type = req.DonationType ?? "Monetary",
            donation_date = req.DonationDate ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
            channel_source = req.ChannelSource,
            currency_code = req.CurrencyCode ?? "PHP",
            amount = req.Amount,
            estimated_value = req.EstimatedValue,
            impact_unit = req.ImpactUnit,
            is_recurring = req.IsRecurring ?? false,
            campaign_name = req.CampaignName,
            notes = req.Notes,
            referral_post_id = req.ReferralPostId
        });
        if (result == null)
            return BadRequest(new { message = "Unable to save donation. Please verify donation fields and try again." });
        return Ok(result);
    }

    /// <summary>Replaces all line items for this donation (delete existing rows, then insert).</summary>
    [HttpPut("{donationId:int}/in-kind-items")]
    public async Task<IActionResult> SyncInKindItems(int donationId, [FromBody] List<InKindItemUpsert>? items)
    {
        var donation = await db.GetOneAsync<Donation>("donations", $"donation_id=eq.{donationId}&select=donation_id");
        if (donation == null)
            return NotFound();

        await db.DeleteAsync("in_kind_donation_items", $"donation_id=eq.{donationId}");

        var list = items ?? [];
        var nextId = await NextInKindItemIdAsync();
        foreach (var it in list)
        {
            if (string.IsNullOrWhiteSpace(it.ItemName))
                continue;

            var inserted = await db.InsertAsync<InKindDonationItem>("in_kind_donation_items", new
            {
                item_id = nextId++,
                donation_id = donationId,
                item_name = it.ItemName.Trim(),
                item_category = it.ItemCategory,
                quantity = it.Quantity,
                unit_of_measure = it.UnitOfMeasure,
                estimated_unit_value = it.EstimatedUnitValue,
                intended_use = it.IntendedUse,
                received_condition = it.ReceivedCondition
            });
            if (inserted == null)
                return BadRequest(new { message = "Unable to save one or more in-kind line items." });
        }

        return Ok(new { count = list.Count });
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
            notes = req.Notes,
            referral_post_id = req.ReferralPostId
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("in_kind_donation_items", $"donation_id=eq.{id}");
        await db.DeleteAsync("donations", $"donation_id=eq.{id}");
        return NoContent();
    }
}
