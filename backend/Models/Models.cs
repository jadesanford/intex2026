using System.Text.Json.Serialization;

namespace OpenArms.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string? PasswordHash { get; set; }
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string Role { get; set; } = "staff";
    public bool? IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? SupporterId { get; set; }
}

public class Safehouse
{
    public int SafehouseId { get; set; }
    public string? SafehouseCode { get; set; }
    public string Name { get; set; } = "";
    public string? Region { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? Country { get; set; }
    public string? OpenDate { get; set; }
    public string Status { get; set; } = "Active";
    public int? CapacityGirls { get; set; }
    public int? CapacityStaff { get; set; }
    public int? CurrentOccupancy { get; set; }
    public string? Notes { get; set; }
}

public class Partner
{
    public int PartnerId { get; set; }
    public string PartnerName { get; set; } = "";
    public string? PartnerType { get; set; }
    public string? RoleType { get; set; }
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Region { get; set; }
    public string Status { get; set; } = "Active";
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public string? Notes { get; set; }
}

public class PartnerAssignment
{
    public int AssignmentId { get; set; }
    public int? PartnerId { get; set; }
    public int? SafehouseId { get; set; }
    public string? ProgramArea { get; set; }
    public string? AssignmentStart { get; set; }
    public string? AssignmentEnd { get; set; }
    public string? ResponsibilityNotes { get; set; }
    public bool? IsPrimary { get; set; }
    public string Status { get; set; } = "Active";
}

public class Supporter
{
    public int SupporterId { get; set; }
    public string? SupporterType { get; set; }
    public string? DisplayName { get; set; }
    public string? OrganizationName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? RelationshipType { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = "Active";
    public string? FirstDonationDate { get; set; }
    public string? AcquisitionChannel { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class Donation
{
    public int DonationId { get; set; }
    public int? SupporterId { get; set; }
    public string? DonationType { get; set; }
    public string? DonationDate { get; set; }
    public string? ChannelSource { get; set; }
    public string? CurrencyCode { get; set; }
    public decimal? Amount { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? ImpactUnit { get; set; }
    public bool? IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string? Notes { get; set; }
    public int? CreatedByPartnerId { get; set; }
    public int? ReferralPostId { get; set; }
}

public class InKindDonationItem
{
    public int ItemId { get; set; }
    public int? DonationId { get; set; }
    public string? ItemName { get; set; }
    public string? ItemCategory { get; set; }
    public int? Quantity { get; set; }
    public string? UnitOfMeasure { get; set; }
    public decimal? EstimatedUnitValue { get; set; }
    public string? IntendedUse { get; set; }
    public string? ReceivedCondition { get; set; }
}

public class DonationAllocation
{
    public int AllocationId { get; set; }
    public int? DonationId { get; set; }
    public int? SafehouseId { get; set; }
    public string? ProgramArea { get; set; }
    public decimal? AmountAllocated { get; set; }
    public string? AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }
}

public class Resident
{
    public int ResidentId { get; set; }
    public string? CaseControlNo { get; set; }
    public string? InternalCode { get; set; }
    public int? SafehouseId { get; set; }
    public string CaseStatus { get; set; } = "Active";
    public string? Sex { get; set; }
    public string? DateOfBirth { get; set; }
    public string? BirthStatus { get; set; }
    public string? PlaceOfBirth { get; set; }
    public string? Religion { get; set; }
    public string? CaseCategory { get; set; }
    public bool? SubCatOrphaned { get; set; }
    public bool? SubCatTrafficked { get; set; }
    public bool? SubCatChildLabor { get; set; }
    public bool? SubCatPhysicalAbuse { get; set; }
    public bool? SubCatSexualAbuse { get; set; }
    public bool? SubCatOsaec { get; set; }
    public bool? SubCatCicl { get; set; }
    public bool? SubCatAtRisk { get; set; }
    public bool? SubCatStreetChild { get; set; }
    public bool? SubCatChildWithHiv { get; set; }
    public bool? IsPwd { get; set; }
    public string? PwdType { get; set; }
    public bool? HasSpecialNeeds { get; set; }
    public string? SpecialNeedsDiagnosis { get; set; }
    public bool? FamilyIs4ps { get; set; }
    public bool? FamilySoloParent { get; set; }
    public bool? FamilyIndigenous { get; set; }
    public bool? FamilyParentPwd { get; set; }
    public bool? FamilyInformalSettler { get; set; }
    public string? DateOfAdmission { get; set; }
    public string? AgeUponAdmission { get; set; }
    public string? PresentAge { get; set; }
    public string? LengthOfStay { get; set; }
    public string? ReferralSource { get; set; }
    public string? ReferringAgencyPerson { get; set; }
    public string? DateColbRegistered { get; set; }
    public string? DateColbObtained { get; set; }
    public string? AssignedSocialWorker { get; set; }
    public string? InitialCaseAssessment { get; set; }
    public string? DateCaseStudyPrepared { get; set; }
    public string? ReintegrationType { get; set; }
    public string? ReintegrationStatus { get; set; }
    public string? InitialRiskLevel { get; set; }
    public string? CurrentRiskLevel { get; set; }
    public string? DateEnrolled { get; set; }
    public string? DateClosed { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? NotesRestricted { get; set; }
}

public class ProcessRecording
{
    public int RecordingId { get; set; }
    public int? ResidentId { get; set; }
    public string? SessionDate { get; set; }
    public string? SocialWorker { get; set; }
    public string? SessionType { get; set; }
    public int? SessionDurationMinutes { get; set; }
    public string? EmotionalStateObserved { get; set; }
    public string? EmotionalStateEnd { get; set; }
    public string? SessionNarrative { get; set; }
    public string? InterventionsApplied { get; set; }
    public string? FollowUpActions { get; set; }
    public bool? ProgressNoted { get; set; }
    public bool? ConcernsFlagged { get; set; }
    public bool? ReferralMade { get; set; }
    public string? NotesRestricted { get; set; }
}

public class HomeVisitation
{
    public int VisitationId { get; set; }
    public int? ResidentId { get; set; }
    public string? VisitDate { get; set; }
    public string? SocialWorker { get; set; }
    public string? VisitType { get; set; }
    public string? LocationVisited { get; set; }
    public string? FamilyMembersPresent { get; set; }
    public string? Purpose { get; set; }
    public string? Observations { get; set; }
    public string? FamilyCooperationLevel { get; set; }
    public bool? SafetyConcernsNoted { get; set; }
    public bool? FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string? VisitOutcome { get; set; }
}

/// <summary>Matches Supabase education_records: monthly snapshot per resident (CSV-aligned).</summary>
public class EducationRecord
{
    public int EducationRecordId { get; set; }
    public int? ResidentId { get; set; }
    public string? RecordDate { get; set; }
    public string? SchoolName { get; set; }
    public string? EnrollmentStatus { get; set; }
    public string? EducationLevel { get; set; }
    public decimal? AttendanceRate { get; set; }
    public decimal? ProgressPercent { get; set; }
    public string? CompletionStatus { get; set; }
    public string? Notes { get; set; }
}

public class HealthWellbeingRecord
{
    public int HealthRecordId { get; set; }
    public int? ResidentId { get; set; }
    public string? RecordDate { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? Bmi { get; set; }
    public decimal? NutritionScore { get; set; }
    public decimal? SleepQualityScore { get; set; }
    public decimal? EnergyLevelScore { get; set; }
    public decimal? GeneralHealthScore { get; set; }
    public bool? MedicalCheckupDone { get; set; }
    public bool? DentalCheckupDone { get; set; }
    public bool? PsychologicalCheckupDone { get; set; }
    public string? Notes { get; set; }
}

public class InterventionPlan
{
    public int PlanId { get; set; }
    public int? ResidentId { get; set; }
    public string? PlanCategory { get; set; }
    public string? PlanDescription { get; set; }
    public string? ServicesProvided { get; set; }
    public decimal? TargetValue { get; set; }
    public string? TargetDate { get; set; }
    public string Status { get; set; } = "Open";
    public string? CaseConferenceDate { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class IncidentReport
{
    public int IncidentId { get; set; }
    public int? ResidentId { get; set; }
    public int? SafehouseId { get; set; }
    public string? IncidentDate { get; set; }
    public string? IncidentType { get; set; }
    public string? Severity { get; set; }
    public string? Description { get; set; }
    public string? ResponseTaken { get; set; }
    public bool? Resolved { get; set; }
    public string? ResolutionDate { get; set; }
    public string? ReportedBy { get; set; }
    public bool? FollowUpRequired { get; set; }
}

public class SocialMediaPost
{
    public int PostId { get; set; }
    public string? Platform { get; set; }
    public string? PlatformPostId { get; set; }
    public string? PostUrl { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? DayOfWeek { get; set; }
    public decimal? PostHour { get; set; }
    public string? PostType { get; set; }
    public string? MediaType { get; set; }
    public string? Caption { get; set; }
    public string? Hashtags { get; set; }
    public decimal? NumHashtags { get; set; }
    public decimal? MentionsCount { get; set; }
    public bool? HasCallToAction { get; set; }
    public string? CallToActionType { get; set; }
    public string? ContentTopic { get; set; }
    public string? SentimentTone { get; set; }
    public decimal? CaptionLength { get; set; }
    public bool? FeaturesResidentStory { get; set; }
    public string? CampaignName { get; set; }
    public bool? IsBoosted { get; set; }
    public decimal? BoostBudgetPhp { get; set; }
    public decimal? Impressions { get; set; }
    public decimal? Reach { get; set; }
    public decimal? Likes { get; set; }
    public decimal? Comments { get; set; }
    public decimal? Shares { get; set; }
    public decimal? Saves { get; set; }
    public decimal? ClickThroughs { get; set; }
    public decimal? VideoViews { get; set; }
    public decimal? EngagementRate { get; set; }
    public decimal? ProfileVisits { get; set; }
    public decimal? DonationReferrals { get; set; }
    public decimal? EstimatedDonationValuePhp { get; set; }
    public decimal? FollowerCountAtPost { get; set; }
    public decimal? WatchTimeSeconds { get; set; }
    public decimal? AvgViewDurationSeconds { get; set; }
    public decimal? SubscriberCountAtPost { get; set; }
    public decimal? Forwards { get; set; }
}

public class SafehouseMonthlyMetric
{
    public int MetricId { get; set; }
    public int? SafehouseId { get; set; }
    public string? MonthStart { get; set; }
    public string? MonthEnd { get; set; }
    public int? ActiveResidents { get; set; }
    public decimal? AvgEducationProgress { get; set; }
    public decimal? AvgHealthScore { get; set; }
    public int? ProcessRecordingCount { get; set; }
    public int? HomeVisitationCount { get; set; }
    public int? IncidentCount { get; set; }
    public string? Notes { get; set; }
}

/// <summary>Precomputed ML output table written by Python inference jobs.</summary>
public class DonorChurnPrediction
{
    [JsonPropertyName("supporter_id")] public int SupporterId { get; set; }
    [JsonPropertyName("churn_probability")] public decimal? ChurnProbability { get; set; }
    [JsonPropertyName("churn_prediction")] public int? ChurnPrediction { get; set; }
    [JsonPropertyName("risk_level")] public string? RiskLevel { get; set; }
    [JsonPropertyName("scored_at")] public DateTime? ScoredAt { get; set; }
    [JsonPropertyName("model_version")] public string? ModelVersion { get; set; }
}

public class CaseEscalationPredictionRow
{
    [JsonPropertyName("resident_id")] public int ResidentId { get; set; }
    [JsonPropertyName("incident_probability")] public decimal? IncidentProbability { get; set; }
    [JsonPropertyName("incident_prediction")] public int? IncidentPrediction { get; set; }
    [JsonPropertyName("risk_tier")] public string? RiskTier { get; set; }
    [JsonPropertyName("scored_at")] public DateTime? ScoredAt { get; set; }
    [JsonPropertyName("model_version")] public string? ModelVersion { get; set; }
}

public class ReintegrationPredictionRow
{
    [JsonPropertyName("resident_id")] public int ResidentId { get; set; }
    [JsonPropertyName("success_probability")] public decimal? SuccessProbability { get; set; }
    [JsonPropertyName("success_prediction")] public int? SuccessPrediction { get; set; }
    [JsonPropertyName("scored_at")] public DateTime? ScoredAt { get; set; }
    [JsonPropertyName("model_version")] public string? ModelVersion { get; set; }
}

public class EducationProgressPredictionRow
{
    [JsonPropertyName("education_record_id")] public int EducationRecordId { get; set; }
    [JsonPropertyName("resident_id")] public int ResidentId { get; set; }
    [JsonPropertyName("record_date")] public string? RecordDate { get; set; }
    [JsonPropertyName("predicted_progress")] public decimal? PredictedProgress { get; set; }
    [JsonPropertyName("scored_at")] public DateTime? ScoredAt { get; set; }
    [JsonPropertyName("model_version")] public string? ModelVersion { get; set; }
}

public class HealthAlertPredictionRow
{
    [JsonPropertyName("resident_id")] public int ResidentId { get; set; }
    [JsonPropertyName("deterioration_probability")] public decimal? DeteriorationProbability { get; set; }
    [JsonPropertyName("deterioration_prediction")] public int? DeteriorationPrediction { get; set; }
    [JsonPropertyName("risk_level")] public string? RiskLevel { get; set; }
    [JsonPropertyName("scored_at")] public DateTime? ScoredAt { get; set; }
    [JsonPropertyName("model_version")] public string? ModelVersion { get; set; }
}

public class HomeVisitationPredictionRow
{
    [JsonPropertyName("visitation_id")] public int VisitationId { get; set; }
    [JsonPropertyName("resident_id")] public int ResidentId { get; set; }
    [JsonPropertyName("followup_priority_probability")] public decimal? FollowupPriorityProbability { get; set; }
    [JsonPropertyName("followup_priority_prediction")] public int? FollowupPriorityPrediction { get; set; }
    [JsonPropertyName("priority_tier")] public string? PriorityTier { get; set; }
    [JsonPropertyName("scored_at")] public DateTime? ScoredAt { get; set; }
    [JsonPropertyName("model_version")] public string? ModelVersion { get; set; }
}

public class InterventionPlanPredictionRow
{
    [JsonPropertyName("plan_id")] public int PlanId { get; set; }
    [JsonPropertyName("resident_id")] public int ResidentId { get; set; }
    [JsonPropertyName("completion_risk_probability")] public decimal? CompletionRiskProbability { get; set; }
    [JsonPropertyName("completion_risk_prediction")] public int? CompletionRiskPrediction { get; set; }
    [JsonPropertyName("risk_tier")] public string? RiskTier { get; set; }
    [JsonPropertyName("scored_at")] public DateTime? ScoredAt { get; set; }
    [JsonPropertyName("model_version")] public string? ModelVersion { get; set; }
}

public class SafehouseStrainPredictionRow
{
    [JsonPropertyName("safehouse_id")] public int SafehouseId { get; set; }
    [JsonPropertyName("strain_forecast_value")] public decimal? StrainForecastValue { get; set; }
    [JsonPropertyName("strain_probability")] public decimal? StrainProbability { get; set; }
    [JsonPropertyName("strain_prediction")] public int? StrainPrediction { get; set; }
    [JsonPropertyName("scored_at")] public DateTime? ScoredAt { get; set; }
    [JsonPropertyName("model_version")] public string? ModelVersion { get; set; }
}

public class PublicImpactSnapshot
{
    public int SnapshotId { get; set; }
    public string? SnapshotDate { get; set; }
    public string? Headline { get; set; }
    public string? SummaryText { get; set; }
    public string? MetricPayloadJson { get; set; }
    public bool? IsPublished { get; set; }
    public string? PublishedAt { get; set; }
}

// Auth DTOs
public record LoginRequest(string Username, string Password);
public record RegisterRequest(string Username, string Password, string? DisplayName, string? Email, string Role = "staff");
public record LoginResponse(string Token, string Username, string DisplayName, string Role, int Id, int? SupporterId = null);
public record RegisterDonorRequest(
    string Username,
    string Password,
    string? SupporterType,
    string? DisplayName,
    string? OrganizationName,
    string? FirstName,
    string? LastName,
    string? Email,
    string? Phone,
    string? Region,
    string? Country,
    string? RelationshipType,
    string? AcquisitionChannel,
    string? FirstDonationDate);

// Request DTOs
public record SafehouseRequest(
    string Name, string? SafehouseCode, string? Region, string? City, string? Province,
    string? OpenDate, string? Status, int? CapacityGirls, int? CapacityStaff,
    int? CurrentOccupancy, string? Notes);

public record PartnerRequest(
    string PartnerName, string? PartnerType, string? RoleType, string? ContactName,
    string? Email, string? Phone, string? Region, string? Status,
    string? StartDate, string? EndDate, string? Notes);

public record SupporterRequest(
    string? SupporterType, string? DisplayName, string? OrganizationName,
    string? FirstName, string? LastName, string? RelationshipType,
    string? Region, string? Country, string? Email, string? Phone,
    string? Status, string? AcquisitionChannel, string? FirstDonationDate);

public record DonationRequest(
    int? SupporterId, string? DonationType, string? DonationDate, string? ChannelSource,
    string? CurrencyCode, decimal? Amount, decimal? EstimatedValue, string? ImpactUnit,
    bool? IsRecurring, string? CampaignName, string? Notes, int? CreatedByPartnerId, int? ReferralPostId);

/// <summary>Payload for replacing all in_kind_donation_items rows for a donation.</summary>
public record InKindItemUpsert(
    string ItemName,
    string ItemCategory,
    int Quantity,
    string UnitOfMeasure,
    decimal EstimatedUnitValue,
    string IntendedUse,
    string ReceivedCondition);

public record ResidentRequest(
    string? CaseControlNo, string? InternalCode, int? SafehouseId, string? CaseStatus,
    string? Sex, string? DateOfBirth, string? BirthStatus, string? PlaceOfBirth, string? Religion, string? CaseCategory,
    bool? SubCatOrphaned, bool? SubCatTrafficked, bool? SubCatChildLabor, bool? SubCatPhysicalAbuse, bool? SubCatSexualAbuse,
    bool? SubCatOsaec, bool? SubCatCicl, bool? SubCatAtRisk, bool? SubCatStreetChild, bool? SubCatChildWithHiv,
    bool? IsPwd, string? PwdType, bool? HasSpecialNeeds, string? SpecialNeedsDiagnosis,
    bool? FamilyIs4ps, bool? FamilySoloParent, bool? FamilyIndigenous, bool? FamilyParentPwd, bool? FamilyInformalSettler,
    string? DateOfAdmission, string? AgeUponAdmission, string? PresentAge, string? LengthOfStay,
    string? ReferralSource, string? ReferringAgencyPerson, string? DateColbRegistered, string? DateColbObtained,
    string? AssignedSocialWorker, string? InitialCaseAssessment, string? DateCaseStudyPrepared,
    string? ReintegrationType, string? ReintegrationStatus, string? InitialRiskLevel, string? CurrentRiskLevel,
    string? DateEnrolled, string? DateClosed, string? NotesRestricted);

public record IncidentRequest(
    int? ResidentId, int? SafehouseId, string? IncidentDate, string? IncidentType,
    string? Severity, string? Description, string? ResponseTaken,
    string? ReportedBy, bool? Resolved, bool? FollowUpRequired, string? ResolutionDate);

public record SocialMediaPostRequest(
    string? Platform,
    string? PlatformPostId,
    string? PostUrl,
    string? CreatedAt,
    string? DayOfWeek,
    decimal? PostHour,
    string? PostType,
    string? MediaType,
    string? Caption,
    string? Hashtags,
    decimal? NumHashtags,
    decimal? MentionsCount,
    bool? HasCallToAction,
    string? CallToActionType,
    string? ContentTopic,
    string? SentimentTone,
    decimal? CaptionLength,
    bool? FeaturesResidentStory,
    string? CampaignName,
    bool? IsBoosted,
    decimal? BoostBudgetPhp,
    decimal? Impressions,
    decimal? Reach,
    decimal? Likes,
    decimal? Comments,
    decimal? Shares,
    decimal? Saves,
    decimal? ClickThroughs,
    decimal? VideoViews,
    decimal? EngagementRate,
    decimal? ProfileVisits,
    decimal? DonationReferrals,
    decimal? EstimatedDonationValuePhp,
    decimal? FollowerCountAtPost,
    decimal? WatchTimeSeconds,
    decimal? AvgViewDurationSeconds,
    decimal? SubscriberCountAtPost,
    decimal? Forwards);

public record ProcessRecordingRequest(
    int? ResidentId, string? SessionDate, string? SocialWorker, string? SessionType,
    int? SessionDurationMinutes, string? EmotionalStateObserved, string? EmotionalStateEnd,
    string? SessionNarrative, string? InterventionsApplied, string? FollowUpActions,
    bool? ProgressNoted, bool? ConcernsFlagged, bool? ReferralMade, string? NotesRestricted);

public record HomeVisitationRequest(
    int? ResidentId, string? VisitDate, string? SocialWorker, string? VisitType,
    string? LocationVisited, string? FamilyMembersPresent, string? Purpose,
    string? Observations, string? FamilyCooperationLevel,
    bool? SafetyConcernsNoted, bool? FollowUpNeeded, string? FollowUpNotes, string? VisitOutcome);

public record HealthWellbeingRequest(
    int? ResidentId, string? RecordDate, decimal? WeightKg, decimal? HeightCm, decimal? Bmi,
    decimal? NutritionScore, decimal? SleepScore, decimal? EnergyScore, decimal? GeneralHealthScore,
    bool? MedicalCheckupDone, bool? DentalCheckupDone, bool? PsychologicalCheckupDone, string? MedicalNotesRestricted);

public record EducationRecordRequest(
    int? ResidentId, string? RecordDate, string? SchoolName, string? EnrollmentStatus, string? EducationLevel,
    decimal? AttendanceRate, decimal? ProgressPercent, string? CompletionStatus, string? Notes);

public record InterventionPlanRequest(
    int? ResidentId, string? PlanCategory, string? PlanDescription, string? ServicesProvided,
    decimal? TargetValue, string? TargetDate, string? Status, string? CaseConferenceDate);

public record DeleteRequest(string Confirm);
