// Contracts for JSON from the Python FastAPI service (snake_case keys).
// Reference from your ASP.NET Core project and map to your own DTOs if needed.

using System.Text.Json.Serialization;

namespace Lighthouse.Ml.Contracts;

public sealed record FeaturePayload(
    [property: JsonPropertyName("features")] IReadOnlyDictionary<string, object?> Features
);

public sealed record NarrativeBlock(
    [property: JsonPropertyName("headline")] string Headline,
    [property: JsonPropertyName("tier_label")] string TierLabel,
    [property: JsonPropertyName("threshold_rule")] string ThresholdRule,
    [property: JsonPropertyName("action_bullets")] IReadOnlyList<string> ActionBullets
);

public sealed record GlobalDriverRow(
    [property: JsonPropertyName("feature")] string Feature,
    [property: JsonPropertyName("importance")] double Importance
);

public sealed record GlobalDriversPayload(
    [property: JsonPropertyName("available")] bool Available,
    [property: JsonPropertyName("drivers")] IReadOnlyList<GlobalDriverRow> Drivers,
    [property: JsonPropertyName("source")] string? Source,
    [property: JsonPropertyName("error")] string? Error
);

public sealed record FamilyImportanceRow(
    [property: JsonPropertyName("family")] string Family,
    [property: JsonPropertyName("importance")] double Importance
);

public sealed record ReintegrationPrediction(
    [property: JsonPropertyName("probability_success")] double ProbabilitySuccess,
    [property: JsonPropertyName("threshold")] double Threshold,
    [property: JsonPropertyName("tier")] string Tier
);

public sealed record EscalationPrediction(
    [property: JsonPropertyName("probability_incident_30d")] double ProbabilityIncident30d,
    [property: JsonPropertyName("threshold")] double Threshold,
    [property: JsonPropertyName("tier")] string Tier
);

public sealed record ReintegrationDashboardResponse(
    [property: JsonPropertyName("model")] string Model,
    [property: JsonPropertyName("prediction")] ReintegrationPrediction Prediction,
    [property: JsonPropertyName("narrative")] NarrativeBlock Narrative,
    [property: JsonPropertyName("global_drivers")] GlobalDriversPayload GlobalDrivers,
    [property: JsonPropertyName("family_importance")] IReadOnlyList<FamilyImportanceRow> FamilyImportance
);

public sealed record CaseEscalationDashboardResponse(
    [property: JsonPropertyName("model")] string Model,
    [property: JsonPropertyName("prediction")] EscalationPrediction Prediction,
    [property: JsonPropertyName("narrative")] NarrativeBlock Narrative,
    [property: JsonPropertyName("global_drivers")] GlobalDriversPayload GlobalDrivers,
    [property: JsonPropertyName("family_importance")] IReadOnlyList<FamilyImportanceRow> FamilyImportance
);

public sealed record MlHealthResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("artifacts_dir")] string ArtifactsDir,
    [property: JsonPropertyName("reintegration_loaded")] bool ReintegrationLoaded,
    [property: JsonPropertyName("case_escalation_loaded")] bool CaseEscalationLoaded
);
