using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PartnersController(SupabaseService db) : ControllerBase
{
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
    public async Task<IActionResult> Create([FromBody] PartnerRequest req)
    {
        var result = await db.InsertAsync<Partner>("partners", new
        {
            partner_name = req.PartnerName,
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
        return Ok(result);
    }

    [HttpPatch("{id}")]
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
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("partners", $"partner_id=eq.{id}");
        return NoContent();
    }
}
