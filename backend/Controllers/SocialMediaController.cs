using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/social-media")]
[Authorize(Policy = "InternalStaff")]
public class SocialMediaController(SupabaseService db) : ControllerBase
{
    private async Task<int> NextPostIdAsync()
    {
        var latest = await db.GetAllAsync<SocialMediaPost>("social_media_posts", "select=post_id&order=post_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].PostId + 1;
    }

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

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] SocialMediaPostRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Platform))
            return BadRequest(new { message = "Platform is required." });

        var postId = await NextPostIdAsync();
        var (result, err) = await db.TryInsertAsync<SocialMediaPost>("social_media_posts", new
        {
            post_id = postId,
            platform = req.Platform,
            platform_post_id = req.PlatformPostId,
            post_url = req.PostUrl,
            created_at = req.CreatedAt,
            day_of_week = req.DayOfWeek,
            post_hour = req.PostHour,
            post_type = req.PostType,
            media_type = req.MediaType,
            caption = req.Caption,
            hashtags = req.Hashtags,
            num_hashtags = req.NumHashtags,
            mentions_count = req.MentionsCount,
            has_call_to_action = req.HasCallToAction,
            call_to_action_type = req.CallToActionType,
            content_topic = req.ContentTopic,
            sentiment_tone = req.SentimentTone,
            caption_length = req.CaptionLength,
            features_resident_story = req.FeaturesResidentStory,
            campaign_name = req.CampaignName,
            is_boosted = req.IsBoosted ?? false,
            boost_budget_php = req.BoostBudgetPhp,
            impressions = req.Impressions,
            reach = req.Reach,
            likes = req.Likes,
            comments = req.Comments,
            shares = req.Shares,
            saves = req.Saves,
            click_throughs = req.ClickThroughs,
            video_views = req.VideoViews,
            engagement_rate = req.EngagementRate,
            profile_visits = req.ProfileVisits,
            donation_referrals = req.DonationReferrals,
            estimated_donation_value_php = req.EstimatedDonationValuePhp,
            follower_count_at_post = req.FollowerCountAtPost,
            watch_time_seconds = req.WatchTimeSeconds,
            avg_view_duration_seconds = req.AvgViewDurationSeconds,
            subscriber_count_at_post = req.SubscriberCountAtPost,
            forwards = req.Forwards
        });
        if (result == null)
            return BadRequest(new { message = err ?? "Unable to create social post." });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] SocialMediaPostRequest req)
    {
        var patch = new Dictionary<string, object?>();
        if (req.Platform != null) patch["platform"] = req.Platform;
        if (req.PlatformPostId != null) patch["platform_post_id"] = req.PlatformPostId;
        if (req.PostUrl != null) patch["post_url"] = req.PostUrl;
        if (req.CreatedAt != null) patch["created_at"] = req.CreatedAt;
        if (req.DayOfWeek != null) patch["day_of_week"] = req.DayOfWeek;
        if (req.PostHour.HasValue) patch["post_hour"] = req.PostHour.Value;
        if (req.PostType != null) patch["post_type"] = req.PostType;
        if (req.MediaType != null) patch["media_type"] = req.MediaType;
        if (req.Caption != null) patch["caption"] = req.Caption;
        if (req.Hashtags != null) patch["hashtags"] = req.Hashtags;
        if (req.NumHashtags.HasValue) patch["num_hashtags"] = req.NumHashtags.Value;
        if (req.MentionsCount.HasValue) patch["mentions_count"] = req.MentionsCount.Value;
        if (req.HasCallToAction.HasValue) patch["has_call_to_action"] = req.HasCallToAction.Value;
        if (req.CallToActionType != null) patch["call_to_action_type"] = req.CallToActionType;
        if (req.ContentTopic != null) patch["content_topic"] = req.ContentTopic;
        if (req.SentimentTone != null) patch["sentiment_tone"] = req.SentimentTone;
        if (req.CaptionLength.HasValue) patch["caption_length"] = req.CaptionLength.Value;
        if (req.FeaturesResidentStory.HasValue) patch["features_resident_story"] = req.FeaturesResidentStory.Value;
        if (req.CampaignName != null) patch["campaign_name"] = req.CampaignName;
        if (req.IsBoosted.HasValue) patch["is_boosted"] = req.IsBoosted.Value;
        if (req.BoostBudgetPhp.HasValue) patch["boost_budget_php"] = req.BoostBudgetPhp.Value;
        if (req.Impressions.HasValue) patch["impressions"] = req.Impressions.Value;
        if (req.Reach.HasValue) patch["reach"] = req.Reach.Value;
        if (req.Likes.HasValue) patch["likes"] = req.Likes.Value;
        if (req.Comments.HasValue) patch["comments"] = req.Comments.Value;
        if (req.Shares.HasValue) patch["shares"] = req.Shares.Value;
        if (req.Saves.HasValue) patch["saves"] = req.Saves.Value;
        if (req.ClickThroughs.HasValue) patch["click_throughs"] = req.ClickThroughs.Value;
        if (req.VideoViews.HasValue) patch["video_views"] = req.VideoViews.Value;
        if (req.EngagementRate.HasValue) patch["engagement_rate"] = req.EngagementRate.Value;
        if (req.ProfileVisits.HasValue) patch["profile_visits"] = req.ProfileVisits.Value;
        if (req.DonationReferrals.HasValue) patch["donation_referrals"] = req.DonationReferrals.Value;
        if (req.EstimatedDonationValuePhp.HasValue) patch["estimated_donation_value_php"] = req.EstimatedDonationValuePhp.Value;
        if (req.FollowerCountAtPost.HasValue) patch["follower_count_at_post"] = req.FollowerCountAtPost.Value;
        if (req.WatchTimeSeconds.HasValue) patch["watch_time_seconds"] = req.WatchTimeSeconds.Value;
        if (req.AvgViewDurationSeconds.HasValue) patch["avg_view_duration_seconds"] = req.AvgViewDurationSeconds.Value;
        if (req.SubscriberCountAtPost.HasValue) patch["subscriber_count_at_post"] = req.SubscriberCountAtPost.Value;
        if (req.Forwards.HasValue) patch["forwards"] = req.Forwards.Value;
        if (patch.Count == 0) return BadRequest(new { message = "No fields were provided to update." });

        var result = await db.UpdateAsync<SocialMediaPost>("social_media_posts", $"post_id=eq.{id}", patch);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id, [FromBody] DeleteRequest req)
    {
        if (req?.Confirm != "DELETE")
            return BadRequest(new { message = "Deletion must be confirmed by providing 'confirm': 'DELETE' in the request body." });

        var deleted = await db.DeleteAsync("social_media_posts", $"post_id=eq.{id}");
        if (!deleted) return BadRequest(new { message = "Unable to delete social media post." });
        return NoContent();
    }
}
