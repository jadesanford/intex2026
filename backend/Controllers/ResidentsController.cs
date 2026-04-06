using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResidentsController(SupabaseService db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? safehouseId,
        [FromQuery] string? status,
        [FromQuery] string? riskLevel,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filters = new List<string>();
        if (safehouseId.HasValue) filters.Add($"safehouse_id=eq.{safehouseId}");
        if (!string.IsNullOrEmpty(status)) filters.Add($"status=eq.{status}");
        if (!string.IsNullOrEmpty(riskLevel)) filters.Add($"risk_level=eq.{riskLevel}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var offset = (page - 1) * pageSize;
        var query = $"select=*,safehouses(name)&{filterStr}order=created_at.desc&limit={pageSize}&offset={offset}";

        var residents = await db.GetAllAsync<dynamic>("residents", query);
        return Ok(residents);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var resident = await db.GetOneAsync<Resident>("residents",
            $"id=eq.{id}&select=*,safehouses(name,city,region)");
        if (resident == null) return NotFound();
        return Ok(resident);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ResidentRequest req)
    {
        var resident = await db.InsertAsync<Resident>("residents", new
        {
            case_code = req.CaseCode,
            safehouse_id = req.SafehouseId,
            age = req.Age,
            admission_date = req.AdmissionDate,
            status = req.Status ?? "active",
            risk_level = req.RiskLevel,
            case_category = req.CaseCategory,
            referral_source = req.ReferralSource,
            reintegration_progress = req.ReintegrationProgress ?? 0,
            notes = req.Notes,
            nationality = req.Nationality,
            disability_info = req.DisabilityInfo,
            family_background = req.FamilyBackground
        });
        return Ok(resident);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ResidentRequest req)
    {
        var resident = await db.UpdateAsync<Resident>("residents", $"id=eq.{id}", new
        {
            case_code = req.CaseCode,
            safehouse_id = req.SafehouseId,
            age = req.Age,
            admission_date = req.AdmissionDate,
            status = req.Status,
            risk_level = req.RiskLevel,
            case_category = req.CaseCategory,
            referral_source = req.ReferralSource,
            reintegration_progress = req.ReintegrationProgress,
            notes = req.Notes,
            nationality = req.Nationality,
            disability_info = req.DisabilityInfo,
            family_background = req.FamilyBackground
        });
        return Ok(resident);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("residents", $"id=eq.{id}");
        return NoContent();
    }

    // Process Recordings
    [HttpGet("{id}/recordings")]
    public async Task<IActionResult> GetRecordings(int id)
    {
        var recs = await db.GetAllAsync<ProcessRecording>("process_recordings",
            $"resident_id=eq.{id}&select=*&order=session_date.desc");
        return Ok(recs);
    }

    [HttpPost("{id}/recordings")]
    public async Task<IActionResult> AddRecording(int id, [FromBody] ProcessRecordingRequest req)
    {
        var rec = await db.InsertAsync<ProcessRecording>("process_recordings", new
        {
            resident_id = id,
            session_date = req.SessionDate,
            counselor_name = req.CounselorName,
            session_type = req.SessionType,
            emotional_state = req.EmotionalState,
            notes = req.Notes,
            follow_up_actions = req.FollowUpActions,
            interventions = req.Interventions
        });
        return Ok(rec);
    }

    // Visitations
    [HttpGet("{id}/visitations")]
    public async Task<IActionResult> GetVisitations(int id)
    {
        var visits = await db.GetAllAsync<Visitation>("visitations",
            $"resident_id=eq.{id}&select=*&order=visit_date.desc");
        return Ok(visits);
    }

    [HttpPost("{id}/visitations")]
    public async Task<IActionResult> AddVisitation(int id, [FromBody] VisitationRequest req)
    {
        var visit = await db.InsertAsync<Visitation>("visitations", new
        {
            resident_id = id,
            visit_date = req.VisitDate,
            visit_type = req.VisitType,
            visitor_name = req.VisitorName,
            home_environment = req.HomeEnvironment,
            family_cooperation = req.FamilyCooperation,
            safety_concerns = req.SafetyConcerns,
            follow_up_actions = req.FollowUpActions,
            notes = req.Notes
        });
        return Ok(visit);
    }

    // Health Records
    [HttpGet("{id}/health")]
    public async Task<IActionResult> GetHealth(int id)
    {
        var records = await db.GetAllAsync<HealthRecord>("health_records",
            $"resident_id=eq.{id}&select=*&order=check_date.desc");
        return Ok(records);
    }

    [HttpPost("{id}/health")]
    public async Task<IActionResult> AddHealth(int id, [FromBody] HealthRecord req)
    {
        var rec = await db.InsertAsync<HealthRecord>("health_records", new
        {
            resident_id = id,
            check_date = req.CheckDate,
            condition = req.Condition,
            treatment = req.Treatment,
            medical_provider = req.MedicalProvider,
            notes = req.Notes
        });
        return Ok(rec);
    }

    // Education
    [HttpGet("{id}/education")]
    public async Task<IActionResult> GetEducation(int id)
    {
        var records = await db.GetAllAsync<EducationRecord>("education_records",
            $"resident_id=eq.{id}&select=*&order=enrollment_date.desc");
        return Ok(records);
    }

    [HttpPost("{id}/education")]
    public async Task<IActionResult> AddEducation(int id, [FromBody] EducationRecord req)
    {
        var rec = await db.InsertAsync<EducationRecord>("education_records", new
        {
            resident_id = id,
            program_type = req.ProgramType,
            institution_name = req.InstitutionName,
            enrollment_date = req.EnrollmentDate,
            status = req.Status,
            notes = req.Notes
        });
        return Ok(rec);
    }
}
