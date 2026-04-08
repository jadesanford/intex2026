using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
            var educationTask = db.GetAllAsync<EducationRecord>("education_records",
                "select=record_date,progress_percent,enrollment_status");
            var healthTask = db.GetAllAsync<HealthWellbeingRecord>("health_wellbeing_records",
                "select=record_date,general_health_score,medical_checkup_done,dental_checkup_done,psychological_checkup_done");
            var visitationsTask = db.GetAllAsync<HomeVisitation>("home_visitations",
                "select=visit_date,follow_up_needed,safety_concerns_noted,visit_outcome,family_cooperation_level");
            var plansTask = db.GetAllAsync<InterventionPlan>("intervention_plans",
                "select=status,target_date,created_at,plan_category");

            await Task.WhenAll(donationsTask, residentsTask, safehousesTask, supportersTask, educationTask, healthTask, visitationsTask, plansTask);

            var donations = await donationsTask;
            var residents = await residentsTask;
            var safehouses = await safehousesTask;
            var supporters = await supportersTask;
            var education = await educationTask;
            var health = await healthTask;
            var visitations = await visitationsTask;
            var plans = await plansTask;

            var donationForecast = MlPipelineInsights.BuildDonationForecast(donations);
            var caseEscalation = MlPipelineInsights.BuildRiskScoring(residents);
            var safehouseCapacity = MlPipelineInsights.BuildOccupancy(safehouses);
            var donorChurn = MlPipelineInsights.BuildDonorChurn(donations, supporters);

            var reintegrationByStatus = residents
                .GroupBy(r => string.IsNullOrWhiteSpace(r.ReintegrationStatus) ? "Unknown" : r.ReintegrationStatus!)
                .Select(g => new { name = g.Key, value = g.Count() })
                .OrderByDescending(x => x.value)
                .ToList();
            var readyCount = residents.Count(r => r.ReintegrationStatus == "Completed");
            var readinessRate = residents.Count > 0 ? Math.Round((double)readyCount / residents.Count * 100, 1) : 0;

            var eduMonthly = education
                .Select(e => new { month = MlPipelineInsights.MonthKey(e.RecordDate), progress = e.ProgressPercent ?? 0 })
                .Where(x => x.month != null)
                .GroupBy(x => x.month!)
                .Select(g => new { month = g.Key, avgProgress = Math.Round(g.Average(x => (double)x.progress), 1), count = g.Count() })
                .OrderBy(x => x.month)
                .ToList();

            var lowHealth = health.Count(h => (h.GeneralHealthScore ?? 100) < 60);
            var checkupGaps = health.Count(h => h.MedicalCheckupDone != true || h.DentalCheckupDone != true || h.PsychologicalCheckupDone != true);
            var healthBands = new[]
            {
                new { name = "High (>=80)", value = health.Count(h => (h.GeneralHealthScore ?? 0) >= 80) },
                new { name = "Moderate (60-79)", value = health.Count(h => (h.GeneralHealthScore ?? 0) >= 60 && (h.GeneralHealthScore ?? 0) < 80) },
                new { name = "Low (<60)", value = health.Count(h => (h.GeneralHealthScore ?? 0) < 60) },
            };

            var followUpNeeded = visitations.Count(v => v.FollowUpNeeded == true);
            var safetyConcerns = visitations.Count(v => v.SafetyConcernsNoted == true);
            var visitByOutcome = visitations
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
            var planByStatus = plans
                .GroupBy(p => string.IsNullOrWhiteSpace(p.Status) ? "Unknown" : p.Status)
                .Select(g => new { name = g.Key!, value = g.Count() })
                .OrderByDescending(x => x.value)
                .ToList();

            return Ok(new
            {
                generatedAt = DateTime.UtcNow,
                donationForecast,
                caseEscalationRisk = caseEscalation,
                safehouseCapacityStrainForecast = safehouseCapacity,
                donorChurnPrediction = donorChurn,
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
