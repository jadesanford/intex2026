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
        if (!string.IsNullOrEmpty(status)) filters.Add($"case_status=eq.{status}");
        if (!string.IsNullOrEmpty(riskLevel)) filters.Add($"current_risk_level=eq.{riskLevel}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var offset = (page - 1) * pageSize;
        var query = $"select=*,safehouses(name,city)&{filterStr}order=created_at.desc&limit={pageSize}&offset={offset}";

        var residents = await db.GetAllAsync<dynamic>("residents", query);
        return Ok(residents);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var resident = await db.GetOneAsync<Resident>("residents",
            $"resident_id=eq.{id}&select=*,safehouses(name,city,region,province)");
        if (resident == null) return NotFound();
        return Ok(resident);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ResidentRequest req)
    {
        var resident = await db.InsertAsync<Resident>("residents", new
        {
            case_control_no = req.CaseControlNo,
            internal_code = req.InternalCode,
            safehouse_id = req.SafehouseId,
            case_status = req.CaseStatus ?? "Active",
            sex = "F",
            date_of_birth = req.DateOfBirth,
            place_of_birth = req.PlaceOfBirth,
            religion = req.Religion,
            case_category = req.CaseCategory,
            sub_cat_trafficked = req.SubCatTrafficked ?? false,
            sub_cat_sexual_abuse = req.SubCatSexualAbuse ?? false,
            sub_cat_physical_abuse = req.SubCatPhysicalAbuse ?? false,
            sub_cat_osaec = req.SubCatOsaec ?? false,
            sub_cat_child_labor = req.SubCatChildLabor ?? false,
            sub_cat_cicl = req.SubCatCicl ?? false,
            sub_cat_at_risk = req.SubCatAtRisk ?? false,
            is_pwd = req.IsPwd ?? false,
            pwd_type = req.PwdType,
            has_special_needs = req.HasSpecialNeeds ?? false,
            special_needs_diagnosis = req.SpecialNeedsDiagnosis,
            date_of_admission = req.DateOfAdmission,
            referral_source = req.ReferralSource,
            referring_agency_person = req.ReferringAgencyPerson,
            assigned_social_worker = req.AssignedSocialWorker,
            initial_case_assessment = req.InitialCaseAssessment,
            reintegration_type = req.ReintegrationType,
            reintegration_status = req.ReintegrationStatus ?? "Not Started",
            initial_risk_level = req.InitialRiskLevel,
            current_risk_level = req.CurrentRiskLevel,
            notes_restricted = req.NotesRestricted
        });
        return Ok(resident);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ResidentRequest req)
    {
        var resident = await db.UpdateAsync<Resident>("residents", $"resident_id=eq.{id}", new
        {
            case_control_no = req.CaseControlNo,
            internal_code = req.InternalCode,
            safehouse_id = req.SafehouseId,
            case_status = req.CaseStatus,
            date_of_birth = req.DateOfBirth,
            place_of_birth = req.PlaceOfBirth,
            religion = req.Religion,
            case_category = req.CaseCategory,
            sub_cat_trafficked = req.SubCatTrafficked,
            sub_cat_sexual_abuse = req.SubCatSexualAbuse,
            sub_cat_physical_abuse = req.SubCatPhysicalAbuse,
            sub_cat_osaec = req.SubCatOsaec,
            sub_cat_child_labor = req.SubCatChildLabor,
            sub_cat_cicl = req.SubCatCicl,
            sub_cat_at_risk = req.SubCatAtRisk,
            is_pwd = req.IsPwd,
            pwd_type = req.PwdType,
            has_special_needs = req.HasSpecialNeeds,
            special_needs_diagnosis = req.SpecialNeedsDiagnosis,
            date_of_admission = req.DateOfAdmission,
            referral_source = req.ReferralSource,
            referring_agency_person = req.ReferringAgencyPerson,
            assigned_social_worker = req.AssignedSocialWorker,
            initial_case_assessment = req.InitialCaseAssessment,
            reintegration_type = req.ReintegrationType,
            reintegration_status = req.ReintegrationStatus,
            initial_risk_level = req.InitialRiskLevel,
            current_risk_level = req.CurrentRiskLevel,
            notes_restricted = req.NotesRestricted
        });
        return Ok(resident);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("residents", $"resident_id=eq.{id}");
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
            social_worker = req.SocialWorker,
            session_type = req.SessionType,
            session_duration_minutes = req.SessionDurationMinutes,
            emotional_state_observed = req.EmotionalStateObserved,
            emotional_state_end = req.EmotionalStateEnd,
            session_narrative = req.SessionNarrative,
            interventions_applied = req.InterventionsApplied,
            follow_up_actions = req.FollowUpActions,
            progress_noted = req.ProgressNoted ?? false,
            concerns_flagged = req.ConcernsFlagged ?? false,
            referral_made = req.ReferralMade ?? false
        });
        return Ok(rec);
    }

    // Home Visitations
    [HttpGet("{id}/visitations")]
    public async Task<IActionResult> GetVisitations(int id)
    {
        var visits = await db.GetAllAsync<HomeVisitation>("home_visitations",
            $"resident_id=eq.{id}&select=*&order=visit_date.desc");
        return Ok(visits);
    }

    [HttpPost("{id}/visitations")]
    public async Task<IActionResult> AddVisitation(int id, [FromBody] HomeVisitationRequest req)
    {
        var visit = await db.InsertAsync<HomeVisitation>("home_visitations", new
        {
            resident_id = id,
            visit_date = req.VisitDate,
            social_worker = req.SocialWorker,
            visit_type = req.VisitType,
            location_visited = req.LocationVisited,
            family_members_present = req.FamilyMembersPresent,
            purpose = req.Purpose,
            observations = req.Observations,
            family_cooperation_level = req.FamilyCooperationLevel,
            safety_concerns_noted = req.SafetyConcernsNoted ?? false,
            follow_up_needed = req.FollowUpNeeded ?? false,
            follow_up_notes = req.FollowUpNotes,
            visit_outcome = req.VisitOutcome
        });
        return Ok(visit);
    }

    // Health Records
    [HttpGet("{id}/health")]
    public async Task<IActionResult> GetHealth(int id)
    {
        var records = await db.GetAllAsync<HealthWellbeingRecord>("health_wellbeing_records",
            $"resident_id=eq.{id}&select=*&order=record_date.desc");
        return Ok(records);
    }

    // Education
    [HttpGet("{id}/education")]
    public async Task<IActionResult> GetEducation(int id)
    {
        var records = await db.GetAllAsync<EducationRecord>("education_records",
            $"resident_id=eq.{id}&select=*&order=record_date.desc");
        return Ok(records);
    }

    // Intervention Plans
    [HttpGet("{id}/interventions")]
    public async Task<IActionResult> GetInterventions(int id)
    {
        var plans = await db.GetAllAsync<InterventionPlan>("intervention_plans",
            $"resident_id=eq.{id}&select=*&order=created_at.desc");
        return Ok(plans);
    }
}
