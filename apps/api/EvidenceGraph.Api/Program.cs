using System.Text;
using EvidenceGraph.Core.Entities;
using EvidenceGraph.Core.Interfaces;
using EvidenceGraph.Infrastructure.Data;
using EvidenceGraph.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? builder.Configuration["DATABASE_URL"]
    ?? "Host=localhost;Port=5432;Database=evidencegraph;Username=evidencegraph_app;Password=evidencegraph_dev_secret_pw!";

builder.Services.AddDbContext<EvidenceGraphDbContext>(options =>
{
    var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDb");
    if (useInMemory)
    {
        options.UseInMemoryDatabase("EvidenceGraphTestDb");
    }
    else
    {
        try
        {
            options.UseNpgsql(connectionString);
        }
        catch
        {
            options.UseInMemoryDatabase("EvidenceGraphFallbackDb");
        }
    }
});

// 2. Dependency Injection
builder.Services.AddSingleton<IStorageService, StorageService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IEvidenceIntegrityService, EvidenceIntegrityService>();
builder.Services.AddHttpClient<IAnalysisServiceClient, AnalysisServiceClient>();

// 3. Authentication & JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "EvidenceGraph_SuperSecure_JwtSecretKey_DevelopmentOnly_2026!_Min32Chars";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "EvidenceGraph.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "EvidenceGraph.Web";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Administrator"));
    options.AddPolicy("InvestigatorOrAbove", policy => policy.RequireRole("Administrator", "Investigator"));
    options.AddPolicy("AnalystOrAbove", policy => policy.RequireRole("Administrator", "Investigator", "Analyst"));
});

// 4. CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 5. Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EvidenceGraph API",
        Version = "v1",
        Description = "Authoritative Evidence System of Record & Investigative Intelligence API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddHealthChecks();

var app = builder.Build();

// 6. Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "EvidenceGraph API v1"));
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// 7. Initialize Database with Seed Data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EvidenceGraphDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await DbInitializer.InitializeAsync(db, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to initialize and seed database.");
    }
}

app.Run();

// For Integration Testing
public partial class Program { }
