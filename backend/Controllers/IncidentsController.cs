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

        var incidentsTask = db.GetAllAsync<IncidentReport>("incident_reports",
            $"select=*&{filterStr}order=incident_date.desc");
        var residentsTask = db.GetAllAsync<Resident>("residents",
            "select=resident_id,case_control_no,internal_code");
        var safehousesTask = db.GetAllAsync<Safehouse>("safehouses",
            "select=safehouse_id,name,city");

        await Task.WhenAll(incidentsTask, residentsTask, safehousesTask);
        var incidents = await incidentsTask;
        var residentsMap = (await residentsTask).ToDictionary(r => r.ResidentId);
        var safehousesMap = (await safehousesTask).ToDictionary(s => s.SafehouseId);

        var result = incidents.Select(i =>
        {
            residentsMap.TryGetValue(i.ResidentId ?? -1, out var res);
            safehousesMap.TryGetValue(i.SafehouseId ?? -1, out var sh);
            return new
            {
                i.IncidentId, i.ResidentId, i.SafehouseId, i.IncidentDate,
                i.IncidentType, i.Severity, i.Description, i.ResponseTaken,
                i.Resolved, i.ResolutionDate, i.ReportedBy, i.FollowUpRequired,
                residents = res != null ? new { res.CaseControlNo, res.InternalCode } : null,
                safehouses = sh != null ? new { sh.Name, sh.City } : null
            };
        });

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var incidentTask = db.GetOneAsync<IncidentReport>("incident_reports",
            $"incident_id=eq.{id}&select=*");
        var residentsTask = db.GetAllAsync<Resident>("residents",
            "select=resident_id,case_control_no,internal_code");
        var safehousesTask = db.GetAllAsync<Safehouse>("safehouses",
            "select=safehouse_id,name,city");

        await Task.WhenAll(incidentTask, residentsTask, safehousesTask);
        var incident = await incidentTask;
        if (incident == null) return NotFound();

        var residentsMap = (await residentsTask).ToDictionary(r => r.ResidentId);
        var safehousesMap = (await safehousesTask).ToDictionary(s => s.SafehouseId);

        residentsMap.TryGetValue(incident.ResidentId ?? -1, out var res);
        safehousesMap.TryGetValue(incident.SafehouseId ?? -1, out var sh);

        return Ok(new
        {
            incident.IncidentId, incident.ResidentId, incident.SafehouseId, incident.IncidentDate,
            incident.IncidentType, incident.Severity, incident.Description, incident.ResponseTaken,
            incident.Resolved, incident.ResolutionDate, incident.ReportedBy, incident.FollowUpRequired,
            residents = res != null ? new { res.CaseControlNo, res.InternalCode } : null,
            safehouses = sh != null ? new { sh.Name, sh.City } : null
        });
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
