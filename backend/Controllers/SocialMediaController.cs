using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/social-media")]
[Authorize]
public class SocialMediaController(SupabaseService db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? platform,
        [FromQuery] string? postType,
        [FromQuery] string? campaign,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        var filters = new List<string>();
        if (!string.IsNullOrEmpty(platform)) filters.Add($"platform=eq.{platform}");
        if (!string.IsNullOrEmpty(postType)) filters.Add($"post_type=eq.{postType}");
        if (!string.IsNullOrEmpty(campaign)) filters.Add($"campaign_name=eq.{campaign}");

        var offset = (page - 1) * pageSize;
        var filterStr = filters.Count > 0 ? string.Join("&", filters) + "&" : "";
        var posts = await db.GetAllAsync<SocialMediaPost>("social_media_posts",
            $"select=*&{filterStr}order=created_at.desc&limit={pageSize}&offset={offset}");
        return Ok(posts);
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> Metrics()
    {
        var posts = await db.GetAllAsync<SocialMediaPost>("social_media_posts",
            "select=platform,reach,likes,comments,shares,saves,click_throughs,donation_referrals,estimated_donation_value_php,impressions,engagement_rate,is_boosted,boost_budget_php");

        var byPlatform = posts.GroupBy(p => p.Platform)
            .Select(g => new
            {
                platform = g.Key,
                postCount = g.Count(),
                totalReach = g.Sum(p => p.Reach ?? 0),
                totalLikes = g.Sum(p => p.Likes ?? 0),
                totalComments = g.Sum(p => p.Comments ?? 0),
                totalShares = g.Sum(p => p.Shares ?? 0),
                totalImpressions = g.Sum(p => p.Impressions ?? 0),
                totalDonationReferrals = g.Sum(p => p.DonationReferrals ?? 0),
                totalEstimatedDonations = g.Sum(p => p.EstimatedDonationValuePhp ?? 0),
                avgEngagementRate = g.Any() ? Math.Round(g.Average(p => (double)(p.EngagementRate ?? 0)), 4) : 0
            });

        return Ok(new
        {
            byPlatform,
            totalReach = posts.Sum(p => p.Reach ?? 0),
            totalImpressions = posts.Sum(p => p.Impressions ?? 0),
            totalDonationReferrals = posts.Sum(p => p.DonationReferrals ?? 0),
            totalEstimatedDonations = posts.Sum(p => p.EstimatedDonationValuePhp ?? 0),
            totalPosts = posts.Count,
            boostedPosts = posts.Count(p => p.IsBoosted == true),
            totalBoostSpend = posts.Sum(p => p.BoostBudgetPhp ?? 0)
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var post = await db.GetOneAsync<SocialMediaPost>("social_media_posts", $"post_id=eq.{id}&select=*");
        if (post == null) return NotFound();
        return Ok(post);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("social_media_posts", $"post_id=eq.{id}");
        return NoContent();
    }
}
