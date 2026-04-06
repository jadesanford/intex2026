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
        var result = await db.InsertAsync<Safehouse>("safehouses", new
        {
            name = req.Name,
            safehouse_code = req.SafehouseCode,
            region = req.Region,
            city = req.City,
            province = req.Province,
            country = "Philippines",
            open_date = req.OpenDate,
            status = req.Status ?? "Active",
            capacity_girls = req.CapacityGirls,
            capacity_staff = req.CapacityStaff,
            current_occupancy = req.CurrentOccupancy ?? 0,
            notes = req.Notes
        });
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
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("safehouses", $"safehouse_id=eq.{id}");
        return NoContent();
    }
}
