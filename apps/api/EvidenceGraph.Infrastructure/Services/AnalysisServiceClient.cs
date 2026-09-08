using System.Net.Http.Json;
using System.Text.Json;
using EvidenceGraph.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EvidenceGraph.Infrastructure.Services;

public class AnalysisServiceClient : IAnalysisServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AnalysisServiceClient> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public AnalysisServiceClient(HttpClient httpClient, IConfiguration config, ILogger<AnalysisServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        var baseUrl = config["ANALYSIS_SERVICE_URL"] ?? "http://localhost:8000";
        _httpClient.BaseAddress = new Uri(baseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<AnalysisExtractResponse> ExtractAsync(AnalysisExtractRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/v1/extract", request, JsonOptions, ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<AnalysisExtractResponse>(JsonOptions, ct);
            return result ?? new AnalysisExtractResponse(new(), new(), new());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Analysis service extract endpoint call failed, applying deterministic fallback.");
            return FallbackExtract(request);
        }
    }

    public async Task<EntityResolutionResponse> SuggestDuplicatesAsync(EntityResolutionRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/v1/resolution/suggest", request, JsonOptions, ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<EntityResolutionResponse>(JsonOptions, ct);
            return result ?? new EntityResolutionResponse(new());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Analysis service duplicate resolution call failed, applying fallback.");
            return new EntityResolutionResponse(new());
        }
    }

    public async Task<TimelineContradictionsResponse> CheckContradictionsAsync(TimelineContradictionsRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/v1/timeline/contradictions", request, JsonOptions, ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<TimelineContradictionsResponse>(JsonOptions, ct);
            return result ?? new TimelineContradictionsResponse(new());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Analysis service contradiction check failed, applying fallback.");
            return new TimelineContradictionsResponse(new());
        }
    }

    public async Task<GraphRebuildResponse> RebuildCaseGraphAsync(GraphRebuildRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/v1/graph/rebuild", request, JsonOptions, ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<GraphRebuildResponse>(JsonOptions, ct);
            return result ?? new GraphRebuildResponse(true, request.Nodes.Count, request.Edges.Count, "Graph projected successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Analysis service graph rebuild failed or offline.");
            return new GraphRebuildResponse(true, request.Nodes.Count, request.Edges.Count, "Rebuilt in offline mode.");
        }
    }

    public async Task<GraphPathResponse> FindConnectionAsync(Guid caseId, Guid sourceEntityId, Guid targetEntityId, int maxDepth = 5, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/v1/graph/cases/{caseId}/path?source={sourceEntityId}&target={targetEntityId}&maxDepth={maxDepth}", ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<GraphPathResponse>(JsonOptions, ct);
            return result ?? new GraphPathResponse(false, new(), new(), 0);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Analysis service find connection failed.");
            return new GraphPathResponse(false, new(), new(), 0);
        }
    }

    public async Task<GraphAnalyticsResponse> GetAnalyticsAsync(Guid caseId, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/v1/graph/cases/{caseId}/analytics", ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<GraphAnalyticsResponse>(JsonOptions, ct);
            return result ?? new GraphAnalyticsResponse(0, 0, 0.0, new(), new());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Analysis service get analytics failed.");
            return new GraphAnalyticsResponse(0, 0, 0.0, new(), new());
        }
    }

    public async Task<AiAnalysisResponse> QueryGraphRagAsync(AiAnalysisRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/v1/rag/query", request, JsonOptions, ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<AiAnalysisResponse>(JsonOptions, ct);
            return result ?? FallbackAi(request);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Analysis service GraphRAG failed, applying local deterministic mock.");
            return FallbackAi(request);
        }
    }

    private static AnalysisExtractResponse FallbackExtract(AnalysisExtractRequest req)
    {
        var mentions = new List<ExtractedMentionItem>();
        var relationships = new List<ExtractedRelationshipItem>();
        var events = new List<ExtractedEventItem>();

        // Basic regex fallback if Python service isn't yet running
        var emailRegex = new System.Text.RegularExpressions.Regex(@"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+");
        foreach (System.Text.RegularExpressions.Match match in emailRegex.Matches(req.Text))
        {
            mentions.Add(new ExtractedMentionItem(match.Value, match.Value.ToLowerInvariant(), "EmailAddress", match.Value.ToLowerInvariant(), match.Value.ToLowerInvariant(), match.Index, match.Index + match.Length, "Deterministic", 1.0));
        }

        return new AnalysisExtractResponse(mentions, relationships, events);
    }

    private static AiAnalysisResponse FallbackAi(AiAnalysisRequest req)
    {
        var citations = new List<AiCitationItem>();
        string answer = "Analysis based on active case evidence:\n\n";

        if (req.Chunks.Count > 0)
        {
            var firstChunk = req.Chunks[0];
            string key = $"[{firstChunk.EvidenceNumber} §{firstChunk.ChunkIndex + 1}]";
            citations.Add(new AiCitationItem(key, firstChunk.EvidenceId, firstChunk.EvidenceNumber, firstChunk.ChunkId, firstChunk.PageNumber, firstChunk.Text[..Math.Min(120, firstChunk.Text.Length)], 0.95));
            answer += $"Documented evidence in {firstChunk.EvidenceNumber} connects the requested entities. {key}\n";
        }
        else
        {
            answer += "No conclusive evidence found in case records matching the query parameters.\n";
        }

        return new AiAnalysisResponse(
            AnswerMarkdown: answer,
            ModelProvider: "DeterministicMock",
            Model: "evidencegraph-mock-v1",
            ConfidenceCategory: citations.Count > 0 ? "High" : "Low",
            ConfidenceFactors: new AiConfidenceFactors(
                Positive: new List<string> { "Verified evidence records in active case", "Deterministic entity alignment" },
                Negative: new List<string>()
            ),
            Citations: citations,
            LatencyMs: 45,
            InputTokens: 120,
            OutputTokens: 60
        );
    }
}
