using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Net.Mail;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController(SupabaseService db, IConfiguration config, ILogger<PublicController> logger) : ControllerBase
{
    public class QuickHelpRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Message { get; set; }
    }

    [HttpGet("impact-snapshot")]
    public async Task<IActionResult> ImpactSnapshot()
    {
        // Always compute live from actual data
        var residents = await db.GetAllAsync<Resident>("residents",
            "select=resident_id,case_status,reintegration_status,current_risk_level");
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses",
            "select=safehouse_id,status,capacity_girls,current_occupancy,name,city,region");
        var donations = await db.GetAllAsync<Donation>("donations",
            "select=amount,donation_type");

        var total = residents.Count;
        var active = residents.Count(r => r.CaseStatus == "Active");
        var reintegrated = residents.Count(r => r.ReintegrationStatus == "Completed");
        var totalDonations = donations.Where(d => d.DonationType == "Monetary").Sum(d => d.Amount ?? 0);
        var activeSafehouses = safehouses.Count(s => s.Status == "Active");
        var totalCapacity = safehouses.Where(s => s.Status == "Active").Sum(s => s.CapacityGirls ?? 0);
        var totalOccupancy = safehouses.Where(s => s.Status == "Active").Sum(s => s.CurrentOccupancy ?? 0);

        return Ok(new
        {
            totalResidentsHelped = total,
            activeResidents = active,
            reintegratedResidents = reintegrated,
            reintegrationRate = total > 0 ? Math.Round((double)reintegrated / total * 100, 1) : 0,
            totalSafehouses = activeSafehouses,
            totalCapacity,
            totalOccupancy,
            totalDonationsReceived = totalDonations,
            lastUpdated = DateTime.UtcNow
        });
    }

    [HttpGet("safehouses")]
    public async Task<IActionResult> GetSafehouses()
    {
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses",
            "select=*&status=eq.Active&order=name.asc");

        var result = safehouses.Select(s => new
        {
            s.SafehouseId, s.SafehouseCode, s.Name, s.Region, s.City, s.Province,
            s.CapacityGirls, s.CurrentOccupancy, s.Status
        });

        return Ok(result);
    }

    [HttpGet("donation-trends")]
    public async Task<IActionResult> DonationTrends()
    {
        var donations = await db.GetAllAsync<Donation>("donations",
            "select=amount,donation_date,donation_type&donation_type=eq.Monetary&order=donation_date.asc");

        var grouped = donations
            .Where(d => !string.IsNullOrEmpty(d.DonationDate))
            .GroupBy(d => d.DonationDate![..7])
            .Select(g => new { month = g.Key, total = g.Sum(d => d.Amount ?? 0), count = g.Count() })
            .OrderBy(x => x.month)
            .ToList();

        return Ok(grouped);
    }

    [HttpGet("outcome-metrics")]
    public async Task<IActionResult> OutcomeMetrics()
    {
        var residents = await db.GetAllAsync<Resident>("residents",
            "select=case_status,current_risk_level,case_category,reintegration_status");

        var byStatus = residents.GroupBy(r => r.CaseStatus)
            .Select(g => new { status = g.Key, count = g.Count() });
        var byRisk = residents.GroupBy(r => r.CurrentRiskLevel)
            .Select(g => new { riskLevel = g.Key, count = g.Count() });
        var byCategory = residents.GroupBy(r => r.CaseCategory)
            .Select(g => new { category = g.Key, count = g.Count() });

        return Ok(new { byStatus, byRisk, byCategory });
    }

    [HttpPost("contact")]
    public async Task<IActionResult> Contact([FromBody] QuickHelpRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Message))
            return BadRequest(new { message = "Message is required." });

        var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? config["Email:SmtpHost"];
        var smtpPortRaw = Environment.GetEnvironmentVariable("SMTP_PORT") ?? config["Email:SmtpPort"];
        var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER") ?? config["Email:SmtpUser"];
        var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASS") ?? config["Email:SmtpPass"];
        var smtpFrom = Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? config["Email:From"];
        var toEmail = Environment.GetEnvironmentVariable("QUICK_HELP_TO_EMAIL")
            ?? config["Email:QuickHelpTo"]
            ?? "jadesanford03@gmail.com";

        if (string.IsNullOrWhiteSpace(smtpHost) || string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass))
        {
            logger.LogWarning(
                "Quick help request accepted without SMTP config. Name: {Name}, Email: {Email}, Phone: {Phone}, Message: {Message}",
                body.Name, body.Email, body.Phone, body.Message
            );
            return Ok(new
            {
                message = "Your request was received. Email delivery is not configured yet on this server.",
                delivered = false
            });
        }

        var smtpPort = int.TryParse(smtpPortRaw, out var parsedPort) ? parsedPort : 587;
        var fromEmail = string.IsNullOrWhiteSpace(smtpFrom) ? smtpUser : smtpFrom;
        var name = string.IsNullOrWhiteSpace(body.Name) ? "Not provided" : body.Name!.Trim();
        var email = string.IsNullOrWhiteSpace(body.Email) ? "Not provided" : body.Email!.Trim();
        var phone = string.IsNullOrWhiteSpace(body.Phone) ? "Not provided" : body.Phone!.Trim();
        var message = body.Message.Trim();

        var subject = $"Quick Help Request - {name}";
        var emailBody = $"Name: {name}\nEmail: {email}\nPhone: {phone}\n\nMessage:\n{message}";

        try
        {
            using var mail = new MailMessage(fromEmail, toEmail, subject, emailBody);
            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(smtpUser, smtpPass)
            };

            await client.SendMailAsync(mail);
            return Ok(new { message = "Your request has been sent." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send quick help email.");
            return StatusCode(500, new { message = "Unable to send your request right now." });
        }
    }
}
