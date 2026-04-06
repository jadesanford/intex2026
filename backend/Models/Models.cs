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
    public DateTime? CreatedAt { get; set; }
}

public class Safehouse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Region { get; set; }
    public string? City { get; set; }
    public int? Capacity { get; set; }
    public string Status { get; set; } = "active";
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class Resident
{
    public int Id { get; set; }
    public string CaseCode { get; set; } = "";
    public int? SafehouseId { get; set; }
    public int? Age { get; set; }
    public string? AdmissionDate { get; set; }
    public string Status { get; set; } = "active";
    public string? RiskLevel { get; set; }
    public string? CaseCategory { get; set; }
    public string? ReferralSource { get; set; }
    public int? ReintegrationProgress { get; set; }
    public string? Notes { get; set; }
    public string? Nationality { get; set; }
    public string? DisabilityInfo { get; set; }
    public string? FamilyBackground { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class ProcessRecording
{
    public int Id { get; set; }
    public int? ResidentId { get; set; }
    public string? SessionDate { get; set; }
    public string? CounselorName { get; set; }
    public string? SessionType { get; set; }
    public string? EmotionalState { get; set; }
    public string? Notes { get; set; }
    public string? FollowUpActions { get; set; }
    public string? Interventions { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class Visitation
{
    public int Id { get; set; }
    public int? ResidentId { get; set; }
    public string? VisitDate { get; set; }
    public string? VisitType { get; set; }
    public string? VisitorName { get; set; }
    public string? HomeEnvironment { get; set; }
    public string? FamilyCooperation { get; set; }
    public string? SafetyConcerns { get; set; }
    public string? FollowUpActions { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class HealthRecord
{
    public int Id { get; set; }
    public int? ResidentId { get; set; }
    public string? CheckDate { get; set; }
    public string? Condition { get; set; }
    public string? Treatment { get; set; }
    public string? MedicalProvider { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class EducationRecord
{
    public int Id { get; set; }
    public int? ResidentId { get; set; }
    public string? ProgramType { get; set; }
    public string? InstitutionName { get; set; }
    public string? EnrollmentDate { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class Intervention
{
    public int Id { get; set; }
    public int? ResidentId { get; set; }
    public string? InterventionType { get; set; }
    public string? InterventionDate { get; set; }
    public string? Provider { get; set; }
    public string? Outcome { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class Supporter
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Type { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public bool? IsRecurring { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "active";
    public DateTime? CreatedAt { get; set; }
    public DateTime? LastDonationDate { get; set; }
}

public class Donation
{
    public int Id { get; set; }
    public int? SupporterId { get; set; }
    public decimal? Amount { get; set; }
    public string? Currency { get; set; }
    public string? DonationType { get; set; }
    public string? Campaign { get; set; }
    public string? Channel { get; set; }
    public string? DonatedAt { get; set; }
    public bool? ReceiptIssued { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class Partner
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Type { get; set; }
    public string? Country { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactEmail { get; set; }
    public string? Website { get; set; }
    public bool? ActiveStatus { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class Incident
{
    public int Id { get; set; }
    public int? ResidentId { get; set; }
    public int? SafehouseId { get; set; }
    public string? IncidentDate { get; set; }
    public string? IncidentType { get; set; }
    public string? Severity { get; set; }
    public string? Description { get; set; }
    public string? ActionTaken { get; set; }
    public string? ReportedBy { get; set; }
    public bool? Resolved { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class SocialMediaPost
{
    public int Id { get; set; }
    public string? Platform { get; set; }
    public string? PostDate { get; set; }
    public string? ContentType { get; set; }
    public string? Caption { get; set; }
    public int? Reach { get; set; }
    public int? Likes { get; set; }
    public int? Shares { get; set; }
    public int? DonationsLinked { get; set; }
    public decimal? DonationAmountLinked { get; set; }
    public string? CampaignTag { get; set; }
    public DateTime? CreatedAt { get; set; }
}

// DTOs
public record LoginRequest(string Username, string Password);
public record RegisterRequest(string Username, string Password, string? DisplayName, string? Email, string Role = "staff");
public record LoginResponse(string Token, string Username, string DisplayName, string Role, int Id);

public record SafehouseRequest(string Name, string? Region, string? City, int? Capacity,
    string? Status, double? Latitude, double? Longitude, string? ContactPerson, string? ContactPhone);

public record ResidentRequest(string CaseCode, int? SafehouseId, int? Age, string? AdmissionDate,
    string? Status, string? RiskLevel, string? CaseCategory, string? ReferralSource,
    int? ReintegrationProgress, string? Notes, string? Nationality, string? DisabilityInfo, string? FamilyBackground);

public record SupporterRequest(string Name, string? Email, string? Phone, string? Type,
    string? Country, string? City, bool? IsRecurring, string? Notes, string? Status);

public record DonationRequest(int? SupporterId, decimal? Amount, string? Currency,
    string? DonationType, string? Campaign, string? Channel, string? DonatedAt,
    bool? ReceiptIssued, string? Notes);

public record PartnerRequest(string Name, string? Type, string? Country, string? ContactPerson,
    string? ContactEmail, string? Website, bool? ActiveStatus, string? Notes);

public record IncidentRequest(int? ResidentId, int? SafehouseId, string? IncidentDate,
    string? IncidentType, string? Severity, string? Description, string? ActionTaken,
    string? ReportedBy, bool? Resolved);

public record SocialMediaRequest(string? Platform, string? PostDate, string? ContentType,
    string? Caption, int? Reach, int? Likes, int? Shares, int? DonationsLinked,
    decimal? DonationAmountLinked, string? CampaignTag);

public record ProcessRecordingRequest(int? ResidentId, string? SessionDate, string? CounselorName,
    string? SessionType, string? EmotionalState, string? Notes, string? FollowUpActions, string? Interventions);

public record VisitationRequest(int? ResidentId, string? VisitDate, string? VisitType,
    string? VisitorName, string? HomeEnvironment, string? FamilyCooperation,
    string? SafetyConcerns, string? FollowUpActions, string? Notes);
