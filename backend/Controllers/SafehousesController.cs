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
        var residents = await db.GetAllAsync<Resident>("residents", "select=safehouse_id,status");

        var result = safehouses.Select(s => new
        {
            s.Id, s.Name, s.Region, s.City, s.Capacity, s.Status,
            s.Latitude, s.Longitude, s.ContactPerson, s.ContactPhone, s.CreatedAt,
            currentResidents = residents.Count(r => r.SafehouseId == s.Id && r.Status == "active"),
            totalResidents = residents.Count(r => r.SafehouseId == s.Id)
        });
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var safehouse = await db.GetOneAsync<Safehouse>("safehouses", $"id=eq.{id}&select=*");
        if (safehouse == null) return NotFound();
        return Ok(safehouse);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SafehouseRequest req)
    {
        var result = await db.InsertAsync<Safehouse>("safehouses", new
        {
            name = req.Name, region = req.Region, city = req.City,
            capacity = req.Capacity, status = req.Status ?? "active",
            latitude = req.Latitude, longitude = req.Longitude,
            contact_person = req.ContactPerson, contact_phone = req.ContactPhone
        });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SafehouseRequest req)
    {
        var result = await db.UpdateAsync<Safehouse>("safehouses", $"id=eq.{id}", new
        {
            name = req.Name, region = req.Region, city = req.City,
            capacity = req.Capacity, status = req.Status,
            latitude = req.Latitude, longitude = req.Longitude,
            contact_person = req.ContactPerson, contact_phone = req.ContactPhone
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("safehouses", $"id=eq.{id}");
        return NoContent();
    }
}
