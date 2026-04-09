using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "InternalStaff")]
public class IncidentsController(SupabaseService db) : ControllerBase
{
    private async Task<int> NextIncidentIdAsync()
    {
        var latest = await db.GetAllAsync<IncidentReport>("incident_reports", "select=incident_id&order=incident_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].IncidentId + 1;
    }

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
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] IncidentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Description))
            return BadRequest(new { message = "Description is required." });

        var incidentId = await NextIncidentIdAsync();
        var (result, err) = await db.TryInsertAsync<IncidentReport>("incident_reports", new
        {
            incident_id = incidentId,
            resident_id = req.ResidentId,
            safehouse_id = req.SafehouseId,
            incident_date = req.IncidentDate,
            incident_type = req.IncidentType,
            severity = req.Severity,
            description = req.Description,
            response_taken = req.ResponseTaken,
            reported_by = req.ReportedBy,
            resolved = req.Resolved ?? false,
            follow_up_required = req.FollowUpRequired ?? false,
            resolution_date = req.ResolutionDate
        });
        if (result == null)
            return BadRequest(new { message = err ?? "Unable to create incident." });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] IncidentRequest req)
    {
        var patch = new Dictionary<string, object?>();
        if (req.ResidentId.HasValue) patch["resident_id"] = req.ResidentId.Value;
        if (req.SafehouseId.HasValue) patch["safehouse_id"] = req.SafehouseId.Value;
        if (req.IncidentDate != null) patch["incident_date"] = req.IncidentDate;
        if (req.IncidentType != null) patch["incident_type"] = req.IncidentType;
        if (req.Severity != null) patch["severity"] = req.Severity;
        if (req.Description != null) patch["description"] = req.Description;
        if (req.ResponseTaken != null) patch["response_taken"] = req.ResponseTaken;
        if (req.ReportedBy != null) patch["reported_by"] = req.ReportedBy;
        if (req.Resolved.HasValue) patch["resolved"] = req.Resolved.Value;
        if (req.FollowUpRequired.HasValue) patch["follow_up_required"] = req.FollowUpRequired.Value;
        if (req.ResolutionDate != null) patch["resolution_date"] = req.ResolutionDate;
        if (patch.Count == 0) return BadRequest(new { message = "No fields were provided to update." });

        var result = await db.UpdateAsync<IncidentReport>("incident_reports", $"incident_id=eq.{id}", patch);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id, [FromBody] DeleteRequest req)
    {
        if (req?.Confirm != "DELETE")
            return BadRequest(new { message = "Deletion must be confirmed by providing 'confirm': 'DELETE' in the request body." });

        var deleted = await db.DeleteAsync("incident_reports", $"incident_id=eq.{id}");
        if (!deleted)
            return BadRequest(new { message = "Unable to delete incident." });
        return NoContent();
    }
}
