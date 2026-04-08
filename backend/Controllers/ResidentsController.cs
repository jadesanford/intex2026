using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;
using System.Text.Json;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResidentsController(SupabaseService db) : ControllerBase
{
    private static string? CalculateYearsMonths(string? fromDate, string? toDate)
    {
        if (string.IsNullOrWhiteSpace(fromDate) || string.IsNullOrWhiteSpace(toDate))
            return null;
        if (!DateTime.TryParse(fromDate, out var from) || !DateTime.TryParse(toDate, out var to))
            return null;
        if (to < from) return null;

        var years = to.Year - from.Year;
        var months = to.Month - from.Month;
        if (to.Day < from.Day) months -= 1;
        if (months < 0)
        {
            years -= 1;
            months += 12;
        }
        if (years < 0) return null;
        return $"{years} Years {months} months";
    }

    private async Task<int> NextResidentIdAsync()
    {
        var latest = await db.GetAllAsync<Resident>("residents", "select=resident_id&order=resident_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].ResidentId + 1;
    }

    private async Task<int> NextRecordingIdAsync()
    {
        var latest = await db.GetAllAsync<ProcessRecording>("process_recordings", "select=recording_id&order=recording_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].RecordingId + 1;
    }

    private async Task<int> NextPlanIdAsync()
    {
        var latest = await db.GetAllAsync<InterventionPlan>("intervention_plans", "select=plan_id&order=plan_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].PlanId + 1;
    }

    private async Task<int> NextVisitationIdAsync()
    {
        var latest = await db.GetAllAsync<HomeVisitation>("home_visitations", "select=visitation_id&order=visitation_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].VisitationId + 1;
    }

    private async Task<int> NextHealthRecordIdAsync()
    {
        try
        {
            var raw = await db.RawGetAsync("health_wellbeing_records", "select=health_record_id&order=health_record_id.desc&limit=1");
            using var doc = JsonDocument.Parse(raw);
            if (doc.RootElement.ValueKind != JsonValueKind.Array || doc.RootElement.GetArrayLength() == 0)
                return 1;
            var value = doc.RootElement[0].GetProperty("health_record_id");
            if (value.ValueKind == JsonValueKind.Number)
            {
                if (value.TryGetInt64(out var lng))
                    return checked((int)lng + 1);
                if (value.TryGetInt32(out var n))
                    return n + 1;
            }
            if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), out var s))
                return s + 1;
            return 1;
        }
        catch
        {
            return 1;
        }
    }

    private async Task<int> NextEducationRecordIdAsync()
    {
        try
        {
            var raw = await db.RawGetAsync("education_records", "select=education_record_id&order=education_record_id.desc&limit=1");
            using var doc = JsonDocument.Parse(raw);
            if (doc.RootElement.ValueKind != JsonValueKind.Array || doc.RootElement.GetArrayLength() == 0)
                return 1;
            var value = doc.RootElement[0].GetProperty("education_record_id");
            if (value.ValueKind == JsonValueKind.Number)
            {
                if (value.TryGetInt64(out var lng))
                    return checked((int)lng + 1);
                if (value.TryGetInt32(out var n))
                    return n + 1;
            }
            if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), out var s))
                return s + 1;
            return 1;
        }
        catch
        {
            return 1;
        }
    }

    private static object EducationInsertPayload(int residentId, EducationRecordRequest req, bool includeEducationRecordId, int? educationRecordId)
    {
        var row = new
        {
            resident_id = residentId,
            record_date = req.RecordDate,
            school_name = req.SchoolName,
            enrollment_status = req.EnrollmentStatus,
            education_level = req.EducationLevel,
            attendance_rate = req.AttendanceRate,
            progress_percent = req.ProgressPercent,
            completion_status = req.CompletionStatus,
            notes = req.Notes
        };
        if (!includeEducationRecordId || !educationRecordId.HasValue)
            return row;
        return new
        {
            education_record_id = educationRecordId.Value,
            resident_id = residentId,
            record_date = req.RecordDate,
            school_name = req.SchoolName,
            enrollment_status = req.EnrollmentStatus,
            education_level = req.EducationLevel,
            attendance_rate = req.AttendanceRate,
            progress_percent = req.ProgressPercent,
            completion_status = req.CompletionStatus,
            notes = req.Notes
        };
    }

    /// <summary>Matches Supabase table: sleep_quality_score, energy_level_score, notes.</summary>
    private static object HealthWellbeingInsertPayload(int residentId, HealthWellbeingRequest req, bool includeHealthRecordId, int? healthRecordId)
    {
        var row = new
        {
            resident_id = residentId,
            record_date = req.RecordDate,
            general_health_score = req.GeneralHealthScore,
            nutrition_score = req.NutritionScore,
            sleep_quality_score = req.SleepScore,
            energy_level_score = req.EnergyScore,
            height_cm = req.HeightCm,
            weight_kg = req.WeightKg,
            bmi = req.Bmi,
            medical_checkup_done = req.MedicalCheckupDone ?? false,
            dental_checkup_done = req.DentalCheckupDone ?? false,
            psychological_checkup_done = req.PsychologicalCheckupDone ?? false,
            notes = req.MedicalNotesRestricted
        };
        if (!includeHealthRecordId || !healthRecordId.HasValue)
            return row;
        return new
        {
            health_record_id = healthRecordId.Value,
            resident_id = residentId,
            record_date = req.RecordDate,
            general_health_score = req.GeneralHealthScore,
            nutrition_score = req.NutritionScore,
            sleep_quality_score = req.SleepScore,
            energy_level_score = req.EnergyScore,
            height_cm = req.HeightCm,
            weight_kg = req.WeightKg,
            bmi = req.Bmi,
            medical_checkup_done = req.MedicalCheckupDone ?? false,
            dental_checkup_done = req.DentalCheckupDone ?? false,
            psychological_checkup_done = req.PsychologicalCheckupDone ?? false,
            notes = req.MedicalNotesRestricted
        };
    }

    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? safehouseId,
        [FromQuery] string? status,
        [FromQuery] string? riskLevel,
        [FromQuery] string? caseCategory,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filters = new List<string>();
        if (safehouseId.HasValue) filters.Add($"safehouse_id=eq.{safehouseId}");
        if (!string.IsNullOrEmpty(status)) filters.Add($"case_status=eq.{status}");
        if (!string.IsNullOrEmpty(riskLevel)) filters.Add($"current_risk_level=eq.{riskLevel}");
        if (!string.IsNullOrEmpty(caseCategory)) filters.Add($"case_category=eq.{caseCategory}");

        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var offset = (page - 1) * pageSize;

        var residentsTask = db.GetAllAsync<Resident>("residents",
            $"select=*&{filterStr}order=created_at.desc&limit={pageSize}&offset={offset}");
        var safehousesTask = db.GetAllAsync<Safehouse>("safehouses", "select=safehouse_id,name,city");

        await Task.WhenAll(residentsTask, safehousesTask);
        var residents = await residentsTask;
        var safehouses = (await safehousesTask).ToDictionary(s => s.SafehouseId);

        var result = residents.Select(r => new
        {
            r.ResidentId, r.CaseControlNo, r.InternalCode, r.SafehouseId,
            r.CaseStatus, r.Sex, r.DateOfBirth, r.PresentAge, r.CaseCategory,
            r.CurrentRiskLevel, r.ReintegrationStatus, r.AssignedSocialWorker,
            r.DateOfAdmission, r.CreatedAt, r.SubCatTrafficked, r.SubCatSexualAbuse,
            r.SubCatPhysicalAbuse, r.SubCatOsaec,
            safehouses = r.SafehouseId.HasValue && safehouses.TryGetValue(r.SafehouseId.Value, out var sh)
                ? new { sh.Name, sh.City } : null
        });

        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetById(int id)
    {
        var residentTask = db.GetOneAsync<Resident>("residents", $"resident_id=eq.{id}&select=*");
        var safehousesTask = db.GetAllAsync<Safehouse>("safehouses", "select=safehouse_id,name,city,region,province");

        await Task.WhenAll(residentTask, safehousesTask);
        var resident = await residentTask;
        if (resident == null) return NotFound();

        var safehouses = (await safehousesTask).ToDictionary(s => s.SafehouseId);
        var sh = resident.SafehouseId.HasValue && safehouses.TryGetValue(resident.SafehouseId.Value, out var found) ? found : null;

        return Ok(new
        {
            resident.ResidentId, resident.CaseControlNo, resident.InternalCode, resident.SafehouseId,
            resident.CaseStatus, resident.Sex, resident.DateOfBirth, resident.BirthStatus,
            resident.PlaceOfBirth, resident.Religion, resident.CaseCategory,
            resident.SubCatOrphaned, resident.SubCatTrafficked, resident.SubCatChildLabor,
            resident.SubCatPhysicalAbuse, resident.SubCatSexualAbuse, resident.SubCatOsaec,
            resident.SubCatCicl, resident.SubCatAtRisk, resident.SubCatStreetChild,
            resident.IsPwd, resident.PwdType, resident.HasSpecialNeeds, resident.SpecialNeedsDiagnosis,
            resident.FamilyIs4ps, resident.FamilySoloParent, resident.FamilyIndigenous,
            resident.FamilyParentPwd, resident.FamilyInformalSettler,
            resident.DateOfAdmission, resident.AgeUponAdmission, resident.PresentAge, resident.LengthOfStay,
            resident.ReferralSource, resident.ReferringAgencyPerson,
            resident.AssignedSocialWorker, resident.InitialCaseAssessment,
            resident.ReintegrationType, resident.ReintegrationStatus,
            resident.InitialRiskLevel, resident.CurrentRiskLevel,
            resident.DateEnrolled, resident.DateClosed, resident.CreatedAt, resident.NotesRestricted,
            safehouses = sh != null ? new { sh.Name, sh.City, sh.Region, sh.Province } : null
        });
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] ResidentRequest req)
    {
        var residentId = await NextResidentIdAsync();
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var ageUponAdmission = CalculateYearsMonths(req.DateOfBirth, req.DateOfAdmission);
        var presentAge = CalculateYearsMonths(req.DateOfBirth, today);
        var stayUntil = string.IsNullOrWhiteSpace(req.DateClosed) ? today : req.DateClosed;
        var lengthOfStay = CalculateYearsMonths(req.DateOfAdmission, stayUntil);

        var resident = await db.InsertAsync<Resident>("residents", new
        {
            resident_id = residentId,
            case_control_no = req.CaseControlNo,
            internal_code = $"LS-{residentId:0000}",
            safehouse_id = req.SafehouseId,
            case_status = req.CaseStatus ?? "Active",
            sex = req.Sex ?? "F",
            date_of_birth = req.DateOfBirth,
            birth_status = req.BirthStatus,
            place_of_birth = req.PlaceOfBirth,
            religion = req.Religion,
            case_category = req.CaseCategory,
            sub_cat_orphaned = req.SubCatOrphaned ?? false,
            sub_cat_trafficked = req.SubCatTrafficked ?? false,
            sub_cat_child_labor = req.SubCatChildLabor ?? false,
            sub_cat_physical_abuse = req.SubCatPhysicalAbuse ?? false,
            sub_cat_sexual_abuse = req.SubCatSexualAbuse ?? false,
            sub_cat_osaec = req.SubCatOsaec ?? false,
            sub_cat_cicl = req.SubCatCicl ?? false,
            sub_cat_at_risk = req.SubCatAtRisk ?? false,
            sub_cat_street_child = req.SubCatStreetChild ?? false,
            sub_cat_child_with_hiv = req.SubCatChildWithHiv ?? false,
            is_pwd = req.IsPwd ?? false,
            pwd_type = req.PwdType,
            has_special_needs = req.HasSpecialNeeds ?? false,
            special_needs_diagnosis = req.SpecialNeedsDiagnosis,
            family_is_4ps = req.FamilyIs4ps ?? false,
            family_solo_parent = req.FamilySoloParent ?? false,
            family_indigenous = req.FamilyIndigenous ?? false,
            family_parent_pwd = req.FamilyParentPwd ?? false,
            family_informal_settler = req.FamilyInformalSettler ?? false,
            date_of_admission = req.DateOfAdmission,
            age_upon_admission = ageUponAdmission,
            present_age = presentAge,
            length_of_stay = lengthOfStay,
            referral_source = req.ReferralSource,
            referring_agency_person = req.ReferringAgencyPerson,
            date_colb_registered = req.DateColbRegistered,
            date_colb_obtained = req.DateColbObtained,
            assigned_social_worker = req.AssignedSocialWorker,
            initial_case_assessment = req.InitialCaseAssessment,
            date_case_study_prepared = req.DateCaseStudyPrepared,
            reintegration_type = req.ReintegrationType,
            reintegration_status = req.ReintegrationStatus ?? "Not Started",
            initial_risk_level = req.InitialRiskLevel,
            current_risk_level = req.CurrentRiskLevel,
            date_enrolled = req.DateEnrolled,
            date_closed = req.DateClosed,
            notes_restricted = req.NotesRestricted
        });
        if (resident == null)
            return BadRequest(new { message = "Unable to create resident record. Please verify required fields and uniqueness." });
        return Ok(resident);
    }

    [HttpPatch("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] ResidentRequest req)
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var ageUponAdmission = CalculateYearsMonths(req.DateOfBirth, req.DateOfAdmission);
        var presentAge = CalculateYearsMonths(req.DateOfBirth, today);
        var stayUntil = string.IsNullOrWhiteSpace(req.DateClosed) ? today : req.DateClosed;
        var lengthOfStay = CalculateYearsMonths(req.DateOfAdmission, stayUntil);

        var resident = await db.UpdateAsync<Resident>("residents", $"resident_id=eq.{id}", new
        {
            case_control_no = req.CaseControlNo,
            safehouse_id = req.SafehouseId,
            case_status = req.CaseStatus,
            sex = req.Sex,
            date_of_birth = req.DateOfBirth,
            birth_status = req.BirthStatus,
            place_of_birth = req.PlaceOfBirth,
            religion = req.Religion,
            case_category = req.CaseCategory,
            sub_cat_orphaned = req.SubCatOrphaned,
            sub_cat_trafficked = req.SubCatTrafficked,
            sub_cat_child_labor = req.SubCatChildLabor,
            sub_cat_physical_abuse = req.SubCatPhysicalAbuse,
            sub_cat_sexual_abuse = req.SubCatSexualAbuse,
            sub_cat_osaec = req.SubCatOsaec,
            sub_cat_cicl = req.SubCatCicl,
            sub_cat_at_risk = req.SubCatAtRisk,
            sub_cat_street_child = req.SubCatStreetChild,
            sub_cat_child_with_hiv = req.SubCatChildWithHiv,
            is_pwd = req.IsPwd,
            pwd_type = req.PwdType,
            has_special_needs = req.HasSpecialNeeds,
            special_needs_diagnosis = req.SpecialNeedsDiagnosis,
            family_is_4ps = req.FamilyIs4ps,
            family_solo_parent = req.FamilySoloParent,
            family_indigenous = req.FamilyIndigenous,
            family_parent_pwd = req.FamilyParentPwd,
            family_informal_settler = req.FamilyInformalSettler,
            date_of_admission = req.DateOfAdmission,
            age_upon_admission = ageUponAdmission,
            present_age = presentAge,
            length_of_stay = lengthOfStay,
            referral_source = req.ReferralSource,
            referring_agency_person = req.ReferringAgencyPerson,
            date_colb_registered = req.DateColbRegistered,
            date_colb_obtained = req.DateColbObtained,
            assigned_social_worker = req.AssignedSocialWorker,
            initial_case_assessment = req.InitialCaseAssessment,
            date_case_study_prepared = req.DateCaseStudyPrepared,
            reintegration_type = req.ReintegrationType,
            reintegration_status = req.ReintegrationStatus,
            initial_risk_level = req.InitialRiskLevel,
            current_risk_level = req.CurrentRiskLevel,
            date_enrolled = req.DateEnrolled,
            date_closed = req.DateClosed,
            notes_restricted = req.NotesRestricted
        });
        if (resident == null)
            return BadRequest(new { message = "Unable to update resident record." });
        return Ok(resident);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id, [FromBody] DeleteRequest req)
    {
        if (req?.Confirm != "DELETE")
            return BadRequest(new { message = "Deletion must be confirmed by providing 'confirm': 'DELETE' in the request body." });

        // Delete child records first to avoid FK violations and orphaned data.
        var childDeletes = new[]
        {
            ("process_recordings", $"resident_id=eq.{id}"),
            ("home_visitations", $"resident_id=eq.{id}"),
            ("education_records", $"resident_id=eq.{id}"),
            ("health_wellbeing_records", $"resident_id=eq.{id}"),
            ("intervention_plans", $"resident_id=eq.{id}"),
            ("incident_reports", $"resident_id=eq.{id}")
        };

        foreach (var (table, filter) in childDeletes)
        {
            var childDeleted = await db.DeleteAsync(table, filter);
            if (!childDeleted)
                return BadRequest(new { message = $"Unable to delete related records from {table}." });
        }

        var deleted = await db.DeleteAsync("residents", $"resident_id=eq.{id}");
        if (!deleted)
            return BadRequest(new { message = "Unable to delete resident record." });

        return NoContent();
    }

    // Process Recordings
    [HttpGet("{id}/recordings")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetRecordings(int id)
    {
        var recs = await db.GetAllAsync<ProcessRecording>("process_recordings",
            $"resident_id=eq.{id}&select=*&order=session_date.desc");
        return Ok(recs);
    }

    [HttpPost("{id}/recordings")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddRecording(int id, [FromBody] ProcessRecordingRequest req)
    {
        var rec = await db.InsertAsync<ProcessRecording>("process_recordings", new
        {
            recording_id = await NextRecordingIdAsync(),
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
            referral_made = req.ReferralMade ?? false,
            notes_restricted = req.NotesRestricted
        });
        if (rec == null)
            return BadRequest(new { message = "Unable to add process recording." });
        return Ok(rec);
    }

    [HttpPatch("{id}/recordings/{recordingId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateRecording(int id, int recordingId, [FromBody] ProcessRecordingRequest req)
    {
        var rec = await db.UpdateAsync<ProcessRecording>(
            "process_recordings",
            $"resident_id=eq.{id}&recording_id=eq.{recordingId}",
            new
            {
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
                referral_made = req.ReferralMade ?? false,
                notes_restricted = req.NotesRestricted
            });
        if (rec == null)
            return BadRequest(new { message = "Unable to update process recording." });
        return Ok(rec);
    }

    [HttpDelete("{id}/recordings/{recordingId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteRecording(int id, int recordingId, [FromBody] DeleteRequest req)
    {
        if (req?.Confirm != "DELETE")
            return BadRequest(new { message = "Deletion must be confirmed by providing 'confirm': 'DELETE' in the request body." });

        var deleted = await db.DeleteAsync("process_recordings", $"resident_id=eq.{id}&recording_id=eq.{recordingId}");
        if (!deleted)
            return BadRequest(new { message = "Unable to delete process recording." });
        return NoContent();
    }

    // Home Visitations
    [HttpGet("{id}/visitations")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetVisitations(int id)
    {
        var visits = await db.GetAllAsync<HomeVisitation>("home_visitations",
            $"resident_id=eq.{id}&select=*&order=visit_date.desc");
        return Ok(visits);
    }

    [HttpPost("{id}/visitations")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddVisitation(int id, [FromBody] HomeVisitationRequest req)
    {
        var visit = await db.InsertAsync<HomeVisitation>("home_visitations", new
        {
            visitation_id = await NextVisitationIdAsync(),
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
        if (visit == null)
            return BadRequest(new { message = "Unable to add home visitation." });
        return Ok(visit);
    }

    [HttpPatch("{id}/visitations/{visitationId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateVisitation(int id, int visitationId, [FromBody] HomeVisitationRequest req)
    {
        var visit = await db.UpdateAsync<HomeVisitation>(
            "home_visitations",
            $"resident_id=eq.{id}&visitation_id=eq.{visitationId}",
            new
            {
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
        if (visit == null)
            return BadRequest(new { message = "Unable to update home visitation." });
        return Ok(visit);
    }

    [HttpDelete("{id}/visitations/{visitationId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteVisitation(int id, int visitationId, [FromBody] DeleteRequest req)
    {
        if (req?.Confirm != "DELETE")
            return BadRequest(new { message = "Deletion must be confirmed by providing 'confirm': 'DELETE' in the request body." });

        var deleted = await db.DeleteAsync("home_visitations", $"resident_id=eq.{id}&visitation_id=eq.{visitationId}");
        if (!deleted)
            return BadRequest(new { message = "Unable to delete home visitation." });
        return NoContent();
    }

    // Health Records
    [HttpGet("{id}/health")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetHealth(int id)
    {
        var records = await db.GetAllAsync<HealthWellbeingRecord>("health_wellbeing_records",
            $"resident_id=eq.{id}&select=*&order=record_date.desc");
        return Ok(records);
    }

    [HttpPost("{id}/health")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddHealth(int id, [FromBody] HealthWellbeingRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.RecordDate))
            return BadRequest(new { message = "Record date is required." });

        var nextId = await NextHealthRecordIdAsync();

        var (r0, e0) = await db.TryInsertAsync<HealthWellbeingRecord>(
            "health_wellbeing_records", HealthWellbeingInsertPayload(id, req, includeHealthRecordId: false, healthRecordId: null));
        if (r0 != null) return Ok(r0);

        var (r1, e1) = await db.TryInsertAsync<HealthWellbeingRecord>(
            "health_wellbeing_records", HealthWellbeingInsertPayload(id, req, includeHealthRecordId: true, healthRecordId: nextId));
        if (r1 != null) return Ok(r1);

        var detail = $"no_pk: {e0} | explicit_pk: {e1}";
        return BadRequest(new
        {
            message = "Unable to add health record. Details from Supabase follow.",
            detail
        });
    }

    [HttpPatch("{id}/health/{healthRecordId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateHealth(int id, int healthRecordId, [FromBody] HealthWellbeingRequest req)
    {
        var record = await db.UpdateAsync<HealthWellbeingRecord>(
            "health_wellbeing_records",
            $"resident_id=eq.{id}&health_record_id=eq.{healthRecordId}",
            new
            {
                record_date = req.RecordDate,
                general_health_score = req.GeneralHealthScore,
                nutrition_score = req.NutritionScore,
                sleep_quality_score = req.SleepScore,
                energy_level_score = req.EnergyScore,
                height_cm = req.HeightCm,
                weight_kg = req.WeightKg,
                bmi = req.Bmi,
                medical_checkup_done = req.MedicalCheckupDone ?? false,
                dental_checkup_done = req.DentalCheckupDone ?? false,
                psychological_checkup_done = req.PsychologicalCheckupDone ?? false,
                notes = req.MedicalNotesRestricted
            });
        if (record == null)
            return BadRequest(new { message = "Unable to update health record." });
        return Ok(record);
    }

    [HttpDelete("{id}/health/{healthRecordId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteHealth(int id, int healthRecordId, [FromBody] DeleteRequest req)
    {
        if (req?.Confirm != "DELETE")
            return BadRequest(new { message = "Deletion must be confirmed by providing 'confirm': 'DELETE' in the request body." });

        var deleted = await db.DeleteAsync("health_wellbeing_records", $"resident_id=eq.{id}&health_record_id=eq.{healthRecordId}");
        if (!deleted)
            return BadRequest(new { message = "Unable to delete health record." });
        return NoContent();
    }

    // Education
    [HttpGet("{id}/education")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetEducation(int id)
    {
        var records = await db.GetAllAsync<EducationRecord>("education_records",
            $"resident_id=eq.{id}&select=*&order=record_date.desc");
        return Ok(records);
    }

    [HttpPost("{id}/education")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddEducation(int id, [FromBody] EducationRecordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.RecordDate))
            return BadRequest(new { message = "Record date is required." });

        var nextId = await NextEducationRecordIdAsync();

        var (r0, e0) = await db.TryInsertAsync<EducationRecord>(
            "education_records", EducationInsertPayload(id, req, includeEducationRecordId: false, educationRecordId: null));
        if (r0 != null) return Ok(r0);

        var (r1, e1) = await db.TryInsertAsync<EducationRecord>(
            "education_records", EducationInsertPayload(id, req, includeEducationRecordId: true, educationRecordId: nextId));
        if (r1 != null) return Ok(r1);

        var detail = $"no_pk: {e0} | explicit_pk: {e1}";
        return BadRequest(new
        {
            message = "Unable to add education record. Details from Supabase follow.",
            detail
        });
    }

    [HttpPatch("{id}/education/{educationRecordId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateEducation(int id, int educationRecordId, [FromBody] EducationRecordRequest req)
    {
        var record = await db.UpdateAsync<EducationRecord>(
            "education_records",
            $"resident_id=eq.{id}&education_record_id=eq.{educationRecordId}",
            new
            {
                record_date = req.RecordDate,
                school_name = req.SchoolName,
                enrollment_status = req.EnrollmentStatus,
                education_level = req.EducationLevel,
                attendance_rate = req.AttendanceRate,
                progress_percent = req.ProgressPercent,
                completion_status = req.CompletionStatus,
                notes = req.Notes
            });
        if (record == null)
            return BadRequest(new { message = "Unable to update education record." });
        return Ok(record);
    }

    [HttpDelete("{id}/education/{educationRecordId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteEducation(int id, int educationRecordId, [FromBody] DeleteRequest req)
    {
        if (req?.Confirm != "DELETE")
            return BadRequest(new { message = "Deletion must be confirmed by providing 'confirm': 'DELETE' in the request body." });

        var deleted = await db.DeleteAsync("education_records", $"resident_id=eq.{id}&education_record_id=eq.{educationRecordId}");
        if (!deleted)
            return BadRequest(new { message = "Unable to delete education record." });
        return NoContent();
    }

    // Intervention Plans
    [HttpGet("{id}/interventions")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetInterventions(int id)
    {
        var plans = await db.GetAllAsync<InterventionPlan>("intervention_plans",
            $"resident_id=eq.{id}&select=*&order=created_at.desc");
        return Ok(plans);
    }

    [HttpPost("{id}/interventions")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddIntervention(int id, [FromBody] InterventionPlanRequest req)
    {
        var plan = await db.InsertAsync<InterventionPlan>("intervention_plans", new
        {
            plan_id = await NextPlanIdAsync(),
            resident_id = id,
            plan_category = req.PlanCategory,
            plan_description = req.PlanDescription,
            services_provided = req.ServicesProvided,
            target_value = req.TargetValue,
            target_date = req.TargetDate,
            status = string.IsNullOrWhiteSpace(req.Status) ? "Open" : req.Status,
            case_conference_date = req.CaseConferenceDate
        });
        if (plan == null)
            return BadRequest(new { message = "Unable to add intervention plan." });
        return Ok(plan);
    }

    [HttpPatch("{id}/interventions/{planId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateIntervention(int id, int planId, [FromBody] InterventionPlanRequest req)
    {
        var plan = await db.UpdateAsync<InterventionPlan>(
            "intervention_plans",
            $"resident_id=eq.{id}&plan_id=eq.{planId}",
            new
            {
                plan_category = req.PlanCategory,
                plan_description = req.PlanDescription,
                services_provided = req.ServicesProvided,
                target_value = req.TargetValue,
                target_date = req.TargetDate,
                status = string.IsNullOrWhiteSpace(req.Status) ? "Open" : req.Status,
                case_conference_date = req.CaseConferenceDate
            });
        if (plan == null)
            return BadRequest(new { message = "Unable to update intervention plan." });
        return Ok(plan);
    }

    [HttpDelete("{id}/interventions/{planId}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteIntervention(int id, int planId)
    {
        var deleted = await db.DeleteAsync("intervention_plans", $"resident_id=eq.{id}&plan_id=eq.{planId}");
        if (!deleted)
            return BadRequest(new { message = "Unable to delete intervention plan." });
        return NoContent();
    }
}
