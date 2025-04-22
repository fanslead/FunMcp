namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ApplicationController(FunMcpDbContext dbContext, IMemoryCache memoryCache) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<Application>>(StatusCodes.Status200OK)]
    public async Task<Ok<List<Application>>> GetApplications(string? filter)
    {
        var query = dbContext.Applications.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter))
        {
            query = query.Where(x => x.Name.Contains(filter) || x.Description.Contains(filter));
        }

        var applications = await query.ToListAsync();
        return TypedResults.Ok(applications);
    }

    [HttpGet]
    [Route("{id}")]
    [ProducesResponseType<Ok<Application>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<Application>, NotFound>> GetApplication(string id)
    {
        var application = await dbContext.Applications.FirstOrDefaultAsync(x => x.Id == id);
        if (application == null)
        {
            return TypedResults.NotFound();
        }
        return TypedResults.Ok(application);
    }

    [HttpPost]
    [ProducesResponseType<Created<Application>>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Created<Application>, BadRequest>> CreateApplication([FromBody] ApplicationCreateDto dto)
    {
        var application = new Application
        {
            Name = dto.Name,
            Description = dto.Description,
            Id = Guid.NewGuid().ToString(),
            ApiKey = Guid.NewGuid().ToString()
        };

        await dbContext.Applications.AddAsync(application);
        await dbContext.SaveChangesAsync();
        var location = Url.Action(nameof(CreateApplication), new { id = application.Id }) ?? $"/{application.Id}";
        return TypedResults.Created(location, application);
    }

    [HttpPut]
    [Route("{id}")]
    [ProducesResponseType<NoContent>(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<NotFound, NoContent>> UpdateApplication(string id, [FromBody] ApplicationUpdateDto application)
    {
        var existingApplication = await dbContext.Applications.FirstOrDefaultAsync(x => x.Id == id);
        if (existingApplication == null)
        {
            return TypedResults.NotFound();
        }
        existingApplication.Name = application.Name;
        existingApplication.Description = application.Description;
        dbContext.Applications.Update(existingApplication);
        await dbContext.SaveChangesAsync();
        memoryCache.Remove(existingApplication.ApiKey);
        return TypedResults.NoContent();
    }

    [HttpDelete]
    [Route("{id}")]
    [ProducesResponseType<NoContent>(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<NotFound, NoContent>> DeleteApplication(string id)
    {
        var application = await dbContext.Applications.FirstOrDefaultAsync(x => x.Id == id);
        if (application == null)
        {
            return TypedResults.NotFound();
        }
        dbContext.Applications.Remove(application);
        await dbContext.SaveChangesAsync();
        return TypedResults.NoContent();
    }

    [HttpPut]
    [Route("RefreshApiKey/{id}")]
    [ProducesResponseType<NoContent>(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<NotFound, NoContent>> RefreshApiKey(string id)
    {
        var existingApplication = await dbContext.Applications.FirstOrDefaultAsync(x => x.Id == id);
        if (existingApplication == null)
        {
            return TypedResults.NotFound();
        }
        var oldKey = existingApplication.ApiKey;
        existingApplication.ApiKey = Guid.NewGuid().ToString();
        dbContext.Applications.Update(existingApplication);
        await dbContext.SaveChangesAsync();
        memoryCache.Remove(existingApplication.ApiKey);

        return TypedResults.NoContent();
    }
}
