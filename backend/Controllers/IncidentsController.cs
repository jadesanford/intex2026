using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncidentsController(SupabaseService db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? severity, [FromQuery] bool? resolved)
    {
        var filters = new List<string>();
        if (!string.IsNullOrEmpty(severity)) filters.Add($"severity=eq.{severity}");
        if (resolved.HasValue) filters.Add($"resolved=eq.{resolved.Value.ToString().ToLower()}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var incidents = await db.GetAllAsync<dynamic>("incidents",
            $"select=*,residents(case_code),safehouses(name)&{filterStr}order=incident_date.desc");
        return Ok(incidents);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var incident = await db.GetOneAsync<Incident>("incidents",
            $"id=eq.{id}&select=*,residents(case_code),safehouses(name)");
        if (incident == null) return NotFound();
        return Ok(incident);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] IncidentRequest req)
    {
        var result = await db.InsertAsync<Incident>("incidents", new
        {
            resident_id = req.ResidentId,
            safehouse_id = req.SafehouseId,
            incident_date = req.IncidentDate,
            incident_type = req.IncidentType,
            severity = req.Severity,
            description = req.Description,
            action_taken = req.ActionTaken,
            reported_by = req.ReportedBy,
            resolved = req.Resolved ?? false
        });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] IncidentRequest req)
    {
        var result = await db.UpdateAsync<Incident>("incidents", $"id=eq.{id}", new
        {
            resident_id = req.ResidentId,
            safehouse_id = req.SafehouseId,
            incident_date = req.IncidentDate,
            incident_type = req.IncidentType,
            severity = req.Severity,
            description = req.Description,
            action_taken = req.ActionTaken,
            reported_by = req.ReportedBy,
            resolved = req.Resolved
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("incidents", $"id=eq.{id}");
        return NoContent();
    }
}
