using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "InternalStaff")]
public class AnalyticsController(SupabaseService db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var residents = await db.GetAllAsync<Resident>("residents",
            "select=resident_id,case_status,current_risk_level,safehouse_id,created_at,reintegration_status");
        var donations = await db.GetAllAsync<Donation>("donations",
            "select=amount,donation_date,donation_type");
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses",
            "select=safehouse_id,capacity_girls,current_occupancy,status");
        var incidents = await db.GetAllAsync<IncidentReport>("incident_reports",
            "select=incident_id,resolved,severity");
        var supporters = await db.GetAllAsync<Supporter>("supporters",
            "select=supporter_id,supporter_type,status");

        var thisMonth = DateTime.UtcNow.ToString("yyyy-MM");
        var monthlyDonations = donations
            .Where(d => d.DonationType == "Monetary" && d.DonationDate?.StartsWith(thisMonth) == true)
            .Sum(d => d.Amount ?? 0);

        return Ok(new
        {
            residents = new
            {
                total = residents.Count,
                active = residents.Count(r => r.CaseStatus == "Active"),
                closed = residents.Count(r => r.CaseStatus == "Closed"),
                transferred = residents.Count(r => r.CaseStatus == "Transferred"),
                highRisk = residents.Count(r => r.CurrentRiskLevel is "High" or "Critical"),
                critical = residents.Count(r => r.CurrentRiskLevel == "Critical"),
                reintegrationInProgress = residents.Count(r => r.ReintegrationStatus == "In Progress"),
                reintegrationCompleted = residents.Count(r => r.ReintegrationStatus == "Completed")
            },
            donations = new
            {
                thisMonth = monthlyDonations,
                total = donations.Where(d => d.DonationType == "Monetary").Sum(d => d.Amount ?? 0),
                count = donations.Count,
                monetary = donations.Count(d => d.DonationType == "Monetary"),
                inKind = donations.Count(d => d.DonationType == "InKind")
            },
            safehouses = new
            {
                total = safehouses.Count(s => s.Status == "Active"),
                totalCapacityGirls = safehouses.Sum(s => s.CapacityGirls ?? 0),
                totalOccupancy = safehouses.Sum(s => s.CurrentOccupancy ?? 0)
            },
            incidents = new
            {
                total = incidents.Count,
                unresolved = incidents.Count(i => i.Resolved != true),
                high = incidents.Count(i => i.Severity == "High"),
                requiresFollowUp = incidents.Count(i => i.FollowUpRequired == true)
            },
            supporters = new
            {
                total = supporters.Count,
                active = supporters.Count(s => s.Status == "Active"),
                monetary = supporters.Count(s => s.SupporterType == "MonetaryDonor"),
                inKind = supporters.Count(s => s.SupporterType == "InKindDonor"),
                volunteers = supporters.Count(s => s.SupporterType == "Volunteer")
            }
        });
    }

    [HttpGet("safehouse-comparison")]
    public async Task<IActionResult> SafehouseComparison()
    {
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses", "select=*");
        var residents = await db.GetAllAsync<Resident>("residents",
            "select=safehouse_id,case_status,current_risk_level,reintegration_status");
        var metrics = await db.GetAllAsync<SafehouseMonthlyMetric>("safehouse_monthly_metrics",
            "select=*&order=month_start.desc");

        var result = safehouses.Select(s =>
        {
            var mine = residents.Where(r => r.SafehouseId == s.SafehouseId).ToList();
            var latestMetric = metrics.FirstOrDefault(m => m.SafehouseId == s.SafehouseId);
            return new
            {
                s.SafehouseId, s.Name, s.City, s.Province, s.Region,
                s.CapacityGirls, s.CurrentOccupancy, s.Status,
                active = mine.Count(r => r.CaseStatus == "Active"),
                total = mine.Count,
                closed = mine.Count(r => r.CaseStatus == "Closed"),
                highRisk = mine.Count(r => r.CurrentRiskLevel is "High" or "Critical"),
                occupancyRate = s.CapacityGirls > 0
                    ? Math.Round((double)(s.CurrentOccupancy ?? 0) / s.CapacityGirls!.Value * 100, 1)
                    : 0,
                avgEducationProgress = latestMetric?.AvgEducationProgress,
                avgHealthScore = latestMetric?.AvgHealthScore,
                incidentCount = latestMetric?.IncidentCount
            };
        });
        return Ok(result);
    }

    [HttpGet("donation-trends")]
    public async Task<IActionResult> DonationTrends()
    {
        var donations = await db.GetAllAsync<Donation>("donations",
            "select=amount,donation_date,channel_source,campaign_name,donation_type,is_recurring&order=donation_date.asc");

        var monetary = donations.Where(d => d.DonationType == "Monetary").ToList();

        var monthly = monetary
            .Where(d => !string.IsNullOrEmpty(d.DonationDate))
            .GroupBy(d => d.DonationDate![..7])
            .Select(g => new { month = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() })
            .OrderBy(x => x.month);

        var byChannel = donations.GroupBy(d => d.ChannelSource)
            .Select(g => new { channel = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() });

        var byType = donations.GroupBy(d => d.DonationType)
            .Select(g => new { type = g.Key, count = g.Count(), total = g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0) });

        var byCampaign = monetary
            .Where(d => !string.IsNullOrEmpty(d.CampaignName))
            .GroupBy(d => d.CampaignName)
            .Select(g => new { campaign = g.Key, total = g.Sum(d => d.Amount ?? 0) })
            .OrderByDescending(x => x.total).Take(10);

        return Ok(new { monthly, byChannel, byType, byCampaign });
    }

    [HttpGet("resident-outcomes")]
    public async Task<IActionResult> ResidentOutcomes()
    {
        var residents = await db.GetAllAsync<Resident>("residents",
            "select=case_status,current_risk_level,case_category,reintegration_status,reintegration_type,created_at,sub_cat_trafficked,sub_cat_sexual_abuse,sub_cat_physical_abuse,sub_cat_osaec");

        var byStatus = residents.GroupBy(r => r.CaseStatus)
            .Select(g => new { name = g.Key, value = g.Count() });
        var byCategory = residents.GroupBy(r => r.CaseCategory)
            .Select(g => new { name = g.Key, value = g.Count() });
        var byRisk = residents.GroupBy(r => r.CurrentRiskLevel)
            .Select(g => new { name = g.Key, value = g.Count() });
        var byReintegration = residents.GroupBy(r => r.ReintegrationStatus)
            .Select(g => new { name = g.Key, value = g.Count() });

        var subCategories = new
        {
            trafficked = residents.Count(r => r.SubCatTrafficked == true),
            sexualAbuse = residents.Count(r => r.SubCatSexualAbuse == true),
            physicalAbuse = residents.Count(r => r.SubCatPhysicalAbuse == true),
            osaec = residents.Count(r => r.SubCatOsaec == true)
        };

        var monthly = residents
            .Where(r => r.CreatedAt.HasValue)
            .GroupBy(r => r.CreatedAt!.Value.ToString("yyyy-MM"))
            .Select(g => new { month = g.Key, admissions = g.Count() })
            .OrderBy(x => x.month);

        return Ok(new { byStatus, byCategory, byRisk, byReintegration, subCategories, monthly });
    }

    [HttpGet("at-risk")]
    public async Task<IActionResult> AtRisk()
    {
        var residentsTask = db.GetAllAsync<Resident>("residents",
            "select=resident_id,case_control_no,internal_code,safehouse_id,current_risk_level,case_status,reintegration_status&case_status=eq.Active&order=current_risk_level.asc");
        var safehousesTask = db.GetAllAsync<Safehouse>("safehouses",
            "select=safehouse_id,name,city");

        await Task.WhenAll(residentsTask, safehousesTask);
        var allResidents = await residentsTask;
        var safehousesMap = (await safehousesTask).ToDictionary(s => s.SafehouseId);

        var riskOrder = new Dictionary<string, int> { ["Critical"] = 0, ["High"] = 1 };

        var atRisk = allResidents
            .Where(r => r.CurrentRiskLevel is "High" or "Critical")
            .OrderBy(r => riskOrder.GetValueOrDefault(r.CurrentRiskLevel ?? "", 99))
            .Select(r =>
            {
                safehousesMap.TryGetValue(r.SafehouseId ?? -1, out var sh);
                return new
                {
                    r.ResidentId, r.CaseControlNo, r.InternalCode,
                    r.CurrentRiskLevel, r.CaseStatus, r.ReintegrationStatus,
                    safehouses = sh != null ? new { sh.Name, sh.City } : null
                };
            });

        return Ok(atRisk);
    }

    [HttpGet("social-media-impact")]
    public async Task<IActionResult> SocialMediaImpact()
    {
        var posts = await db.GetAllAsync<SocialMediaPost>("social_media_posts",
            "select=platform,post_type,reach,engagement_rate,donation_referrals,estimated_donation_value_php,campaign_name,created_at&order=created_at.desc");

        var byPostType = posts.GroupBy(p => p.PostType)
            .Select(g => new
            {
                postType = g.Key,
                count = g.Count(),
                avgEngagement = g.Any() ? Math.Round(g.Average(p => (double)(p.EngagementRate ?? 0)), 4) : 0,
                totalDonations = g.Sum(p => p.EstimatedDonationValuePhp ?? 0)
            });

        return Ok(new { byPostType, topPosts = posts.OrderByDescending(p => p.EstimatedDonationValuePhp).Take(5) });
    }

    /// <summary>Runs lightweight analytics "pipelines" on live Supabase-backed tables (forecast, risk mix, occupancy, donor recency).</summary>
    [HttpGet("ml-pipelines")]
    public async Task<IActionResult> MlPipelines()
    {
        try
        {
            var donationsTask = db.GetAllAsync<Donation>("donations",
                "select=amount,donation_date,donation_type,supporter_id&order=donation_date.asc");
            var residentsTask = db.GetAllAsync<Resident>("residents",
                "select=resident_id,case_status,current_risk_level,safehouse_id,reintegration_status");
            var safehousesTask = db.GetAllAsync<Safehouse>("safehouses",
                "select=safehouse_id,name,capacity_girls,current_occupancy,status");
            var supportersTask = db.GetAllAsync<Supporter>("supporters",
                "select=supporter_id,supporter_type,status");
            var donorPredictionsTask = db.GetAllAsync<DonorChurnPrediction>("donor_churn_predictions",
                "select=supporter_id,churn_probability,churn_prediction,risk_level,scored_at,model_version");
            var caseEscalationMlTask = db.GetAllAsync<CaseEscalationPredictionRow>("ml_case_escalation_predictions",
                "select=resident_id,incident_probability,incident_prediction,risk_tier,scored_at,model_version");
            var reintegrationMlTask = db.GetAllAsync<ReintegrationPredictionRow>("ml_reintegration_predictions",
                "select=resident_id,success_probability,success_prediction,scored_at,model_version");
            var educationMlTask = db.GetAllAsync<EducationProgressPredictionRow>("ml_education_progress_predictions",
                "select=education_record_id,resident_id,record_date,predicted_progress,scored_at,model_version");
            var healthMlTask = db.GetAllAsync<HealthAlertPredictionRow>("ml_health_alert_predictions",
                "select=resident_id,deterioration_probability,deterioration_prediction,risk_level,scored_at,model_version");
            var visitationMlTask = db.GetAllAsync<HomeVisitationPredictionRow>("ml_home_visitation_predictions",
                "select=visitation_id,resident_id,followup_priority_probability,followup_priority_prediction,priority_tier,scored_at,model_version");
            var interventionMlTask = db.GetAllAsync<InterventionPlanPredictionRow>("ml_intervention_plan_predictions",
                "select=plan_id,resident_id,completion_risk_probability,completion_risk_prediction,risk_tier,scored_at,model_version");
            var safehouseMlTask = db.GetAllAsync<SafehouseStrainPredictionRow>("ml_safehouse_strain_predictions",
                "select=safehouse_id,strain_forecast_value,strain_probability,strain_prediction,scored_at,model_version");
            var educationTask = db.GetAllAsync<EducationRecord>("education_records",
                "select=record_date,progress_percent,enrollment_status");
            var healthTask = db.GetAllAsync<HealthWellbeingRecord>("health_wellbeing_records",
                "select=record_date,general_health_score,medical_checkup_done,dental_checkup_done,psychological_checkup_done");
            var visitationsTask = db.GetAllAsync<HomeVisitation>("home_visitations",
                "select=visit_date,follow_up_needed,safety_concerns_noted,visit_outcome,family_cooperation_level");
            var plansTask = db.GetAllAsync<InterventionPlan>("intervention_plans",
                "select=status,target_date,created_at,plan_category");

            await Task.WhenAll(
                donationsTask, residentsTask, safehousesTask, supportersTask, donorPredictionsTask,
                caseEscalationMlTask, reintegrationMlTask, educationMlTask, healthMlTask, visitationMlTask,
                interventionMlTask, safehouseMlTask,
                educationTask, healthTask, visitationsTask, plansTask);

            var donations = await donationsTask;
            var residents = await residentsTask;
            var safehouses = await safehousesTask;
            var supporters = await supportersTask;
            var donorPredictions = await donorPredictionsTask;
            var caseEscalationMl = await caseEscalationMlTask;
            var reintegrationMl = await reintegrationMlTask;
            var educationMl = await educationMlTask;
            var healthMl = await healthMlTask;
            var visitationMl = await visitationMlTask;
            var interventionMl = await interventionMlTask;
            var safehouseMl = await safehouseMlTask;
            var education = await educationTask;
            var health = await healthTask;
            var visitations = await visitationsTask;
            var plans = await plansTask;

            var donationForecast = MlPipelineInsights.BuildDonationForecast(donations);
            var caseEscalation = caseEscalationMl.Count > 0
                ? MlPipelineInsights.BuildCaseEscalationFromMl(caseEscalationMl)
                : MlPipelineInsights.BuildRiskScoring(residents);
            var safehouseCapacity = safehouseMl.Count > 0
                ? MlPipelineInsights.BuildOccupancyFromStrainMl(safehouses, safehouseMl)
                : MlPipelineInsights.BuildOccupancy(safehouses);
            var donorChurn = donorPredictions.Count > 0
                ? MlPipelineInsights.BuildDonorChurnFromPredictions(donations, supporters, donorPredictions)
                : MlPipelineInsights.BuildDonorChurn(donations, supporters);

            var reintegrationByStatus = reintegrationMl.Count > 0
                ? MlPipelineInsights.ReintegrationMlByReadinessBand(reintegrationMl)
                    .Select(x => new { name = x.Level, value = x.Count })
                    .ToList()
                : residents
                    .GroupBy(r => string.IsNullOrWhiteSpace(r.ReintegrationStatus) ? "Unknown" : r.ReintegrationStatus!)
                    .Select(g => new { name = g.Key, value = g.Count() })
                    .OrderByDescending(x => x.value)
                    .ToList();
            var readyCount = residents.Count(r => r.ReintegrationStatus == "Completed");
            var readinessRateHeuristic = residents.Count > 0 ? Math.Round((double)readyCount / residents.Count * 100, 1) : 0;
            var readinessRateMl = MlPipelineInsights.ReintegrationReadinessRateFromMl(reintegrationMl);
            var readinessRate = readinessRateMl ?? readinessRateHeuristic;

            var eduMonthly = educationMl.Count > 0
                ? MlPipelineInsights.GroupEducationPredictions(educationMl)
                    .Select(x => new { month = x.Month, avgProgress = x.AvgProgress, count = x.Count })
                    .ToList()
                : education
                    .Select(e => new { month = MlPipelineInsights.MonthKey(e.RecordDate), progress = e.ProgressPercent ?? 0 })
                    .Where(x => x.month != null)
                    .GroupBy(x => x.month!)
                    .Select(g => new { month = g.Key, avgProgress = Math.Round(g.Average(x => (double)x.progress), 1), count = g.Count() })
                    .OrderBy(x => x.month)
                    .ToList();

            var lowHealth = healthMl.Count > 0
                ? healthMl.Count(h => h.DeteriorationPrediction == 1)
                : health.Count(h => (h.GeneralHealthScore ?? 100) < 60);
            var checkupGaps = health.Count(h => h.MedicalCheckupDone != true || h.DentalCheckupDone != true || h.PsychologicalCheckupDone != true);
            object[] healthBands;
            if (healthMl.Count > 0)
            {
                healthBands = new object[]
                {
                    new { name = "Model: high", value = healthMl.Count(h => string.Equals(h.RiskLevel, "high", StringComparison.OrdinalIgnoreCase)) },
                    new { name = "Model: medium", value = healthMl.Count(h => string.Equals(h.RiskLevel, "medium", StringComparison.OrdinalIgnoreCase)) },
                    new { name = "Model: low", value = healthMl.Count(h => string.Equals(h.RiskLevel, "low", StringComparison.OrdinalIgnoreCase)) },
                };
            }
            else
            {
                healthBands = new object[]
                {
                    new { name = "High (>=80)", value = health.Count(h => (h.GeneralHealthScore ?? 0) >= 80) },
                    new { name = "Moderate (60-79)", value = health.Count(h => (h.GeneralHealthScore ?? 0) >= 60 && (h.GeneralHealthScore ?? 0) < 80) },
                    new { name = "Low (<60)", value = health.Count(h => (h.GeneralHealthScore ?? 0) < 60) },
                };
            }

            var followUpHeuristic = visitations.Count(v => v.FollowUpNeeded == true);
            var followUpMl = visitationMl.Count > 0 ? MlPipelineInsights.CountHighPriorityVisitations(visitationMl) : 0;
            var followUpNeeded = visitationMl.Count > 0 ? Math.Max(followUpHeuristic, followUpMl) : followUpHeuristic;
            var safetyConcerns = visitations.Count(v => v.SafetyConcernsNoted == true);
            var visitByOutcome = visitationMl.Count > 0
                ? MlPipelineInsights.VisitationMlByPriorityTier(visitationMl)
                    .Select(x => new { name = x.Level, value = x.Count })
                    .ToList()
                : visitations
                    .GroupBy(v => string.IsNullOrWhiteSpace(v.VisitOutcome) ? "Unknown" : v.VisitOutcome!)
                    .Select(g => new { name = g.Key, value = g.Count() })
                    .OrderByDescending(x => x.value)
                    .Take(8)
                    .ToList();

            var now = DateTime.UtcNow.Date;
            var overdueOpen = plans.Count(p =>
                p.Status == "Open"
                && DateTime.TryParse(p.TargetDate, out var target)
                && target.Date < now);
            if (interventionMl.Count > 0)
            {
                var planById = plans
                    .GroupBy(p => p.PlanId)
                    .ToDictionary(g => g.Key, g => g.First());
                var overdueMl = interventionMl.Count(ip =>
                    planById.TryGetValue(ip.PlanId, out var pl)
                    && pl.Status == "Open"
                    && DateTime.TryParse(pl.TargetDate, out var t)
                    && t.Date < now
                    && (string.Equals(ip.RiskTier, "high", StringComparison.OrdinalIgnoreCase)
                        || (ip.CompletionRiskProbability ?? 0) >= 0.6m));
                overdueOpen = Math.Max(overdueOpen, overdueMl);
            }
            var planByStatus = interventionMl.Count > 0
                ? MlPipelineInsights.InterventionMlByRiskTier(interventionMl)
                    .Select(x => new { name = x.Level, value = x.Count })
                    .ToList()
                : plans
                    .GroupBy(p => string.IsNullOrWhiteSpace(p.Status) ? "Unknown" : p.Status)
                    .Select(g => new { name = g.Key!, value = g.Count() })
                    .OrderByDescending(x => x.value)
                    .ToList();

            const int sampleCap = 30;
            var predictionSamples = new
            {
                caseEscalation = caseEscalationMl.Take(sampleCap).Select(p => new
                {
                    p.ResidentId,
                    p.RiskTier,
                    p.IncidentProbability,
                    p.IncidentPrediction
                }).ToList(),
                donorChurn = donorPredictions.Take(sampleCap).Select(p => new
                {
                    p.SupporterId,
                    p.ChurnProbability,
                    p.ChurnPrediction,
                    p.RiskLevel
                }).ToList(),
                reintegration = reintegrationMl.Take(sampleCap).Select(p => new
                {
                    p.ResidentId,
                    p.SuccessProbability,
                    p.SuccessPrediction
                }).ToList(),
                education = educationMl.Take(sampleCap).Select(p => new
                {
                    p.EducationRecordId,
                    p.ResidentId,
                    p.RecordDate,
                    p.PredictedProgress
                }).ToList(),
                health = healthMl.Take(sampleCap).Select(p => new
                {
                    p.ResidentId,
                    p.DeteriorationProbability,
                    p.DeteriorationPrediction,
                    p.RiskLevel
                }).ToList(),
                homeVisitation = visitationMl.Take(sampleCap).Select(p => new
                {
                    p.VisitationId,
                    p.ResidentId,
                    p.FollowupPriorityProbability,
                    p.PriorityTier,
                    p.FollowupPriorityPrediction
                }).ToList(),
                intervention = interventionMl.Take(sampleCap).Select(p => new
                {
                    p.PlanId,
                    p.ResidentId,
                    p.CompletionRiskProbability,
                    p.RiskTier,
                    p.CompletionRiskPrediction
                }).ToList(),
                safehouseStrain = safehouseMl.Take(sampleCap).Select(p => new
                {
                    p.SafehouseId,
                    p.StrainForecastValue,
                    p.StrainProbability,
                    p.StrainPrediction
                }).ToList()
            };

            var mlTableRowCounts = new
            {
                donorChurnPredictions = donorPredictions.Count,
                mlCaseEscalationPredictions = caseEscalationMl.Count,
                mlReintegrationPredictions = reintegrationMl.Count,
                mlEducationProgressPredictions = educationMl.Count,
                mlHealthAlertPredictions = healthMl.Count,
                mlHomeVisitationPredictions = visitationMl.Count,
                mlInterventionPlanPredictions = interventionMl.Count,
                mlSafehouseStrainPredictions = safehouseMl.Count
            };

            return Ok(new
            {
                generatedAt = DateTime.UtcNow,
                mlTableRowCounts,
                predictionSamples,
                donationForecast,
                caseEscalationRisk = caseEscalation,
                safehouseCapacityStrainForecast = safehouseCapacity,
                donorChurnPrediction = new
                {
                    monetarySupportersActive = donorChurn.MonetarySupportersActive,
                    withMonetaryDonations = donorChurn.WithMonetaryDonations,
                    activeLast90Days = donorChurn.ActiveLast90Days,
                    lapsing = donorChurn.Lapsing,
                    neverDonated = donorChurn.NeverDonated,
                    recentMonthly = donorChurn.RecentMonthly,
                    modelRiskByLevel = donorPredictions.Count > 0
                        ? MlPipelineInsights.DonorChurnMlByRiskLevel(donorPredictions)
                            .Select(x => new { name = x.Level, value = x.Count })
                            .ToList()
                        : null
                },
                reintegrationReadiness = new
                {
                    byStatus = reintegrationByStatus,
                    completed = readyCount,
                    readinessRate
                },
                educationProgressForecast = new
                {
                    monthly = eduMonthly
                },
                healthDeteriorationAlert = new
                {
                    lowHealthCount = lowHealth,
                    checkupGapCount = checkupGaps,
                    byBand = healthBands
                },
                homeVisitationFollowupPrioritization = new
                {
                    followUpNeeded,
                    safetyConcerns,
                    byOutcome = visitByOutcome
                },
                interventionPlanCompletionRisk = new
                {
                    openPlans = plans.Count(p => p.Status == "Open"),
                    overdueOpenPlans = overdueOpen,
                    byStatus = planByStatus
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "ml-pipelines failed", detail = ex.Message });
        }
    }
}
