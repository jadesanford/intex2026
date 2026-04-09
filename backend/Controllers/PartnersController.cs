using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "InternalStaff")]
public class PartnersController(SupabaseService db) : ControllerBase
{
    private async Task<int> NextPartnerIdAsync()
    {
        var latest = await db.GetAllAsync<Partner>("partners", "select=partner_id&order=partner_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].PartnerId + 1;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? roleType, [FromQuery] string? status)
    {
        var filters = new List<string>();
        if (!string.IsNullOrEmpty(roleType)) filters.Add($"role_type=eq.{roleType}");
        if (!string.IsNullOrEmpty(status)) filters.Add($"status=eq.{status}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var partners = await db.GetAllAsync<Partner>("partners",
            $"select=*&{filterStr}order=partner_name.asc");
        return Ok(partners);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var partnerTask = db.GetOneAsync<Partner>("partners", $"partner_id=eq.{id}&select=*");
        var assignmentsTask = db.GetAllAsync<PartnerAssignment>("partner_assignments",
            $"partner_id=eq.{id}&select=*&order=assignment_start.desc");
        var safehousesTask = db.GetAllAsync<Safehouse>("safehouses",
            "select=safehouse_id,name,city");

        await Task.WhenAll(partnerTask, assignmentsTask, safehousesTask);
        var partner = await partnerTask;
        if (partner == null) return NotFound();

        var safehousesMap = (await safehousesTask).ToDictionary(s => s.SafehouseId);
        var assignments = (await assignmentsTask).Select(a =>
        {
            safehousesMap.TryGetValue(a.SafehouseId ?? -1, out var sh);
            return new
            {
                a.AssignmentId, a.PartnerId, a.SafehouseId, a.ProgramArea,
                a.AssignmentStart, a.AssignmentEnd, a.ResponsibilityNotes, a.IsPrimary, a.Status,
                safehouses = sh != null ? new { sh.Name, sh.City } : null
            };
        });

        return Ok(new { partner, assignments });
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] PartnerRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.PartnerName))
            return BadRequest(new { message = "Partner name is required." });

        var id = await NextPartnerIdAsync();
        var (result, err) = await db.TryInsertAsync<Partner>("partners", new
        {
            partner_id = id,
            partner_name = req.PartnerName.Trim(),
            partner_type = req.PartnerType,
            role_type = req.RoleType,
            contact_name = req.ContactName,
            email = req.Email,
            phone = req.Phone,
            region = req.Region,
            status = req.Status ?? "Active",
            start_date = req.StartDate,
            end_date = req.EndDate,
            notes = req.Notes
        });
        if (result == null)
            return BadRequest(new { message = err ?? "Unable to create partner." });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] PartnerRequest req)
    {
        var result = await db.UpdateAsync<Partner>("partners", $"partner_id=eq.{id}", new
        {
            partner_name = req.PartnerName,
            partner_type = req.PartnerType,
            role_type = req.RoleType,
            contact_name = req.ContactName,
            email = req.Email,
            phone = req.Phone,
            region = req.Region,
            status = req.Status,
            start_date = req.StartDate,
            end_date = req.EndDate,
            notes = req.Notes
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id, [FromBody] DeleteRequest req)
    {
        if (req?.Confirm != "DELETE")
            return BadRequest(new { message = "Deletion must be confirmed by providing 'confirm': 'DELETE' in the request body." });

        await db.DeleteAsync("partner_assignments", $"partner_id=eq.{id}");
        var deleted = await db.DeleteAsync("partners", $"partner_id=eq.{id}");
        if (!deleted)
            return BadRequest(new { message = "Unable to delete partner. It may be linked to other records or blocked by database constraints." });
        return NoContent();
    }
}
