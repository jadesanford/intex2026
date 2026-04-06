using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenArms.Api.Models;
using OpenArms.Api.Services;

namespace OpenArms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PartnersController(SupabaseService db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var partners = await db.GetAllAsync<Partner>("partners", "select=*&order=name.asc");
        return Ok(partners);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var partner = await db.GetOneAsync<Partner>("partners", $"id=eq.{id}&select=*");
        if (partner == null) return NotFound();
        return Ok(partner);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PartnerRequest req)
    {
        var result = await db.InsertAsync<Partner>("partners", new
        {
            name = req.Name, type = req.Type, country = req.Country,
            contact_person = req.ContactPerson, contact_email = req.ContactEmail,
            website = req.Website, active_status = req.ActiveStatus ?? true, notes = req.Notes
        });
        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] PartnerRequest req)
    {
        var result = await db.UpdateAsync<Partner>("partners", $"id=eq.{id}", new
        {
            name = req.Name, type = req.Type, country = req.Country,
            contact_person = req.ContactPerson, contact_email = req.ContactEmail,
            website = req.Website, active_status = req.ActiveStatus, notes = req.Notes
        });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await db.DeleteAsync("partners", $"id=eq.{id}");
        return NoContent();
    }
}
