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
    public async Task<IActionResult> GetAll([FromQuery] string? platform)
    {
        var filter = !string.IsNullOrEmpty(platform) ? $"platform=eq.{platform}&" : "";
        var posts = await db.GetAllAsync<SocialMediaPost>("social_media_posts",
            $"select=*&{filter}order=post_date.desc");
        return Ok(posts);
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> Metrics()
    {
        var posts = await db.GetAllAsync<SocialMediaPost>("social_media_posts", "select=*");
        var byPlatform = posts.GroupBy(p => p.Platform)
            .Select(g => new
            {
                platform = g.Key,
                totalReach = g.Sum(p => p.Reach ?? 0),
                totalLikes = g.Sum(p => p.Likes ?? 0),
                totalShares = g.Sum(p => p.Shares ?? 0),
                totalDonations = g.Sum(p => p.DonationAmountLinked ?? 0),
                postCount = g.Count()
            });
        return Ok(new
        {
            byPlatform,
            totalReach = posts.Sum(p => p.Reach ?? 0),
            totalDonations = posts.Sum(p => p.DonationAmountLinked ?? 0),
            totalPosts = posts.Count
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SocialMediaRequest req)
    {
        var result = await db.InsertAsync<SocialMediaPost>("social_media_posts", new
        {
            platform = req.Platform, post_date = req.PostDate, content_type = req.ContentType,
            caption = req.Caption, reach = req.Reach, likes = req.Likes, shares = req.Shares,
            donations_linked = req.DonationsLinked, donation_amount_linked = req.DonationAmountLinked,
            campaign_tag = req.CampaignTag
        });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SocialMediaRequest req)
    {
        var result = await db.UpdateAsync<SocialMediaPost>("social_media_posts", $"id=eq.{id}", new
        {
            platform = req.Platform, post_date = req.PostDate, content_type = req.ContentType,
            caption = req.Caption, reach = req.Reach, likes = req.Likes, shares = req.Shares,
            donations_linked = req.DonationsLinked, donation_amount_linked = req.DonationAmountLinked,
            campaign_tag = req.CampaignTag
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("social_media_posts", $"id=eq.{id}");
        return NoContent();
    }
}
