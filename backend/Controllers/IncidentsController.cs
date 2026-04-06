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
    public async Task<IActionResult> GetAll(
        [FromQuery] string? severity,
        [FromQuery] bool? resolved,
        [FromQuery] string? type,
        [FromQuery] int? safehouseId)
    {
        var filters = new List<string>();
        if (!string.IsNullOrEmpty(severity)) filters.Add($"severity=eq.{severity}");
        if (resolved.HasValue) filters.Add($"resolved=eq.{resolved.Value.ToString().ToLower()}");
        if (!string.IsNullOrEmpty(type)) filters.Add($"incident_type=eq.{type}");
        if (safehouseId.HasValue) filters.Add($"safehouse_id=eq.{safehouseId}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var incidents = await db.GetAllAsync<dynamic>("incident_reports",
            $"select=*,residents(case_control_no,internal_code),safehouses(name,city)&{filterStr}order=incident_date.desc");
        return Ok(incidents);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var incident = await db.GetOneAsync<IncidentReport>("incident_reports",
            $"incident_id=eq.{id}&select=*,residents(case_control_no,internal_code),safehouses(name,city)");
        if (incident == null) return NotFound();
        return Ok(incident);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] IncidentRequest req)
    {
        var result = await db.InsertAsync<IncidentReport>("incident_reports", new
        {
            resident_id = req.ResidentId,
            safehouse_id = req.SafehouseId,
            incident_date = req.IncidentDate,
            incident_type = req.IncidentType,
            severity = req.Severity,
            description = req.Description,
            response_taken = req.ResponseTaken,
            reported_by = req.ReportedBy,
            resolved = req.Resolved ?? false,
            follow_up_required = req.FollowUpRequired ?? false
        });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] IncidentRequest req)
    {
        var result = await db.UpdateAsync<IncidentReport>("incident_reports", $"incident_id=eq.{id}", new
        {
            resident_id = req.ResidentId,
            safehouse_id = req.SafehouseId,
            incident_date = req.IncidentDate,
            incident_type = req.IncidentType,
            severity = req.Severity,
            description = req.Description,
            response_taken = req.ResponseTaken,
            reported_by = req.ReportedBy,
            resolved = req.Resolved,
            follow_up_required = req.FollowUpRequired
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("incident_reports", $"incident_id=eq.{id}");
        return NoContent();
    }
}
