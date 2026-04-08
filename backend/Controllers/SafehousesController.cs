using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SafehousesController(SupabaseService db) : ControllerBase
{
    private async Task<int> NextSafehouseIdAsync()
    {
        var latest = await db.GetAllAsync<Safehouse>("safehouses", "select=safehouse_id&order=safehouse_id.desc&limit=1");
        return latest.Count == 0 ? 1 : latest[0].SafehouseId + 1;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var safehouses = await db.GetAllAsync<Safehouse>("safehouses", "select=*&order=name.asc");
        return Ok(safehouses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var safehouse = await db.GetOneAsync<Safehouse>("safehouses", $"safehouse_id=eq.{id}&select=*");
        if (safehouse == null) return NotFound();

        var residents = await db.GetAllAsync<Resident>("residents",
            $"safehouse_id=eq.{id}&select=resident_id,case_status,current_risk_level,case_control_no");
        var metrics = await db.GetAllAsync<SafehouseMonthlyMetric>("safehouse_monthly_metrics",
            $"safehouse_id=eq.{id}&select=*&order=month_start.desc&limit=6");

        return Ok(new { safehouse, residents, metrics });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SafehouseRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Name is required." });

        var id = await NextSafehouseIdAsync();
        var (result, err) = await db.TryInsertAsync<Safehouse>("safehouses", new
        {
            safehouse_id = id,
            name = req.Name.Trim(),
            safehouse_code = req.SafehouseCode,
            region = req.Region,
            city = req.City,
            province = req.Province,
            country = "Philippines",
            open_date = string.IsNullOrWhiteSpace(req.OpenDate) ? null : req.OpenDate,
            status = req.Status ?? "Active",
            capacity_girls = req.CapacityGirls,
            capacity_staff = req.CapacityStaff,
            current_occupancy = req.CurrentOccupancy ?? 0,
            notes = req.Notes
        });
        if (result == null)
            return BadRequest(new { message = err ?? "Unable to create safehouse." });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SafehouseRequest req)
    {
        var result = await db.UpdateAsync<Safehouse>("safehouses", $"safehouse_id=eq.{id}", new
        {
            name = req.Name,
            safehouse_code = req.SafehouseCode,
            region = req.Region,
            city = req.City,
            province = req.Province,
            open_date = req.OpenDate,
            status = req.Status,
            capacity_girls = req.CapacityGirls,
            capacity_staff = req.CapacityStaff,
            current_occupancy = req.CurrentOccupancy,
            notes = req.Notes
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "InternalStaff")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await db.DeleteAsync("safehouses", $"safehouse_id=eq.{id}");
        if (!ok)
            return Conflict(new { message = "Unable to delete this safehouse. It may still be linked to residents or other records." });
        return NoContent();
    }
}
